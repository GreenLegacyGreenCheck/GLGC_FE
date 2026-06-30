"use client";

import ReportView from "@/components/ReportView";
import BottomNavigation from "@/components/BottomNavigation";
import { RefreshIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import {
  diagnoseWithXgboost,
  type XgboostDiagnoseResult,
} from "@/lib/diagnosis-api";
import { getAiInsight, type AiInsightResult } from "@/lib/ai-api";
import { DUMMY_REPORT, type DiagnosisReportData } from "@/lib/report-data";
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
  const { address, result, isHydrated, esgSurveyAnswers, setAiActionReasons } =
    useDiagnosis();
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [xgboostResult, setXgboostResult] =
    useState<XgboostDiagnoseResult | null>(null);
  const [aiInsight, setAiInsight] = useState<AiInsightResult | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHydrated && !result) {
      router.replace("/upload");
    }
  }, [isHydrated, result, router]);

  // 원인 분석 + ESG 점수는 진단 결과(OCR 사용량)와 ESG 설문 응답이 갖춰지면
  // 리포트 화면에서 바로 요청한다 — analyzing 단계에서 미리 계산해두지 않는
  // 이유는, 설문이 분석보다 늦게 끝날 수 있어 그 시점엔 응답이 없을 수
  // 있기 때문(여기 도달했을 때는 항상 설문이 끝나 있다).
  useEffect(() => {
    if (!result) {
      return;
    }

    let isCancelled = false;
    const hasAnswers = Boolean(
      esgSurveyAnswers && Object.keys(esgSurveyAnswers).length > 0,
    );

    async function run() {
      // 전월 사용량은 로그인한 유저의 직전 진단 이력에서만 알 수 있다 —
      // 비로그인 진단은 이력이 없어 항상 null로 보낸다. 이력 조회가
      // 실패해도 원인 분석 자체는 전월 비교 없이 계속 진행한다.
      let prevElecKwh: number | null = null;

      if (token) {
        try {
          const { diagnoses } = await getMyDiagnoses(token);
          const previous = diagnoses.find(
            (diagnosis) =>
              diagnosis.id !== result?.diagnosisId &&
              diagnosis.usageKwh !== null,
          );
          prevElecKwh = previous?.usageKwh ?? null;
        } catch {
          prevElecKwh = null;
        }
      }

      if (isCancelled || !result) {
        return;
      }

      try {
        const diagnoseResult = await diagnoseWithXgboost({
          elecKwh: result.electricOcr?.usageKwh.value ?? 0,
          gasMj: toGasMegajoules(result.gasOcr?.usageM3.value ?? null),
          deviceUsage: {},
          esgAnswers: hasAnswers ? esgSurveyAnswers : null,
          prevElecKwh,
        });

        if (!isCancelled) {
          setXgboostResult(diagnoseResult);

          // XGBoost 결과가 나오면 AI 인사이트를 비동기로 호출한다 — AI가
          // 응답하지 못해도 리포트 나머지 부분은 이미 채워진 상태라 무해하다.
          getAiInsight(diagnoseResult, result?.recommendedActions ?? [])
            .then((insight) => {
              if (!isCancelled) {
                setAiInsight(insight);
                setAiActionReasons(insight.actionReasons);
              }
            })
            .catch(() => {});
        }
      } catch {
        // 원인 분석 서비스가 응답하지 못해도 리포트 자체는 더미 데이터로 보여준다.
      }
    }

    run();

    return () => {
      isCancelled = true;
    };
  }, [result, esgSurveyAnswers, token]);

  if (!result) {
    return null;
  }

  const hasEsgAnswers = Boolean(
    esgSurveyAnswers && Object.keys(esgSurveyAnswers).length > 0,
  );
  const report = xgboostResult
    ? mergeXgboostResult(
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
      )
    : DUMMY_REPORT;

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
