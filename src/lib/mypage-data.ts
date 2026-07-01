import type { UserType } from "@/context/diagnosis-context";
import type { MyDiagnosisEntry, TrendDirection } from "./users-api";

export type { TrendDirection };

export type ReportHistoryEntry = {
  id: string;
  month: string;
  grade: "A" | "B" | "C" | "D";
  co2Tons: number;
  usageKwh: number | null;
  userType: UserType;
  address: string | null;
  changePercent: number | null;
  isIncrease: boolean;
  isLatest: boolean;
};

export const GRADE_COLOR_HEX: Record<ReportHistoryEntry["grade"], string> = {
  A: "#1ba77d",
  B: "#7bc9a6",
  C: "#e0a23a",
  D: "#d9764a",
};

// 백엔드 src/common/grade.ts의 getGradeForKg와 동일한 임계값(톤 단위).
export function getGradeForKg(
  targetEmissionKg: number,
): ReportHistoryEntry["grade"] {
  const tons = targetEmissionKg / 1000;
  if (tons <= 1.5) return "A";
  if (tons <= 2.3) return "B";
  if (tons <= 3.0) return "C";
  return "D";
}

const KNOWN_USER_TYPES: UserType[] = ["소상공인", "일반가구", "취약계층"];

function toUserType(target: string): UserType {
  return KNOWN_USER_TYPES.includes(target as UserType)
    ? (target as UserType)
    : "일반가구";
}

export function toMonthLabel(
  billingMonth: string | null,
  createdAt: string,
): string {
  const [year, month] = (billingMonth ?? createdAt.slice(0, 7)).split("-");
  return `${year}년 ${Number(month)}월`;
}

// 마이페이지 진단 이력 카드가 기대하는 모양으로 변환한다. 백엔드 응답은
// createdAt 내림차순으로 오므로, 바로 다음 인덱스가 그 직전 진단이다.
export function toReportHistoryEntries(
  diagnoses: MyDiagnosisEntry[],
): ReportHistoryEntry[] {
  return diagnoses.map((diagnosis, index) => {
    const previous = diagnoses[index + 1];
    const changePercent =
      previous && previous.co2Tons > 0
        ? Math.round(
            ((diagnosis.co2Tons - previous.co2Tons) / previous.co2Tons) * 1000,
          ) / 10
        : null;

    return {
      id: diagnosis.id,
      month: toMonthLabel(diagnosis.billingMonth, diagnosis.createdAt),
      grade: diagnosis.grade,
      co2Tons: diagnosis.co2Tons,
      usageKwh: diagnosis.usageKwh,
      userType: toUserType(diagnosis.target),
      address: diagnosis.address,
      changePercent: changePercent !== null ? Math.abs(changePercent) : null,
      isIncrease: changePercent !== null ? changePercent > 0 : false,
      isLatest: index === 0,
    };
  });
}
