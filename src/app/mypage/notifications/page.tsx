"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/context/auth-context";
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "@/lib/users-api";
import {
  requestNotifPermission,
  writeNotifPrefs,
} from "@/lib/notification-prefs";
import { subscribePush, unsubscribePush } from "@/lib/push-api";
import Link from "next/link";
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

type NotifId = keyof NotificationSettings;

const NOTIF_SETTINGS: {
  id: NotifId;
  label: string;
  description: string;
}[] = [
  {
    id: "diagnosisAlert",
    label: "진단 완료 알림",
    description: "탄소 진단이 완료되면 알려드려요",
  },
  {
    id: "appUpdate",
    label: "앱 업데이트 알림",
    description: "새 기능이 추가되면 알려드려요",
  },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  diagnosisAlert: true,
  weeklyReport: true,
  goalAlert: false,
  appUpdate: false,
};

export default function NotificationsPage() {
  const auth = useAuth();
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!auth.isHydrated || !auth.token) {
      return;
    }

    getNotificationSettings(auth.token)
      .then((result) => {
        setSettings(result);
        // 서버 설정을 로컬 캐시와 동기화
        writeNotifPrefs({
          diagnosisAlert: result.diagnosisAlert,
          appUpdate: result.appUpdate,
        });
      })
      .catch(() => {});
  }, [auth.isHydrated, auth.token]);

  const toggle = async (id: NotifId) => {
    const nextValue = !settings[id];
    setSettings((prev) => ({ ...prev, [id]: nextValue }));

    // diagnosisAlert를 켤 때 브라우저 알림 권한 요청 + Push 구독
    if (id === "diagnosisAlert") {
      if (nextValue) {
        const granted = await requestNotifPermission();
        if (!granted) {
          setSettings((prev) => ({ ...prev, diagnosisAlert: false }));
          return;
        }
        // 로그인 상태면 백엔드에 Push 구독 등록
        if (auth.token) {
          subscribePush(auth.token).catch(() => {});
        }
      } else if (auth.token) {
        // 끌 때 구독 해지
        unsubscribePush(auth.token).catch(() => {});
      }
    }

    // 실제 기능이 있는 항목만 로컬에 캐시한다
    if (id === "diagnosisAlert" || id === "appUpdate") {
      writeNotifPrefs({ [id]: nextValue });
    }

    // appUpdate를 켤 때 현재 버전을 "이미 본 버전"으로 기록한다.
    // 이렇게 해야 토글 즉시 배너가 뜨지 않고, 다음 배포 이후에만 뜬다.
    if (id === "appUpdate" && nextValue) {
      const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
      window.localStorage.setItem("glgc-last-seen-version", currentVersion);
    }

    if (!auth.token) {
      return;
    }

    updateNotificationSettings(auth.token, { [id]: nextValue }).catch(() => {
      setSettings((prev) => ({ ...prev, [id]: !nextValue }));
    });
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/mypage?tab=settings"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="마이페이지로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="ml-3 text-xl font-black">알림 설정</h1>
        </header>

        <section className="px-5 py-6">
          <p className="text-sm font-bold text-[#789b8c]">
            {auth.user
              ? "알림을 허용하면 중요한 진단 결과와 인사이트를 놓치지 않을 수 있어요."
              : "로그인하면 알림 설정이 계정에 저장돼요. 지금은 이 기기에서만 적용돼요."}
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
