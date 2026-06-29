"use client";

import BottomNavigation from "@/components/BottomNavigation";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BellIcon,
  ChevronRightIcon,
  ClipboardIcon,
  HeartIcon,
  HomeIcon,
  InfoIcon,
  LockIcon,
  SproutIcon,
  StoreIcon,
} from "@/components/icons";
import type { UserType } from "@/context/diagnosis-context";
import {
  DUMMY_MYPAGE,
  GRADE_COLOR_HEX,
  type ReportHistoryEntry,
  type TrendDirection,
} from "@/lib/mypage-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";

type Tab = "history" | "settings";

const TREND_META: Record<
  TrendDirection,
  { icon: ComponentType<{ className?: string }>; label: string }
> = {
  improving: { icon: ArrowUpIcon, label: "개선 중" },
  steady: { icon: ArrowRightIcon, label: "유지 중" },
  worsening: { icon: ArrowDownIcon, label: "악화 중" },
};

const USER_TYPE_ICON: Record<
  UserType,
  ComponentType<{ className?: string }>
> = {
  소상공인: StoreIcon,
  일반가구: HomeIcon,
  취약계층: HeartIcon,
};

function MiniTrendChart({ values }: { values: number[] }) {
  const width = 280;
  const height = 64;
  // Dots have radius 3.5 — without this padding, the lowest/highest point
  // plots its center right on the viewBox edge and the dot gets clipped.
  // Dots (r=3.5) need padding on all sides so they don't get clipped by the
  // SVG viewport. overflow="visible" lets them slightly exceed the viewBox too.
  const dotPadding = 6;
  const plotWidth = width - dotPadding * 2;
  const plotHeight = height - dotPadding * 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => ({
    x: dotPadding + (index / (values.length - 1)) * plotWidth,
    y: dotPadding + plotHeight - ((value - min) / range) * plotHeight,
  }));

  const pathD = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
      preserveAspectRatio="none"
      className="mt-4 h-16 w-full"
    >
      <path
        d={pathD}
        fill="none"
        stroke="#1ba77d"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="#1ba77d" />
      ))}
    </svg>
  );
}

function ReportHistoryCard({ entry }: { entry: ReportHistoryEntry }) {
  const gradeColor = GRADE_COLOR_HEX[entry.grade];
  const TypeIcon = USER_TYPE_ICON[entry.userType];

  return (
    <div
      className="overflow-hidden rounded-2xl border-l-4 bg-white shadow-sm shadow-emerald-950/5"
      style={{ borderLeftColor: gradeColor }}
    >
      <div className="flex items-center gap-3 p-4">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-black"
          style={{ backgroundColor: `${gradeColor}1a`, color: gradeColor }}
        >
          {entry.grade}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black">{entry.month}</p>
            <ChevronRightIcon className="size-4 text-[#c7d2cc]" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3f0] px-2 py-0.5 text-xs font-bold text-[#13261f]">
              <TypeIcon className="size-3" />
              {entry.userType}
            </span>
            {entry.changePercent !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black ${
                  entry.isIncrease
                    ? "bg-[#fbe2e2] text-[#c23b3b]"
                    : "bg-[#dff1ea] text-[#1ba77d]"
                }`}
              >
                {entry.isIncrease ? (
                  <ArrowUpIcon className="size-2.5" />
                ) : (
                  <ArrowDownIcon className="size-2.5" />
                )}
                {entry.changePercent}%
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm font-black">
            {entry.co2Tons}
            <span className="ml-1 text-xs font-bold text-[#789b8c]">
              tCO₂e · {entry.usageKwh}kWh · {entry.address}
            </span>
          </p>
        </div>
      </div>

      {entry.isLatest ? (
        <p className="flex items-center gap-1.5 bg-[#eef8f3] px-4 py-2.5 text-xs font-bold text-[#1ba77d]">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-[#1ba77d]"
          />
          가장 최근 진단
        </p>
      ) : null}
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  trailing,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  trailing?: string;
  href?: string;
}) {
  if (!href) {
    return (
      <div className="flex items-center gap-3 px-4 py-4">
        <Icon className="size-5 text-[#1ba77d]" />
        <p className="flex-1 text-sm font-black">{label}</p>
        <span className="text-sm font-bold text-[#9aa6a1]">{trailing}</span>
      </div>
    );
  }

  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-4">
      <Icon className="size-5 text-[#1ba77d]" />
      <p className="flex-1 text-sm font-black">{label}</p>
      <ChevronRightIcon className="size-4 text-[#c7d2cc]" />
    </Link>
  );
}

export default function MyPagePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("history");
  const data = DUMMY_MYPAGE;
  const userName = data.userEmail.split("@")[0];
  const TrendIcon = TREND_META[data.recentTrend].icon;
  const trendLabel = TREND_META[data.recentTrend].label;

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#064734] via-[#13976f] to-[#49cfaa] px-6 pb-7 pt-10 text-white">
          <div className="pointer-events-none absolute -bottom-16 -left-14 size-44 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-950/18" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-white/15 ring-2 ring-white/20">
              <SproutIcon className="size-8" />
            </div>
            <p className="text-2xl font-black">{userName}</p>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/15 px-2 py-4 text-center backdrop-blur">
              <p className="text-xs font-bold text-white/70">진단 횟수</p>
              <p className="mt-1 text-lg font-black">{data.diagnosisCount}회</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-2 py-4 text-center backdrop-blur">
              <p className="text-xs font-bold text-white/70">최저 배출</p>
              <p className="mt-1 text-lg font-black">
                {data.lowestEmissionTons}t
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-2 py-4 text-center backdrop-blur">
              <p className="text-xs font-bold text-white/70">최근 추세</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-lg font-black">
                <TrendIcon className="size-4" />
                {trendLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 py-6">
          <div className="flex gap-1 rounded-2xl bg-[#e3efe9] p-1">
            <button
              type="button"
              aria-pressed={tab === "history"}
              onClick={() => setTab("history")}
              className={`flex-1 rounded-xl py-3 text-base font-black ${
                tab === "history"
                  ? "bg-white text-[#13261f] shadow-sm"
                  : "text-[#8b9290]"
              }`}
            >
              리포트 이력
            </button>
            <button
              type="button"
              aria-pressed={tab === "settings"}
              onClick={() => setTab("settings")}
              className={`flex-1 rounded-xl py-3 text-base font-black ${
                tab === "settings"
                  ? "bg-white text-[#13261f] shadow-sm"
                  : "text-[#8b9290]"
              }`}
            >
              설정
            </button>
          </div>

          {tab === "history" ? (
            <>
              <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#789b8c]">
                    5개월 탄소 배출 추이
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#dff1ea] px-3 py-1 text-xs font-black text-[#1ba77d]">
                    <TrendIcon className="size-3" />
                    {trendLabel}
                  </span>
                </div>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#1ba77d]">
                    {data.trendChangePercent}%
                  </span>
                  <span className="text-sm font-bold text-[#789b8c]">
                    {data.trendChangeLabel}
                  </span>
                </p>
                <MiniTrendChart values={data.trendSparkline} />
                <div className="mt-1 flex justify-between text-xs font-bold text-[#9aa6a1]">
                  <span>{data.trendMonthLabels.first}</span>
                  <span>{data.trendMonthLabels.last}</span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {data.reportHistory.map((entry) => (
                  <ReportHistoryCard key={entry.month} entry={entry} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="divide-y divide-[#eef3f0] rounded-2xl border border-[#eef3f0] bg-white">
                <SettingsRow
                  icon={BellIcon}
                  label="알림 설정"
                  href="/mypage/notifications"
                />
                <SettingsRow
                  icon={LockIcon}
                  label="개인정보 처리방침"
                  href="/mypage/privacy"
                />
                <SettingsRow
                  icon={ClipboardIcon}
                  label="이용약관"
                  href="/mypage/terms"
                />
                <SettingsRow icon={InfoIcon} label="앱 버전" trailing="1.0.0" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-2xl border-2 border-[#e0473e] py-4 text-base font-black text-[#e0473e]"
              >
                로그아웃
              </button>
            </div>
          )}
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
