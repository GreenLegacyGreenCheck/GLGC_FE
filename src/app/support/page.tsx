"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import { DUMMY_SUPPORT_PROGRAMS } from "@/lib/support-programs";
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
  const { electricFile, result } = useDiagnosis();
  const [activeComingSoonIndex, setActiveComingSoonIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!electricFile || !result) {
      router.replace("/upload");
    }
  }, [electricFile, result, router]);

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
            <span className="text-[#1ba77d]">
              {DUMMY_SUPPORT_PROGRAMS.length}건
            </span>{" "}
            발견
          </h2>
          <p className="mt-2 text-sm font-bold text-[#789b8c]">
            탄소 진단 결과 기반 자동 매칭 · 지원사업 바로 신청
          </p>

          <div className="mt-6 space-y-4">
            {DUMMY_SUPPORT_PROGRAMS.map((program, index) => (
              <div
                key={program.title}
                className="rounded-2xl border border-[#eef3f0] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${program.agencyBadgeClass}`}
                  >
                    {program.agency}
                  </span>
                  <span className="text-sm font-black text-[#1ba77d]">
                    ✅ 매칭 {program.matchPercent}%
                  </span>
                </div>
                <h3 className="mt-3 text-base font-black">{program.title}</h3>
                <p className="mt-1 text-sm">
                  <span
                    className={`text-base font-black ${program.amountColorClass}`}
                  >
                    {program.amountLabel}
                  </span>
                  <span className="font-bold text-[#789b8c]">
                    {" "}
                    · {program.deadlineLabel}
                  </span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {program.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eef8f3] px-3 py-1 text-xs font-bold text-[#1ba77d]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-[#789b8c]">
                  필요 서류: {program.requiredDocs}
                </p>

                <button
                  type="button"
                  className="mt-4 w-full rounded-2xl bg-[#1ba77d] px-5 py-3 text-base font-black text-white"
                  onClick={() => setActiveComingSoonIndex(index)}
                >
                  지원사업 바로가기 →
                </button>
                {activeComingSoonIndex === index ? (
                  <p className="mt-2 text-center text-xs font-bold text-[#789b8c]">
                    신청 연동 기능은 준비 중이에요
                  </p>
                ) : null}
              </div>
            ))}
          </div>

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
              로그인하고 리포트 저장하기 →
            </Link>
          </div>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
