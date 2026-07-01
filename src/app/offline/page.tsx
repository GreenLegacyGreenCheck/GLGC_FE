"use client";

import { RefreshIcon, SproutIcon, WifiOffIcon } from "@/components/icons";
import Image from "next/image";
import { useEffect, useState } from "react";

const RETRY_SECONDS = 6;

export default function OfflinePage() {
  const [secondsLeft, setSecondsLeft] = useState(RETRY_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.reload();
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="scrollbar-hidden flex h-screen flex-col overflow-y-auto overscroll-contain sm:h-full">
      <div className="absolute flex items-center gap-2 px-6 pt-8">
        <Image
          src="/images/icon.svg"
          alt="GreenCheck 아이콘"
          width={28}
          height={28}
        />
        <span className="text-lg font-black text-[#1ba77d]">GreenCheck</span>
      </div>

      <div className="absolute inset-x-0 top-44 flex justify-center px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1ba77d]/20 bg-[#1ba77d]/10 px-3 py-1.5 text-xs font-bold text-[#1ba77d]">
          <WifiOffIcon className="size-3.5" />
          네트워크 없음
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <SproutIcon className="sprout-sway size-32 text-[#1ba77d]" />

        <h1 className="mt-6 text-xl font-black text-[#13261f]">
          인터넷 연결이 끊어졌어요
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-[#789b8c]">
          인터넷 연결을 확인하고
          <br />
          다시 시도해 주세요
        </p>
        <p className="mt-3 text-xs font-bold text-[#789b8c]">
          <span className="text-[#1ba77d]">{secondsLeft}</span>초 후 자동으로
          다시 시도해요
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1ba77d] px-8 py-4 text-base font-black text-white"
        >
          <RefreshIcon className="size-5" />
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
