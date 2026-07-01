"use client";

import BottomNavigation from "@/components/BottomNavigation";
import ReportView from "@/components/ReportView";
import {
  diagnoseWithXgboost,
  getDiagnosis,
  type DiagnosisDetail,
} from "@/lib/diagnosis-api";
import { toMonthLabel } from "@/lib/mypage-data";
import { DUMMY_REPORT } from "@/lib/report-data";
import { buildFallbackReport, mergeXgboostResult } from "@/lib/report-merge";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DiagnosisReportData } from "@/lib/report-data";

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

export default function HistoricalReportPage() {
  const { id } = useParams<{ id: string }>();
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [report, setReport] = useState<DiagnosisReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    getDiagnosis(id)
      .then((result) => {
        if (isCancelled) return;
        setDiagnosis(result);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "진단 결과를 불러오지 못했어요.",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // 저장된 전기 사용량으로 XGBoost를 다시 호출해 평균 비교/추세 예측/
  // 절감 목표/절감 비용/에너지 비중을 실데이터로 채운다.
  // 가스 사용량은 이력에 저장돼 있지 않아 null로 보낸다 — XGBoost가
  // null을 허용하므로 전기만으로도 분석이 된다.
  // 호출에 실패하면 저장된 targetEmissionKg로 KPI/등급만 채운 최소
  // 리포트로 폴백한다.
  useEffect(() => {
    if (!diagnosis) return;
    let isCancelled = false;

    async function run() {
      if (!diagnosis) return;

      try {
        const xgboost = await diagnoseWithXgboost({
          elecKwh: diagnosis.usageKwh ?? 0,
          gasMj: null,
          deviceUsage: {},
          esgAnswers: null,
          prevElecKwh: null,
        });
        if (!isCancelled) {
          setReport(mergeXgboostResult(DUMMY_REPORT, xgboost, false));
        }
      } catch {
        if (!isCancelled) {
          setReport(buildFallbackReport(diagnosis.targetEmissionKg));
        }
      }
    }

    run();
    return () => {
      isCancelled = true;
    };
  }, [diagnosis]);

  if (errorMessage) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-base font-black text-[#13261f]">{errorMessage}</p>
        <Link
          href="/mypage"
          className="rounded-2xl bg-[#1ba77d] px-6 py-3 text-sm font-black text-white"
        >
          마이페이지로 돌아가기
        </Link>
      </div>
    );
  }

  if (!diagnosis || !report) {
    return null;
  }

  const monthLabel = toMonthLabel(diagnosis.billingMonth, diagnosis.createdAt);

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/mypage"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="마이페이지로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="ml-3 text-xl font-black">{monthLabel} 리포트</h1>
        </header>

        <section className="px-5 pb-7 pt-6">
          <ReportView
            report={report}
            address={diagnosis.address ?? undefined}
            title={`${monthLabel} 진단 결과`}
          />

          <Link
            href="/report"
            className="mt-6 block w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-center text-base font-black text-white"
          >
            현재 진단 리포트 보기
          </Link>
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
