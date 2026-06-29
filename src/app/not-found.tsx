import { SproutIcon } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
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

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <SproutIcon className="sprout-sway size-32 text-[#1ba77d]" />

        <p className="mt-6 text-7xl font-black text-[#8fc4ae]">404</p>
        <h1 className="mt-3 text-xl font-black text-[#13261f]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-[#789b8c]">
          요청하신 페이지가 사라졌거나
          <br />
          주소가 잘못된 것 같아요
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1ba77d] px-8 py-4 text-base font-black text-white"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
