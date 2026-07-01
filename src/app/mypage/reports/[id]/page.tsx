"use client";

import BottomNavigation from "@/components/BottomNavigation";
import ReportView from "@/components/ReportView";
import { useAuth } from "@/context/auth-context";
import {
  diagnoseWithXgboost,
  getDiagnosis,
  type DiagnosisDetail,
} from "@/lib/diagnosis-api";
import { toMonthLabel } from "@/lib/mypage-data";
import { DUMMY_REPORT } from "@/lib/report-data";
import { buildFallbackReport, mergeXgboostResult } from "@/lib/report-merge";
import { deleteDiagnosis } from "@/lib/users-api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export default function HistoricalReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [report, setReport] = useState<DiagnosisReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await deleteDiagnosis(id, token);
      router.replace("/mypage");
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
          <h1 className="ml-3 flex-1 text-xl font-black">
            {monthLabel} 리포트
          </h1>
          {token ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="grid size-10 place-items-center rounded-full border border-[#e5eee9] bg-white text-[#789b8c]"
              aria-label="리포트 삭제"
            >
              <TrashIcon />
            </button>
          ) : null}
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

      {showDeleteConfirm ? (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white px-5 pb-10 pt-6 shadow-2xl shadow-emerald-950/20">
          <p className="text-center text-base font-black text-[#13261f]">
            {monthLabel} 리포트를 삭제할까요?
          </p>
          <p className="mt-1 text-center text-sm font-bold text-[#789b8c]">
            삭제하면 복구할 수 없어요.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-2xl border-2 border-[#e5eee9] py-4 text-base font-black text-[#789b8c]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-2xl bg-[#e0473e] py-4 text-base font-black text-white disabled:opacity-60"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ) : null}

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
