"use client";

import BottomNavigation from "@/components/BottomNavigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const usageSteps = [
  {
    number: "01",
    title: "고지서 업로드",
    description: "전기·가스 고지서를 촬영하거나 파일로 첨부해요",
  },
  {
    number: "02",
    title: "AI 자동 분석",
    description: "OCR로 수치를 추출하고 Scope 2 탄소량을 계산해요",
  },
  {
    number: "03",
    title: "맞춤 리포트",
    description: "등급·감축 액션·공공 지원사업까지 한눈에 확인해요",
  },
];

const users = [
  { icon: "🏪", title: "소상공인", description: "가게·사무실" },
  { icon: "🏠", title: "일반 가구", description: "주택·아파트" },
  { icon: "💚", title: "취약계층", description: "에너지 지원" },
];

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepsSectionRef = useRef<HTMLElement>(null);
  const [activeStepCount, setActiveStepCount] = useState(0);

  useEffect(() => {
    const updateActiveStepCount = () => {
      const scrollContainer = scrollContainerRef.current;
      const section = stepsSectionRef.current;

      if (!scrollContainer || !section) {
        return;
      }

      const maxScrollTop =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const preferredStart =
        section.offsetTop - scrollContainer.clientHeight * 0.55;
      const activationStart = Math.max(
        0,
        Math.min(preferredStart, maxScrollTop * 0.12),
      );
      const activationRange = Math.max(maxScrollTop - activationStart, 1);
      const progress =
        (scrollContainer.scrollTop - activationStart) / activationRange;
      const nextCount =
        progress <= 0
          ? 0
          : Math.min(
              usageSteps.length,
              Math.ceil(progress * usageSteps.length),
            );

      setActiveStepCount(nextCount);
    };

    const scrollContainer = scrollContainerRef.current;

    updateActiveStepCount();
    scrollContainer?.addEventListener("scroll", updateActiveStepCount, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveStepCount);

    return () => {
      scrollContainer?.removeEventListener("scroll", updateActiveStepCount);
      window.removeEventListener("resize", updateActiveStepCount);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#c7d5c9] px-0 py-0 text-[#13261f] sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-6">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#eef7f2] shadow-2xl shadow-emerald-950/25 sm:h-[820px] sm:min-h-0 sm:rounded-[44px] sm:ring-2 sm:ring-emerald-950/15">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain sm:h-full"
        >
          <section className="relative overflow-hidden bg-gradient-to-br from-[#064734] via-[#13976f] to-[#49cfaa] px-6 pb-9 pt-10 text-white sm:pb-7 sm:pt-8">
            <div className="pointer-events-none absolute -bottom-16 -left-14 size-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-950/18" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="grid size-[72px] place-items-center overflow-hidden rounded-3xl bg-white/18 shadow-inner">
                <Image
                  src="/images/icon.svg"
                  alt="GreenCheck 아이콘"
                  width={72}
                  height={72}
                  priority
                />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight">GreenCheck</p>
                <p className="mt-1 text-sm font-bold text-white/70">
                  기후·에너지 자가진단 플랫폼
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-12 sm:mt-8">
              <h1 className="text-[2.45rem] font-black leading-[1.18] tracking-tight sm:text-[2.15rem]">
                고지서 한 장으로 <br />
                시작하는 기후 자가진단
              </h1>
              <p className="mt-6 text-[1.05rem] font-bold leading-8 text-white/78 sm:mt-4 sm:text-base sm:leading-7">
                전기·가스 고지서 사진 한 장이면
                <br />
                3분 안에 탄소 배출 진단부터 공공 지원사업까지
              </p>
            </div>

            <div className="relative z-10 mt-10 grid grid-cols-2 gap-3 sm:mt-7">
              <div className="rounded-2xl bg-white/18 px-4 py-5 text-center backdrop-blur sm:py-4">
                <div className="text-2xl">⚡</div>
                <div className="mt-1 text-2xl font-black">3분</div>
                <div className="text-sm font-bold text-white/72">진단 완료</div>
              </div>
              <div className="rounded-2xl bg-white/18 px-4 py-5 text-center backdrop-blur sm:py-4">
                <div className="text-2xl">🎯</div>
                <div className="mt-1 text-2xl font-black">90%+</div>
                <div className="text-sm font-bold text-white/72">
                  추출 정확도
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#f2faf6] px-5 py-7 sm:py-5">
            <button className="w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white shadow-lg shadow-emerald-800/10 transition hover:bg-[#168c6a] sm:py-4">
              지금 시작하기
            </button>

            <section
              ref={stepsSectionRef}
              className="mt-8 sm:mt-6"
              aria-labelledby="how-to-use"
            >
              <h2
                id="how-to-use"
                className="text-base font-black text-[#789b8c]"
              >
                사용 방법
              </h2>
              <ol className="relative mt-5 space-y-7 sm:space-y-4">
                <span
                  className="absolute left-[22px] top-10 h-[132px] w-1 rounded-full bg-[#d4eee5]"
                  aria-hidden="true"
                />
                {usageSteps.map((step, index) => {
                  const isActive = index < activeStepCount;

                  return (
                    <li key={step.number} className="relative flex gap-4">
                      <span
                        className={`z-10 grid size-12 shrink-0 place-items-center rounded-2xl text-base font-black transition-colors duration-700 ${
                          isActive
                            ? "bg-[#1ba77d] text-white shadow-lg shadow-emerald-800/15"
                            : "bg-[#d4eee5] text-[#7aa090]"
                        }`}
                      >
                        {step.number}
                      </span>
                      <div className="pt-1">
                        <h3
                          className={`text-xl font-black transition duration-700 sm:text-lg ${
                            isActive
                              ? "text-[#13261f] opacity-100"
                              : "text-[#6f8f82] opacity-45"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={`mt-1 text-[0.95rem] font-semibold leading-6 transition duration-700 sm:text-sm sm:leading-5 ${
                            isActive
                              ? "text-[#5f8676] opacity-100"
                              : "text-[#8aaaa0] opacity-45"
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </section>

          <section className="border-t-[10px] border-[#d8f2ea] bg-[#eef7f2] px-5 pb-28 mb-10 pt-7 sm:pb-24 sm:pt-5">
            <h2 className="text-base font-black text-[#789b8c]">
              누구나 사용 가능해요
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {users.map((user) => (
                <article
                  key={user.title}
                  className="rounded-2xl bg-white px-3 py-5 text-center shadow-lg shadow-emerald-950/8 sm:py-4"
                >
                  <div className="text-3xl" aria-hidden="true">
                    {user.icon}
                  </div>
                  <h3 className="mt-3 text-base font-black">{user.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#789b8c]">
                    {user.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <BottomNavigation />
      </div>
    </main>
  );
}
