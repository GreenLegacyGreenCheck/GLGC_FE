"use client";

import ReportView from "@/components/ReportView";
import BottomNavigation from "@/components/BottomNavigation";
import { RefreshIcon, SproutIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import { diagnoseWithXgboost } from "@/lib/diagnosis-api";
import { getAiInsight, type AiInsightResult } from "@/lib/ai-api";
import { DUMMY_REPORT } from "@/lib/report-data";
import { mergeXgboostResult } from "@/lib/report-merge";
import { downloadReportPdf } from "@/lib/report-pdf";
import { toGasMegajoules } from "@/lib/scope2";
import { getMyDiagnoses } from "@/lib/users-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const {
    address,
    result,
    status,
    isHydrated,
    esgSurveyAnswers,
    setAiActionReasons,
    xgboostResult: persistedXgboostResult,
    setXgboostResult: persistXgboostResult,
  } = useDiagnosis();
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiInsight, setAiInsight] = useState<AiInsightResult | null>(null);
  const [xgboostResult, setXgboostResult] = useState(persistedXgboostResult);
  const reportRef = useRef<HTMLDivElement>(null);
  // Gemini는 XGBoost 결과 하나당 한 번만 호출한다 — context 업데이트로
  // 컴포넌트가 리렌더링돼도 중복 호출되지 않도록 ref로 추적한다.
  const aiInsightCalledRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!result) {
      // 분석이 진행 중이면 /analyzing으로, 아예 없으면 /upload로
      router.replace(status === "running" ? "/analyzing" : "/upload");
      return;
    }
    // 알림으로 /report에 직접 진입했는데 ESG 설문을 아직 안 했으면
    // /analyzing으로 보내 설문을 먼저 받는다.
    if (!esgSurveyAnswers) {
      router.replace("/analyzing");
    }
  }, [isHydrated, result, status, esgSurveyAnswers, router]);

  // /analyzing이 XGBoost를 미리 실행해 context에 저장했으면(신규 진단 직후)
  // 재호출 없이 AI 인사이트만 받아온다. context가 비어있으면(새 탭·새로고침)
  // 전월 이력 조회부터 전체 플로우를 실행한다.
  useEffect(() => {
    if (!result) return;

    const hasAnswers = Boolean(
      esgSurveyAnswers && Object.keys(esgSurveyAnswers).length > 0,
    );

    async function run() {
      if (xgboostResult) {
        // XGBoost 결과가 이미 있으면 Gemini만 호출 (한 번만)
        if (!aiInsightCalledRef.current) {
          aiInsightCalledRef.current = true;
          getAiInsight(xgboostResult, result?.recommendedActions ?? [])
            .then((insight) => {
              if (isMountedRef.current) {
                setAiInsight(insight);
                setAiActionReasons(insight.actionReasons);
              }
            })
            .catch(() => {});
        }
        return;
      }

      // 새 세션·새로고침: 전월 이력 조회 후 XGBoost 전체 실행
      let prevElecKwh: number | null = null;
      if (token) {
        try {
          const { diagnoses } = await getMyDiagnoses(token);
          const previous = diagnoses.find(
            (d) => d.id !== result?.diagnosisId && d.usageKwh !== null,
          );
          prevElecKwh = previous?.usageKwh ?? null;
        } catch {
          prevElecKwh = null;
        }
      }

      if (!isMountedRef.current || !result) return;

      try {
        const diagnoseResult = await diagnoseWithXgboost({
          elecKwh: result.electricOcr?.usageKwh.value ?? 0,
          gasMj: toGasMegajoules(result.gasOcr?.usageM3.value ?? null),
          deviceUsage: {},
          esgAnswers: hasAnswers ? esgSurveyAnswers : null,
          prevElecKwh,
        });

        if (!isMountedRef.current) return;

        setXgboostResult(diagnoseResult);
        persistXgboostResult(diagnoseResult);

        if (!aiInsightCalledRef.current) {
          aiInsightCalledRef.current = true;
          getAiInsight(diagnoseResult, result?.recommendedActions ?? [])
            .then((insight) => {
              if (isMountedRef.current) {
                setAiInsight(insight);
                setAiActionReasons(insight.actionReasons);
              }
            })
            .catch(() => {});
        }
      } catch {
        // XGBoost 실패 시 더미 데이터로 리포트 표시
      }
    }

    run();
    // persistXgboostResult·setAiActionReasons는 context setter라서 state가
    // 바뀔 때마다 새 참조로 재생성된다 — deps에 넣으면 XGBoost/Gemini 호출
    // 뒤 state 업데이트마다 effect가 재실행돼 Gemini가 반복 호출된다.
    // xgboostResult도 제외: analyzing이 비동기로 채울 때 재실행 방지.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, esgSurveyAnswers, token]);

  if (!result) {
    return null;
  }

  // 분석 결과가 아직 없으면(새 탭·새로고침 시 XGBoost 응답 대기 중)
  // 리포트 대신 새싹 스피너를 보여준다.
  if (!xgboostResult) {
    return (
      <>
        <div className="scrollbar-hidden flex h-screen flex-col sm:h-full">
          <header className="sticky top-0 z-10 bg-[#f2faf6] pt-8">
            <div className="flex items-center justify-between px-5 pb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/user-type"
                  className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
                  aria-label="사용자 유형 확인으로 돌아가기"
                >
                  <ChevronLeftIcon />
                </Link>
                <h1 className="ml-3 text-xl font-black">탄소배출 진단 결과</h1>
              </div>
              <span className="mr-4 text-lg font-black text-[#78a091]">
                3/3
              </span>
            </div>
            <div className="h-1 bg-[#d8f2ea]">
              <div className="h-full w-full bg-[#1ba77d]" />
            </div>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="relative grid size-24 place-items-center rounded-full">
              <span className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]" />
              <span
                className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]"
                style={{ animationDelay: "0.9s" }}
              />
              <SproutIcon className="size-10 text-[#1ba77d]" />
            </div>
            <p className="text-sm font-bold text-[#789b8c]">
              리포트를 불러오고 있어요...
            </p>
          </div>
        </div>
        <BottomNavigation activeLabel="진단 리포트" />
      </>
    );
  }

  const hasEsgAnswers = Boolean(
    esgSurveyAnswers && Object.keys(esgSurveyAnswers).length > 0,
  );
  const report = mergeXgboostResult(
    DUMMY_REPORT,
    xgboostResult,
    hasEsgAnswers,
    aiInsight
      ? {
          aiSummary: aiInsight.aiSummary,
          aiEvidenceBullets: aiInsight.aiEvidenceBullets,
          aiActionReasons: aiInsight.actionReasons,
        }
      : undefined,
  );

  const handleDownload = async () => {
    if (!reportRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      await downloadReportPdf(reportRef.current);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="bg-[#f2faf6] pt-8 sticky top-0 z-10">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/user-type"
                className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
                aria-label="사용자 유형 확인으로 돌아가기"
              >
                <ChevronLeftIcon />
              </Link>
              <h1 className="text-xl font-black ml-3">탄소배출 진단 결과</h1>
            </div>
            <span className="text-lg font-black mr-4 text-[#78a091]">3/3</span>
          </div>
          <div className="h-1 bg-[#d8f2ea]">
            <div className="h-full w-full bg-[#1ba77d]" />
          </div>
        </header>

        <section className="px-5 pb-7 pt-8">
          <ReportView ref={reportRef} report={report} address={address} />

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="mt-8 w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white disabled:opacity-60"
          >
            {isDownloading ? "PDF 생성 중..." : "리포트 PDF 다운로드"}
          </button>

          <Link
            href="/actions"
            className="mt-3 block w-full rounded-2xl border-2 border-[#1ba77d] bg-white px-6 py-5 text-center text-xl font-black text-[#1ba77d]"
          >
            감축 액션 추천 보기
          </Link>

          <div className="mt-6 text-center">
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 text-sm font-black text-[#1ba77d]"
            >
              <RefreshIcon className="size-4" />
              다시 진단받기
            </Link>
          </div>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
