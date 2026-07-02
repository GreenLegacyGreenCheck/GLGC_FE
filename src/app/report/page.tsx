"use client";

import ReportView from "@/components/ReportView";
import BottomNavigation from "@/components/BottomNavigation";
import { RefreshIcon, SproutIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import { diagnoseWithXgboost, getActionPolicy } from "@/lib/diagnosis-api";
import { getAiInsight } from "@/lib/ai-api";
import type { AiInsightResult } from "@/context/diagnosis-context";
import { DUMMY_REPORT } from "@/lib/report-data";
import { mergeXgboostResult } from "@/lib/report-merge";
import { downloadReportPdf } from "@/lib/report-pdf";
import { toGasMegajoules } from "@/lib/scope2";
import { getMyDiagnoses } from "@/lib/users-api";
import {
  requestNotifPermission,
  writeNotifPrefs,
} from "@/lib/notification-prefs";
import { subscribePush } from "@/lib/push-api";
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
    xgboostResult: persistedXgboostResult,
    setXgboostResult: persistXgboostResult,
    aiInsight: persistedAiInsight,
    setAiInsight: persistAiInsight,
    ragCache,
    setRagCache,
  } = useDiagnosis();
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
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

  // 리포트가 처음 완성됐을 때 한 번만 알림 권한 배너를 띄운다.
  // 이미 결정했거나(granted/denied), 이전에 배너를 봤으면 표시하지 않는다.
  useEffect(() => {
    if (!xgboostResult || !aiInsight) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (window.localStorage.getItem("glgc-notif-prompted")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowNotifPrompt(true);
  }, [xgboostResult, aiInsight]);

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
    // xgboost + aiInsight 둘 다 있고 scenario + projectedTonsByDegree까지 있으면 할 일 없음
    const hasScenario =
      aiInsight?.actions.some(
        (a) => a.scenario !== null && a.scenario?.projectedTonsByDegree != null,
      ) ?? false;
    if (xgboostResult && aiInsight && hasScenario) return;

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
          if (!isMountedRef.current) return;
          setAiInsight(insight);
          persistAiInsight(insight);

          // aiInsight 확정 즉시 각 액션별 RAG 결과 병렬 pre-fetch
          if (!result?.diagnosisId) return;
          const diagnosisId = result.diagnosisId;
          Promise.allSettled(
            insight.actions.map((action) =>
              getActionPolicy(diagnosisId, action.code, action.reason).then(
                (policy) => ({ code: action.code, policy }),
              ),
            ),
          ).then((settled) => {
            if (!isMountedRef.current) return;
            const newCache: Record<
              string,
              { programs: unknown[]; defaultActions: unknown[] }
            > = {};
            settled.forEach((res) => {
              if (res.status === "fulfilled") {
                newCache[res.value.code] = res.value.policy;
              }
            });
            setRagCache({ ...ragCache, ...newCache });
          });
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
    },
  );

  const dismissNotifPrompt = () => {
    window.localStorage.setItem("glgc-notif-prompted", "1");
    setShowNotifPrompt(false);
  };

  const handleAllowNotif = async () => {
    dismissNotifPrompt();
    const granted = await requestNotifPermission();
    if (!granted) return;
    writeNotifPrefs({ diagnosisAlert: true });
    if (token) {
      subscribePush(token).catch(() => {});
    }
  };

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
          <ReportView
            ref={reportRef}
            report={report}
            address={address}
            aiActions={aiInsight.actions}
          />

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

      {showNotifPrompt ? (
        <div className="fixed inset-x-0 bottom-20 z-50 px-5">
          <div className="rounded-2xl bg-[#13261f] px-5 py-4 shadow-2xl shadow-emerald-950/30">
            <p className="text-sm font-black text-white">진단 완료 알림 받기</p>
            <p className="mt-1 text-xs font-bold text-[#9ec9b8]">
              다음 진단이 끝나면 바로 알려드려요.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleAllowNotif}
                className="flex-1 rounded-xl bg-[#1ba77d] py-2.5 text-sm font-black text-white"
              >
                알림 허용
              </button>
              <button
                type="button"
                onClick={dismissNotifPrompt}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#9ec9b8]"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
