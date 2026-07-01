"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis, type UserType } from "@/context/diagnosis-context";
import { USER_TYPE_INFO } from "@/lib/user-types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const USER_TYPES: UserType[] = ["소상공인", "일반가구", "취약계층"];

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

export default function ChangeUserTypePage() {
  const router = useRouter();
  const { result, isHydrated, setUserTypeOverride } = useDiagnosis();
  const [selectedType, setSelectedType] = useState<UserType | null>(
    result?.userType ?? null,
  );

  useEffect(() => {
    if (isHydrated && !result) {
      router.replace("/upload");
    }
  }, [isHydrated, result, router]);

  if (!result) {
    return null;
  }

  const handleConfirm = () => {
    if (!selectedType) {
      return;
    }

    setUserTypeOverride(selectedType);
    router.push("/user-type");
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/user-type"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="사용자 유형 확인으로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">사용자 유형 변경</h1>
        </header>

        <section className="px-5 py-6">
          <h2 className="text-2xl font-black">유형을 선택해 주세요</h2>
          <p className="mt-2 text-sm font-bold text-[#789b8c]">
            선택한 유형에 맞는 진단과 지원사업을 안내해요.
          </p>

          <div className="mt-6 space-y-4">
            {USER_TYPES.map((type) => {
              const info = USER_TYPE_INFO[type];
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={isSelected}
                  className={`w-full rounded-2xl border-2 bg-white p-5 text-left transition ${
                    isSelected ? "border-[#1ba77d]" : "border-[#e5eee9]"
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eef8f3]">
                      <info.icon className="size-6 text-[#1ba77d]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-black">
                          {info.selectionLabel}
                        </h3>
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
                        {info.selectionDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {info.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#eef8f3] px-3 py-1 text-xs font-bold text-[#1ba77d]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!selectedType}
            className="mt-8 w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white disabled:opacity-50"
            onClick={handleConfirm}
          >
            이 유형으로 변경하기
          </button>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
