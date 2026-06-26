import type {
  DiagnosisResult,
  OcrExtraction,
} from "@/context/diagnosis-context";
import { classifyUser } from "./classification";
import { recognizeBillImage } from "./ocr";
import { extractBillFields } from "./ocr-extract";
import { calculateScope2 } from "./scope2";

export type PipelineStepId = "ocr" | "scope2" | "classify" | "report";

export type PipelineInput = {
  electricFile: File;
  gasFile: File | null;
};

async function recognizeAndExtract(file: File): Promise<OcrExtraction> {
  const { text, confidence } = await recognizeBillImage(file);

  return extractBillFields(text, confidence);
}

export async function runDiagnosisPipeline(
  { electricFile, gasFile }: PipelineInput,
  onProgress: (step: PipelineStepId) => void,
): Promise<DiagnosisResult> {
  onProgress("ocr");

  const electricOcr = await recognizeAndExtract(electricFile);
  const gasOcr = gasFile
    ? await recognizeAndExtract(gasFile).catch(() => null)
    : null;

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

  onProgress("report");

  const confidences = [electricOcr.confidence, gasOcr?.confidence].filter(
    (value): value is number => typeof value === "number",
  );
  const averageOcrConfidence =
    confidences.reduce((sum, value) => sum + value, 0) / confidences.length;

  return {
    electricOcr,
    gasOcr,
    totalCo2Kg: scope2.totalCo2Kg,
    userType,
    userTypeOverridden: false,
    zScore,
    averageOcrConfidence,
  };
}
