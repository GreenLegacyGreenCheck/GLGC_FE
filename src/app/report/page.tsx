"use client";

import ReportView from "@/components/ReportView";
import BottomNavigation from "@/components/BottomNavigation";
import { RefreshIcon, SproutIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import { diagnoseWithXgboost } from "@/lib/diagnosis-api";
import { getAiInsight } from "@/lib/ai-api";
import type { AiInsightResult } from "@/context/diagnosis-context";
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
    aiInsight: persistedAiInsight,
    setAiInsight: persistAiInsight,
  } = useDiagnosis();
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  // 로컬 state는 마운트 시 context 값으로 초기화 — /analyzing에서 미리 채워두면
  // 스피너 없이 바로 렌더링되고, 새로고침 시에는 여기서 재호출한다.
  const [xgboostResult, setXgboostResult] = useState(persistedXgboostResult);
  const [aiInsight, setAiInsight] = useState<AiInsightResult | null>(
    persistedAiInsight,
  );
  const reportRef = useRef<HTMLDivElement>(null);
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

  // /analyzing에서 XGBoost + Gemini를 미리 실행해 context에 저장했으면
  // 둘 다 이미 로컬 state에 채워진 상태라 effect가 할 일 없이 바로 렌더링된다.
  // context가 비어있으면(새 탭·새로고침) 부족한 부분만 채운다.
  useEffect(() => {
    if (!result) return;
    // 둘 다 있으면 아무것도 할 필요 없음
    if (xgboostResult && aiInsight) return;

    const hasAnswers = Boolean(
      esgSurveyAnswers && Object.keys(esgSurveyAnswers).length > 0,
    );

    async function run() {
      let xgb = xgboostResult;

      if (!xgb) {
        // XGBoost 없으면 전월 이력 조회 후 실행
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
          xgb = await diagnoseWithXgboost({
            elecKwh: result.electricOcr?.usageKwh.value ?? 0,
            gasMj: toGasMegajoules(result.gasOcr?.usageM3.value ?? null),
            deviceUsage: {},
            esgAnswers: hasAnswers ? esgSurveyAnswers : null,
            prevElecKwh,
          });
        } catch {
          return;
        }

        if (!isMountedRef.current) return;
        setXgboostResult(xgb);
        persistXgboostResult(xgb);
      }

      // Gemini: xgboostResult가 방금 채워졌거나 있었는데 aiInsight가 없는 경우
      getAiInsight(xgb, result?.recommendedActions ?? [])
        .then((insight) => {
          if (isMountedRef.current) {
            setAiInsight(insight);
            persistAiInsight(insight);
            setAiActionReasons(insight.actionReasons);
          }
        })
        .catch(() => {});
    }

    run();
    // context setter들은 매 렌더마다 새 참조 — deps에 넣으면 Gemini 응답 후
    // effect가 재실행돼 무한 루프가 생긴다. xgboostResult/aiInsight도 제외.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, esgSurveyAnswers, token]);

  if (!result) {
    return null;
  }

  // XGBoost + Gemini 둘 다 준비되면 리포트를 한 번에 렌더링한다.
  // 어느 하나라도 없으면 스피너로 대기한다.
  if (!xgboostResult || !aiInsight) {
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
            <p className="mt-5 text-sm font-bold text-[#789b8c]">
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
    {
      aiSummary: aiInsight.aiSummary,
      aiEvidenceBullets: aiInsight.aiEvidenceBullets,
      aiActionReasons: aiInsight.actionReasons,
    },
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
