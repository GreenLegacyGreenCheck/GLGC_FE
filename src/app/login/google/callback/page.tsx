import { Suspense } from "react";
import GoogleCallbackContent from "./content";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center px-8 text-center sm:h-full">
          <p className="text-sm font-bold text-[#789b8c]">
            Google 로그인 처리 중이에요...
          </p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
