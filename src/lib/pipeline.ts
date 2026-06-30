import type {
  DiagnosisResult,
  OcrExtraction,
} from "@/context/diagnosis-context";
import { classifyUser } from "./classification";
import { createDiagnosis } from "./diagnosis-api";
import { recognizeBillImage } from "./ocr";
import { extractBillFields } from "./ocr-extract";
import { calculateScope2, toGasMegajoules } from "./scope2";

export type PipelineStepId = "ocr" | "scope2" | "classify" | "report";

export type PipelineInput = {
  electricFile: File;
  gasFile: File | null;
  address?: string;
  token?: string | null;
};

async function recognizeAndExtract(file: File): Promise<OcrExtraction> {
  const { text, confidence, words } = await recognizeBillImage(file);

  return extractBillFields(text, confidence, words);
}

export async function runDiagnosisPipeline(
  { electricFile, gasFile, address, token }: PipelineInput,
  onProgress: (step: PipelineStepId) => void,
): Promise<DiagnosisResult> {
  onProgress("ocr");

  const electricOcr = await recognizeAndExtract(electricFile);
  console.log("[GreenCheck] 전기 고지서 OCR 결과:", {
    usageKwh: electricOcr.usageKwh.value,
    contractType: electricOcr.contractType.value,
    billingMonth: electricOcr.billingMonth.value,
    pageConfidence: electricOcr.confidence,
    rawText: electricOcr.rawText,
  });

  const gasOcr = gasFile
    ? await recognizeAndExtract(gasFile).catch(() => null)
    : null;

  if (gasOcr) {
    console.log("[GreenCheck] 가스 고지서 OCR 결과:", {
      usageM3: gasOcr.usageM3.value,
      billingMonth: gasOcr.billingMonth.value,
      pageConfidence: gasOcr.confidence,
      rawText: gasOcr.rawText,
    });
  }

  onProgress("scope2");

  const scope2 = calculateScope2({
    usageKwh: electricOcr.usageKwh.value,
    usageM3: gasOcr?.usageM3.value ?? null,
  });

  onProgress("classify");

  const { userType, zScore } = classifyUser({
    usageKwh: electricOcr.usageKwh.value,
    contractType: electricOcr.contractType.value,
  });

  const billingMonth =
    electricOcr.billingMonth.value ?? gasOcr?.billingMonth.value ?? null;

  const { diagnosisId, recommendedActions } = await createDiagnosis(
    {
      target: userType,
      electricityRatio:
        scope2.totalCo2Kg > 0 ? scope2.electricityCo2Kg / scope2.totalCo2Kg : 0,
      gasRatio: scope2.totalCo2Kg > 0 ? scope2.gasCo2Kg / scope2.totalCo2Kg : 0,
      targetEmissionKg: scope2.totalCo2Kg,
      ...(address ? { address } : {}),
      ...(electricOcr.usageKwh.value !== null
        ? { usageKwh: electricOcr.usageKwh.value }
        : {}),
      ...(gasOcr?.usageM3.value != null
        ? { gasUsageMj: toGasMegajoules(gasOcr.usageM3.value) ?? undefined }
        : {}),
      ...(billingMonth ? { billingMonth } : {}),
    },
    token,
  );

  onProgress("report");

  // Average confidence over only the fields the app actually relies on
  // (user type, billing month, electricity/gas usage) AND that were
  // actually found — a field we never located on this particular bill is a
  // coverage gap (already surfaced as "직접 입력 필요" in the UI), not a low
  // -confidence read, so it shouldn't drag this number down to 0.
  const relevantFields = [
    electricOcr.usageKwh,
    electricOcr.contractType,
    electricOcr.billingMonth,
    gasOcr?.usageM3,
  ];
  const matchedConfidences = relevantFields
    .map((field) => (field && field.value !== null ? field.confidence : null))
    .filter((value): value is number => value !== null);
  const averageOcrConfidence =
    matchedConfidences.length > 0
      ? matchedConfidences.reduce((sum, value) => sum + value, 0) /
        matchedConfidences.length
      : 0;

  const [billingYear, billingMonthNumber] = billingMonth
    ? billingMonth.split("-")
    : [null, null];

  console.log("[GreenCheck] 추출된 고지서 정보:", {
    userType,
    year: billingYear,
    month: billingMonthNumber,
    electricityKwh: electricOcr.usageKwh.value,
    gasM3: gasOcr?.usageM3.value ?? null,
  });

  return {
    electricOcr,
    gasOcr,
    totalCo2Kg: scope2.totalCo2Kg,
    userType,
    userTypeOverridden: false,
    zScore,
    averageOcrConfidence,
    diagnosisId,
    recommendedActions,
    hasGasBill: gasFile !== null,
  };
}
