"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import { USER_TYPE_INFO } from "@/lib/user-types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      className="size-5 shrink-0 text-[#1ba77d]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function UserTypePage() {
  const router = useRouter();
  const { address, result, isHydrated } = useDiagnosis();

  useEffect(() => {
    if (isHydrated && !result) {
      router.replace("/upload");
    }
  }, [isHydrated, result, router]);

  if (!result) {
    return null;
  }

  const typeInfo = USER_TYPE_INFO[result.userType];
  const electricKwh = result.electricOcr?.usageKwh.value ?? null;
  const electricBillingMonth = result.electricOcr?.billingMonth.value ?? null;
  const gasM3 = result.gasOcr?.usageM3.value ?? null;
  const gasBillingMonth = result.gasOcr?.billingMonth.value ?? null;

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="bg-[#f2faf6] pt-8 sticky top-0 z-20">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
                aria-label="고지서 업로드로 돌아가기"
              >
                <ChevronLeftIcon />
              </Link>
              <h1 className="text-xl font-black ml-3">사용자 유형 확인</h1>
            </div>
            <span className="text-lg font-black mr-4 text-[#78a091]">2/3</span>
          </div>
          <div className="h-1 bg-[#d8f2ea]">
            <div className="h-full w-2/3 bg-[#1ba77d]" />
          </div>
        </header>

        <section className="px-5 pb-7 pt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064734] via-[#13976f] to-[#49cfaa] px-6 py-9 text-center text-white">
            <div className="pointer-events-none absolute -bottom-12 -left-10 size-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-14 -top-16 size-48 rounded-full bg-emerald-950/18" />

            <div className="relative z-10">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/18">
                <typeInfo.icon className="size-8 text-white" />
              </div>
              <p className="mt-4 text-sm font-bold text-white/72">
                자동 분류 결과
              </p>
              <p className="mt-1 text-3xl font-black">{result.userType}</p>
              <p className="mx-auto mt-3 max-w-xs text-sm font-bold leading-6 text-white/80">
                {typeInfo.heroDescription}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-emerald-950/8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">분석 요약</h2>
              <Link
                href="/edit-bill"
                className="text-sm font-bold text-[#1ba77d]"
              >
                항목 수정
              </Link>
            </div>

            <dl className="mt-4 divide-y divide-[#eef3f0]">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-bold text-[#789b8c]">주소</dt>
                <dd className="text-sm font-black">
                  {address || "주소 미입력"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-bold text-[#789b8c]">
                  전기 고지서 기준월
                </dt>
                <dd className="text-sm font-black">
                  {electricBillingMonth ?? "직접 입력 필요"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-bold text-[#789b8c]">
                  전기 사용량
                </dt>
                <dd className="text-sm font-black">
                  {electricKwh !== null
                    ? `${electricKwh} kWh`
                    : "직접 입력 필요"}
                </dd>
              </div>
              {result.hasGasBill ? (
                <>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm font-bold text-[#789b8c]">
                      가스 고지서 기준월
                    </dt>
                    <dd className="text-sm font-black">
                      {gasBillingMonth ?? "직접 입력 필요"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-sm font-bold text-[#789b8c]">
                      가스 사용량
                    </dt>
                    <dd className="text-sm font-black">
                      {gasM3 !== null ? `${gasM3} m³` : "직접 입력 필요"}
                    </dd>
                  </div>
                </>
              ) : null}
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-bold text-[#789b8c]">
                  OCR 추출 정확도
                </dt>
                <dd className="text-sm font-black">
                  {result.averageOcrConfidence.toFixed(1)}%
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-emerald-950/8">
            <h2 className="text-base font-black">제공되는 맞춤 서비스</h2>
            <ul className="mt-4 space-y-3">
              {typeInfo.services.map((service) => (
                <li key={service} className="flex items-center gap-2">
                  <CheckIcon />
                  <span className="text-sm font-bold text-[#13261f]">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/user-type/change"
              className="text-sm font-bold text-[#789b8c]"
            >
              잘못 분류됐나요?{" "}
              <span className="font-black text-[#1ba77d]">유형 변경하기</span>
            </Link>
          </div>

          <Link
            href="/report"
            className="mt-8 block w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-center text-xl font-black text-white"
          >
            진단 리포트 보기
          </Link>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
