import type { UserType } from "@/context/diagnosis-context";

// Reference stats for monthly household electricity usage — designed
// defaults (no real dataset available yet), tune once real bills are seen.
export const REFERENCE_MONTHLY_KWH_MEAN = 350;
export const REFERENCE_MONTHLY_KWH_STDDEV = 120;

const SMALL_BUSINESS_ZSCORE_THRESHOLD = 1.5;
const VULNERABLE_ZSCORE_THRESHOLD = -1.0;
const COMMERCIAL_CONTRACT_KEYWORDS = ["일반용", "산업용"];

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
