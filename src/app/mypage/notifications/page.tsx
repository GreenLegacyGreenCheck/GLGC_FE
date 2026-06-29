"use client";

import BottomNavigation from "@/components/BottomNavigation";
import Link from "next/link";
import { useState } from "react";

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

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        on ? "bg-[#1ba77d]" : "bg-[#d1d5db]"
      }`}
    >
      <span
        className={`mt-0.5 inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

type NotifId = "diagnosis" | "weekly" | "goal" | "update";

const NOTIF_SETTINGS: {
  id: NotifId;
  label: string;
  description: string;
  defaultOn: boolean;
}[] = [
  {
    id: "diagnosis",
    label: "진단 완료 알림",
    description: "탄소 진단이 완료되면 알려드려요",
    defaultOn: true,
  },
  {
    id: "weekly",
    label: "주간 리포트 알림",
    description: "매주 탄소 배출 요약 리포트를 보내드려요",
    defaultOn: true,
  },
  {
    id: "goal",
    label: "절감 목표 달성 알림",
    description: "절감 목표에 가까워지면 알려드려요",
    defaultOn: false,
  },
  {
    id: "update",
    label: "앱 업데이트 알림",
    description: "새 기능이 추가되면 알려드려요",
    defaultOn: false,
  },
];

export default function NotificationsPage() {
  const [settings, setSettings] = useState<Record<NotifId, boolean>>(
    Object.fromEntries(
      NOTIF_SETTINGS.map((s) => [s.id, s.defaultOn]),
    ) as Record<NotifId, boolean>,
  );

  const toggle = (id: NotifId) =>
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/mypage"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="마이페이지로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">알림 설정</h1>
        </header>

        <section className="px-5 py-6">
          <p className="text-sm font-bold text-[#789b8c]">
            알림을 허용하면 중요한 진단 결과와 인사이트를 놓치지 않을 수 있어요.
          </p>

          <div className="mt-6 divide-y divide-[#eef3f0] rounded-2xl border border-[#eef3f0] bg-white">
            {NOTIF_SETTINGS.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{setting.label}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#789b8c]">
                    {setting.description}
                  </p>
                </div>
                <Toggle
                  on={settings[setting.id]}
                  onToggle={() => toggle(setting.id)}
                  label={setting.label}
                />
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs font-bold text-[#9aa6a1]">
            기기의 알림 설정에서 GreenCheck 알림을 허용해야 받을 수 있어요.
          </p>
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
