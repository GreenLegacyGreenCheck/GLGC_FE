import type { UserType } from "@/context/diagnosis-context";

// Dummy mypage content matching the current design. Once login/report
// history are backed by a real account, this should be replaced by a GET
// response instead of a static constant (see report-data.ts for the same
// pattern already used for the report page).
export type TrendDirection = "improving" | "steady" | "worsening";

export type ReportHistoryEntry = {
  month: string;
  grade: "A" | "B" | "C" | "D";
  co2Tons: number;
  usageKwh: number;
  userType: UserType;
  address: string;
  changePercent: number | null;
  isIncrease: boolean;
  isLatest: boolean;
};

export type MyPageData = {
  userEmail: string;
  diagnosisCount: number;
  lowestEmissionTons: number;
  recentTrend: TrendDirection;
  trendChangePercent: number;
  trendChangeLabel: string;
  trendSparkline: number[];
  trendMonthLabels: { first: string; last: string };
  reportHistory: ReportHistoryEntry[];
};

export const GRADE_COLOR_HEX: Record<ReportHistoryEntry["grade"], string> = {
  A: "#1ba77d",
  B: "#7bc9a6",
  C: "#e0a23a",
  D: "#d9764a",
};

export const DUMMY_MYPAGE: MyPageData = {
  userEmail: "user@example.com",
  diagnosisCount: 5,
  lowestEmissionTons: 2.51,
  recentTrend: "improving",
  trendChangePercent: -10.7,
  trendChangeLabel: "5개월간 감축",
  trendSparkline: [3.18, 3.02, 2.67, 2.51, 2.84],
  trendMonthLabels: { first: "1월", last: "5월" },
  reportHistory: [
    {
      month: "2025년 5월",
      grade: "C",
      co2Tons: 2.84,
      usageKwh: 330,
      userType: "소상공인",
      address: "서울 마포구",
      changePercent: 13.1,
      isIncrease: true,
      isLatest: true,
    },
    {
      month: "2025년 4월",
      grade: "B",
      co2Tons: 2.51,
      usageKwh: 306,
      userType: "소상공인",
      address: "서울 마포구",
      changePercent: 6,
      isIncrease: false,
      isLatest: false,
    },
    {
      month: "2025년 3월",
      grade: "C",
      co2Tons: 2.67,
      usageKwh: 324,
      userType: "일반가구",
      address: "서울 마포구",
      changePercent: 11.5,
      isIncrease: false,
      isLatest: false,
    },
    {
      month: "2025년 2월",
      grade: "D",
      co2Tons: 3.02,
      usageKwh: 368,
      userType: "소상공인",
      address: "서울 마포구",
      changePercent: 5,
      isIncrease: false,
      isLatest: false,
    },
    {
      month: "2025년 1월",
      grade: "D",
      co2Tons: 3.18,
      usageKwh: 387,
      userType: "소상공인",
      address: "서울 마포구",
      changePercent: null,
      isIncrease: false,
      isLatest: false,
    },
  ],
};
