"use client";

import { useAuth } from "@/context/auth-context";
import { loginWithKakao } from "@/lib/auth-api";
import { getKakaoRedirectUri } from "@/lib/oauth-urls";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [asyncErrorMessage, setAsyncErrorMessage] = useState<string | null>(
    null,
  );
  const hasStartedRef = useRef(false);

  const code = searchParams.get("code");
  const redirectUri = getKakaoRedirectUri();
  // 쿼리스트링만으로 바로 판단되는 에러는 effect의 setState 없이 렌더 중에
  // 곧바로 계산한다 — 실제 카카오 토큰 교환(비동기)만 effect에서 다룬다.
  const immediateErrorMessage = searchParams.get("error")
    ? "카카오 로그인이 취소됐어요."
    : !code || !redirectUri
      ? "카카오 로그인 정보를 확인하지 못했어요."
      : null;

  useEffect(() => {
    if (
      hasStartedRef.current ||
      immediateErrorMessage ||
      !code ||
      !redirectUri
    ) {
      return;
    }
    hasStartedRef.current = true;

    loginWithKakao(code, redirectUri)
      .then(({ token, user }) => {
        auth.login(token, user);
        router.replace("/mypage");
      })
      .catch((error: unknown) => {
        setAsyncErrorMessage(
          error instanceof Error
            ? error.message
            : "카카오 로그인에 실패했어요.",
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, redirectUri, immediateErrorMessage]);

  const errorMessage = immediateErrorMessage ?? asyncErrorMessage;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 px-8 text-center sm:h-full">
      {errorMessage ? (
        <>
          <p className="text-base font-black text-[#13261f]">{errorMessage}</p>
          <Link
            href="/login"
            className="rounded-2xl bg-[#1ba77d] px-6 py-3 text-sm font-black text-white"
          >
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <p className="text-sm font-bold text-[#789b8c]">
          카카오 로그인 처리 중이에요...
        </p>
      )}
    </div>
  );
}
