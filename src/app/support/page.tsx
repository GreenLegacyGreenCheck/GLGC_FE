"use client";

import BottomNavigation from "@/components/BottomNavigation";
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

export default function SupportPage() {
  const router = useRouter();
  const { electricFile, result, selectedActionCodes } = useDiagnosis();
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [defaultActions, setDefaultActions] = useState<
    DefaultActionSuggestion[]
  >([]);
  const [hasFetched, setHasFetched] = useState(false);
  const isLoading = selectedActionCodes.length > 0 && !hasFetched;

  useEffect(() => {
    if (!electricFile || !result) {
      router.replace("/upload");
    }
  }, [electricFile, result, router]);

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
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
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

        <section className="px-5 py-6">
          <h2 className="text-2xl font-black">
            맞춤 지원사업{" "}
            <span className="text-[#1ba77d]">{programs.length}건</span> 발견
          </h2>
          <p className="mt-2 text-sm font-bold text-[#789b8c]">
            탄소 진단 결과 기반 자동 매칭 · 지원사업 바로 신청
          </p>

          {isLoading ? (
            <p className="mt-6 text-sm font-bold text-[#789b8c]">
              지원사업을 찾고 있어요...
            </p>
          ) : selectedActionCodes.length === 0 ? (
            <p className="mt-6 text-sm font-bold text-[#789b8c]">
              감축 액션을 먼저 선택하면 맞춤 지원사업을 보여드려요.
            </p>
          ) : programs.length === 0 && defaultActions.length > 0 ? (
            <>
              <p className="mt-6 text-sm font-bold text-[#789b8c]">
                맞춤 지원사업은 없지만, 이런 도움을 받아보세요
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

          <div className="mt-6 rounded-2xl bg-[#eaf6f0] p-6 text-center">
            <p className="text-3xl" aria-hidden="true">
              🌱
            </p>
            <p className="mt-2 text-base font-black">
              진단 완료! 탄소 감축을 시작해 보세요
            </p>
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
          </div>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
