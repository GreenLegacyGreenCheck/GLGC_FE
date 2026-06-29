import type { UserType } from "@/context/diagnosis-context";

// Reference stats for monthly household electricity usage — designed
// defaults (no real dataset available yet), tune once real bills are seen.
export const REFERENCE_MONTHLY_KWH_MEAN = 350;
export const REFERENCE_MONTHLY_KWH_STDDEV = 120;

const SMALL_BUSINESS_ZSCORE_THRESHOLD = 1.5;
const VULNERABLE_ZSCORE_THRESHOLD = -1.0;
const COMMERCIAL_CONTRACT_KEYWORDS = [
  "일반용",
  "산업용",
  "사업용",
  "영업용",
  "업무용",
];
// Residential contract types (주택용/아파트용/가정용 etc.) intentionally
// have no forced mapping — they default to 일반가구 via the z-score
// thresholds below, which still promotes outlier usage to 소상공인/취약계층.
// 취약계층 has no contract-type signal at all: bills print a welfare
// -discount eligibility notice on every bill regardless of the customer's
// actual status, so it isn't a reliable extraction target (see
// ocr-extract.ts) — usage z-score is the only signal for this category.

export type ClassificationInput = {
  usageKwh: number | null;
  contractType: string | null;
};

export type ClassificationOutput = {
  userType: UserType;
  zScore: number;
};

export function classifyUser({
  usageKwh,
  contractType,
}: ClassificationInput): ClassificationOutput {
  if (usageKwh === null) {
    return { userType: "일반가구", zScore: 0 };
  }

  const zScore =
    (usageKwh - REFERENCE_MONTHLY_KWH_MEAN) / REFERENCE_MONTHLY_KWH_STDDEV;

  if (
    contractType &&
    COMMERCIAL_CONTRACT_KEYWORDS.some((keyword) =>
      contractType.includes(keyword),
    )
  ) {
    return { userType: "소상공인", zScore };
  }

  if (zScore >= SMALL_BUSINESS_ZSCORE_THRESHOLD) {
    return { userType: "소상공인", zScore };
  }

  if (zScore <= VULNERABLE_ZSCORE_THRESHOLD) {
    return { userType: "취약계층", zScore };
  }

  return { userType: "일반가구", zScore };
}
