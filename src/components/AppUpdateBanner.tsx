"use client";

import { readNotifPrefs } from "@/lib/notification-prefs";
import { useState } from "react";

// NEXT_PUBLIC_APP_VERSION을 올리면 이 배너가 뜬다.
// localStorage의 "last_seen_version"과 비교해서 새 버전이면 표시.
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
const SEEN_KEY = "glgc-last-seen-version";

export default function AppUpdateBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!readNotifPrefs().appUpdate) return false;
    const lastSeen = window.localStorage.getItem(SEEN_KEY);
    return lastSeen !== CURRENT_VERSION;
  });

  const dismiss = () => {
    window.localStorage.setItem(SEEN_KEY, CURRENT_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-[#13261f] px-4 py-3 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">
            🌿 GreenCheck 업데이트
          </p>
          <p className="mt-0.5 text-xs font-bold text-[#9ec9b8]">
            새 기능이 추가됐어요. 새로고침하면 적용돼요.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-[#9ec9b8] text-lg leading-none"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-3 w-full rounded-xl bg-[#1ba77d] py-2 text-sm font-black text-white"
      >
        지금 새로고침
      </button>
    </div>
  );
}
