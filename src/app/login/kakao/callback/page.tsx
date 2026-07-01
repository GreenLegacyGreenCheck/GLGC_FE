import { Suspense } from "react";
import KakaoCallbackContent from "./content";

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center px-8 text-center sm:h-full">
          <p className="text-sm font-bold text-[#789b8c]">
            카카오 로그인 처리 중이에요...
          </p>
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
