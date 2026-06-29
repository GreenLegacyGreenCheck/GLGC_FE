"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { ChatIcon, LightbulbIcon } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";

type AuthMode = "login" | "signup";

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.04 12.27c0-.8-.07-1.57-.2-2.31H12v4.38h6.2c-.27 1.42-1.08 2.62-2.3 3.43v2.85h3.71c2.17-2 3.43-4.94 3.43-8.35Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.71-2.85c-1.03.7-2.35 1.1-3.84.1-2.85 0-5.27-1.92-6.13-4.51H2.18v2.92C3.99 20.46 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 13.7a7.4 7.4 0 0 1 0-4.4V6.38H2.18a11.95 11.95 0 0 0 0 11.24l3.66-2.92Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.18c1.6 0 3.04.55 4.16 1.62l3.3-3.3C17.45 1.7 14.96.7 12 .7 7.7.7 3.99 3.24 2.18 6.38l3.66 2.92C6.7 7.7 9.13 5.18 12 5.18Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(
    null,
  );

  const title = mode === "login" ? "로그인" : "회원가입";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setComingSoonMessage(`${title} 기능은 준비 중이에요`);
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="홈으로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">{title}</h1>
        </header>

        <section className="px-5 py-6">
          <div className="flex items-start gap-3 rounded-2xl bg-[#eaf6f0] p-4">
            <LightbulbIcon className="size-5 shrink-0 text-[#f0b429]" />
            <p className="text-sm font-bold text-[#3f4a46]">
              로그인 없이도 탄소 진단과 리포트 확인은 무료로 이용할 수 있어요.
              로그인하면 결과가{" "}
              <span className="font-black text-[#13261f]">
                마이페이지에 자동 저장
              </span>
              돼요.
            </p>
          </div>

          <div className="mt-6 flex gap-1 rounded-2xl bg-[#e3efe9] p-1">
            <button
              type="button"
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setComingSoonMessage(null);
              }}
              className={`flex-1 rounded-xl py-3 text-base font-black ${
                mode === "login"
                  ? "bg-white text-[#13261f] shadow-sm"
                  : "text-[#8b9290]"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              aria-pressed={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setComingSoonMessage(null);
              }}
              className={`flex-1 rounded-xl py-3 text-base font-black ${
                mode === "signup"
                  ? "bg-white text-[#13261f] shadow-sm"
                  : "text-[#8b9290]"
              }`}
            >
              회원가입
            </button>
          </div>

          <form className="mt-6" onSubmit={handleSubmit}>
            <label className="block text-sm font-black" htmlFor="login-email">
              이메일
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="mt-2 h-14 w-full rounded-2xl border border-[#bee9df] bg-white px-5 text-base font-bold outline-none placeholder:text-[#a3aaa8] focus:border-[#1ba77d] focus:ring-4 focus:ring-[#1ba77d]/10"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label
              className="mt-5 block text-sm font-black"
              htmlFor="login-password"
            >
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={8}
              className="mt-2 h-14 w-full rounded-2xl border border-[#bee9df] bg-white px-5 text-base font-bold outline-none placeholder:text-[#a3aaa8] focus:border-[#1ba77d] focus:ring-4 focus:ring-[#1ba77d]/10"
              placeholder="8자 이상 입력해 주세요"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-[#1ba77d] py-4 text-base font-black text-white"
            >
              {title}
            </button>
          </form>

          {comingSoonMessage ? (
            <p className="mt-3 text-center text-xs font-bold text-[#789b8c]">
              {comingSoonMessage}
            </p>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e0eae4]" />
            <span className="text-xs font-bold text-[#9aa6a1]">
              또는 소셜 계정으로
            </span>
            <div className="h-px flex-1 bg-[#e0eae4]" />
          </div>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fee500] py-4 text-base font-black text-[#13261f]"
            onClick={() =>
              setComingSoonMessage("카카오 로그인 기능은 준비 중이에요")
            }
          >
            <ChatIcon className="size-5" />
            카카오로 계속하기
          </button>
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5eee9] bg-white py-4 text-base font-black text-[#13261f]"
            onClick={() =>
              setComingSoonMessage("Google 로그인 기능은 준비 중이에요")
            }
          >
            <GoogleIcon />
            Google로 계속하기
          </button>
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
