"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { SproutIcon } from "@/components/icons";
import { useDiagnosis } from "@/context/diagnosis-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DEFAULT_DIFFICULTY_STYLE = "bg-[#eef3f0] text-[#789b8c]";
const DIFFICULTY_STYLES: Record<string, string> = {
  쉬움: "bg-[#dff1ea] text-[#1ba77d]",
  중간: "bg-[#fbe7c8] text-[#9a5b1f]",
  어려움: "bg-[#fbdede] text-[#b3433f]",
};

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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ActionsPage() {
  const router = useRouter();
  const { result, isHydrated, setSelectedActionCodes, aiInsight } =
    useDiagnosis();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isHydrated && !result) {
      router.replace("/upload");
    }
  }, [isHydrated, result, router]);

  if (!result) {
    return null;
  }

  // Gemini가 생성한 액션이 있으면 우선 사용, 없으면 백엔드 액션으로 폴백.
  const actions: ((typeof result.recommendedActions)[number] & {
    reason?: string;
  })[] =
    aiInsight && aiInsight.actions.length > 0
      ? aiInsight.actions
      : result.recommendedActions;

  const toggleAction = (code: string) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }

      return next;
    });
  };

  const selectedActions = actions.filter((action) => selected.has(action.code));
  const selectedMinTotal = selectedActions.reduce(
    (sum, action) => sum + action.expectedMinKg,
    0,
  );
  const selectedMaxTotal = selectedActions.reduce(
    (sum, action) => sum + action.expectedMaxKg,
    0,
  );

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/report"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="진단 결과로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">감축 액션 추천</h1>
        </header>

        <section className="px-5 py-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-black">
              맞춤 감축 액션 {actions.length}가지
            </h2>
            <span className="shrink-0 rounded-full bg-[#dff1ea] px-3 py-1 text-sm font-black text-[#1ba77d]">
              {result.userType}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#789b8c]">
            원하는 액션을 선택해 예상 효과를 확인해보세요
          </p>

          {selected.size > 0 ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#eef3f0] bg-white px-4 py-3">
              <span className="text-sm font-bold text-[#789b8c]">
                {selected.size}개 선택 시 예상 절감
              </span>
              <span className="text-lg font-black text-[#13261f]">
                -{Math.round(selectedMinTotal)}~{Math.round(selectedMaxTotal)}{" "}
                kg CO₂/년
              </span>
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {actions.map((action) => {
              const isSelected = selected.has(action.code);

              return (
                <button
                  key={action.code}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleAction(action.code)}
                  className={`w-full rounded-2xl border-2 bg-white p-4 text-left transition ${
                    isSelected ? "border-[#1ba77d]" : "border-[#e5eee9]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eef8f3] text-2xl">
                      {action.icon ?? (
                        <SproutIcon className="size-6 text-[#1ba77d]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-black">{action.title}</h3>
                        <span
                          aria-hidden="true"
                          className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                            isSelected
                              ? "border-[#1ba77d] bg-[#1ba77d]"
                              : "border-[#cfe7da] bg-white"
                          }`}
                        >
                          {isSelected ? <CheckIcon /> : null}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#789b8c]">
                        {action.description}
                      </p>
                      {"reason" in action && action.reason ? (
                        <p className="mt-2 rounded-xl bg-[#eef8f3] px-3 py-2 text-xs font-bold text-[#0d5f4b]">
                          ✦ {action.reason}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#dff1ea] px-3 py-1 text-xs font-black text-[#1ba77d]">
                          -{Math.round(action.expectedMinKg)}~
                          {Math.round(action.expectedMaxKg)} kg/년
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            DIFFICULTY_STYLES[action.difficulty] ??
                            DEFAULT_DIFFICULTY_STYLE
                          }`}
                        >
                          {action.difficulty}
                        </span>
                        <span className="rounded-full bg-[#eef3f0] px-3 py-1 text-xs font-bold text-[#789b8c]">
                          {action.costLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Link
            href="/support"
            onClick={() => setSelectedActionCodes(Array.from(selected))}
            className="mt-8 block w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-center text-xl font-black text-white"
          >
            맞춤 지원사업 신청하기
          </Link>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
