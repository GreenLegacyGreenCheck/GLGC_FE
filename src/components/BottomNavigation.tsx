"use client";

import { HomeIcon, ListIcon, UserIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";

type BottomNavigationProps = {
  activeLabel?: string;
};

export default function BottomNavigation({
  activeLabel = "홈",
}: BottomNavigationProps) {
  const { result } = useDiagnosis();
  const { token } = useAuth();

  const tabs = [
    { icon: HomeIcon, label: "홈", href: "/" },
    // 리포트를 이미 한 번 받았으면 다시 업로드부터 시작하지 않고 곧바로
    // 그 리포트로 이동한다.
    {
      icon: ListIcon,
      label: "진단 리포트",
      href: result ? "/report" : "/upload",
    },
    // 비로그인 상태면 비회원용 마이페이지 대신 로그인 페이지로 바로 보낸다.
    { icon: UserIcon, label: "마이페이지", href: token ? "/mypage" : "/login" },
  ];

  return (
    <nav
      className="absolute inset-x-4 bottom-4 z-20 rounded-[2rem] bg-white p-2 shadow-xl shadow-emerald-950/12"
      aria-label="하단 메뉴"
    >
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = tab.label === activeLabel;

          return (
            <a
              key={tab.label}
              href={tab.href}
              className={`flex min-h-16 flex-col items-center justify-center rounded-[1.5rem] text-sm font-bold ${
                isActive ? "bg-[#dff1ea] text-[#1ba77d]" : "text-[#8b9290]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <tab.icon className="size-6" />
              <span className="mt-1">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
