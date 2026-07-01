"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { SproutIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import { getActionPolicy } from "@/lib/diagnosis-api";
import type {
  DefaultActionSuggestion,
  SupportProgram,
} from "@/lib/support-programs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

// Indeterminate variant of the analyzing-page loading ring: there's no
// percent to report while RAG policy lookup is in flight, so the arc is a
// fixed quarter-circle that spins continuously instead of filling.
function SproutSpinner() {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid size-40 place-items-center rounded-full mt-37">
      <span className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]" />
      <span
        className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]"
        style={{ animationDelay: "0.9s" }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute inset-0 size-40 animate-spin"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#d8f2ea"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#1ba77d"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.25} ${circumference}`}
        />
      </svg>
      <div className="grid size-28 place-items-center rounded-full bg-white shadow-inner">
        <SproutIcon className="size-9 text-[#1ba77d]" />
      </div>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { result, isHydrated, selectedActionCodes } = useDiagnosis();
  const isLoggedIn = Boolean(token);
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [defaultActions, setDefaultActions] = useState<
    DefaultActionSuggestion[]
  >([]);
  const [hasFetched, setHasFetched] = useState(false);
  const isLoading = selectedActionCodes.length > 0 && !hasFetched;

  useEffect(() => {
    if (isHydrated && !result) {
      router.replace("/upload");
    }
  }, [isHydrated, result, router]);

  useEffect(() => {
    if (!result || selectedActionCodes.length === 0) {
      return;
    }

    let isCancelled = false;

    Promise.all(
      selectedActionCodes.map((code) =>
        getActionPolicy(result.diagnosisId, code),
      ),
    ).then((results) => {
      if (!isCancelled) {
        setPrograms(results.flatMap((result) => result.programs));

        // 같은 default_actions 목록이 선택한 액션마다 똑같이 내려올 수 있어
        // id 기준으로 중복 제거한다.
        const seenIds = new Set<number>();
        const uniqueDefaultActions = results
          .flatMap((result) => result.defaultActions)
          .filter((action) => {
            if (seenIds.has(action.id)) return false;
            seenIds.add(action.id);
            return true;
          });
        setDefaultActions(uniqueDefaultActions);

        setHasFetched(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [result, selectedActionCodes]);

  if (!result) {
    return null;
  }

  return (
    <>
      <div
        className={`scrollbar-hidden flex h-screen flex-col overscroll-contain pb-32 sm:h-full ${
          isLoading ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/actions"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="감축 액션 추천으로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">맞춤 지원사업</h1>
        </header>

        <section className="flex flex-1 flex-col px-5 py-6">
          <h2 className="text-2xl font-black">
            맞춤 지원사업{" "}
            <span className="text-[#1ba77d]">{programs.length}건</span> 발견
          </h2>
          <p className="mt-2 text-sm font-bold text-[#789b8c]">
            탄소 진단 결과 기반 자동 매칭 · 지원사업 바로 신청
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center pt-15">
              <SproutSpinner />
              <p className="mt-9 text-sm font-bold text-[#789b8c]">
                지원사업을 찾고 있어요...
              </p>
            </div>
          ) : selectedActionCodes.length === 0 ? (
            <p className="mt-6 text-sm font-bold text-[#789b8c]">
              감축 액션을 먼저 선택하면 맞춤 지원사업을 보여드려요.
            </p>
          ) : programs.length === 0 && defaultActions.length > 0 ? (
            <>
              <p className="mt-6 text-sm font-bold text-[#789b8c]">
                이런 도움을 받아보세요
              </p>
              <div className="mt-4 space-y-4">
                {defaultActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-2xl border border-[#eef3f0] bg-white p-5"
                  >
                    <h3 className="text-base font-black">{action.title}</h3>
                    <p className="mt-1 text-sm font-bold text-[#789b8c]">
                      {action.description}
                    </p>

                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block w-full rounded-2xl bg-[#1ba77d] px-5 py-3 text-center text-base font-black text-white"
                    >
                      바로가기
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : programs.length === 0 ? (
            <p className="mt-6 text-sm font-bold text-[#789b8c]">
              선택한 액션에 매칭되는 지원사업을 찾지 못했어요.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {programs.map((program, index) => (
                <div
                  key={`${program.title}-${index}`}
                  className="rounded-2xl border border-[#eef3f0] bg-white p-5"
                >
                  <span className="rounded-full bg-[#eef8f3] px-3 py-1 text-xs font-black text-[#1ba77d]">
                    {program.actionTitle}
                  </span>
                  <h3 className="mt-3 text-base font-black">{program.title}</h3>
                  <p className="mt-1 text-sm font-bold text-[#789b8c]">
                    {program.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#dff1ea] px-3 py-1 text-xs font-black text-[#1ba77d]">
                      {program.carbonSaving}
                    </span>
                    <span className="rounded-full bg-[#fbe7c8] px-3 py-1 text-xs font-black text-[#9a5b1f]">
                      {program.difficulty}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold text-[#789b8c]">
                    필요 서류: {program.documents}
                  </p>

                  <a
                    href={program.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full rounded-2xl bg-[#1ba77d] px-5 py-3 text-center text-base font-black text-white"
                  >
                    지원사업 바로가기
                  </a>
                </div>
              ))}
            </div>
          )}

          {!isLoading ? (
            <div className="mt-6 rounded-2xl bg-[#eaf6f0] p-6 text-center">
              <SproutIcon className="mx-auto size-8 text-[#1ba77d]" />
              <p className="mt-2 text-base font-black">
                진단 완료! 탄소 감축을 시작해 보세요
              </p>
              {!isLoggedIn ? (
                <>
                  <p className="mt-2 text-sm font-bold text-[#789b8c]">
                    로그인하면 리포트가 마이페이지에 자동 저장돼요.
                    <br />
                    정기 진단으로 감축 목표를 꾸준히 관리해 보세요.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 block w-full rounded-2xl bg-white px-5 py-3 text-center text-base font-black text-[#1ba77d]"
                  >
                    로그인하고 리포트 저장하기
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm font-bold text-[#789b8c]">
                  정기 진단으로 감축 목표를 꾸준히 관리해 보세요.
                </p>
              )}
            </div>
          ) : null}
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
