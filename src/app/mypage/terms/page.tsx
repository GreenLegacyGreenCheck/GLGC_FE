import BottomNavigation from "@/components/BottomNavigation";
import Link from "next/link";

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-black text-[#13261f]">{title}</h2>
      <div className="mt-2 text-sm font-bold leading-6 text-[#5f7870]">
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
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
          <h1 className="ml-3 text-xl font-black">이용약관</h1>
        </header>

        <section className="px-5 py-6">
          <Section title="제1조 목적">
            <p>
              이 약관은 GreenCheck(이하 서비스)가 제공하는 기후·에너지 자가진단
              플랫폼의 이용에 관한 조건 및 절차, 이용자와 서비스 간의 권리·의무
              및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 정의">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                서비스란 GreenCheck가 운영하는 탄소 배출 진단 플랫폼을 말합니다.
              </li>
              <li>이용자란 서비스에 접속하여 이용하는 모든 사람을 말합니다.</li>
              <li>
                회원이란 서비스에 가입하여 계정을 보유한 이용자를 말합니다.
              </li>
            </ul>
          </Section>

          <Section title="제3조 서비스의 제공">
            <p>서비스는 다음과 같은 기능을 제공합니다.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>전기·가스 고지서 기반 탄소 배출 자가진단</li>
              <li>탄소 등급 및 감축 리포트 제공</li>
              <li>공공 지원사업 맞춤 매칭</li>
              <li>감축 액션 추천</li>
            </ul>
          </Section>

          <Section title="제4조 이용자의 의무">
            <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>타인의 정보를 도용하거나 허위 정보를 입력하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>
                서비스를 통해 얻은 정보를 무단으로 상업적으로 이용하는 행위
              </li>
              <li>관련 법령을 위반하는 행위</li>
            </ul>
          </Section>

          <Section title="제5조 서비스의 중단">
            <p>
              서비스는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>시스템 점검·보수 및 업그레이드</li>
              <li>정전, 천재지변 등 불가항력적 사유</li>
              <li>기타 서비스 운영상 부득이한 사유</li>
            </ul>
          </Section>

          <Section title="제6조 면책">
            <p>
              서비스가 제공하는 탄소 진단 결과는 참고용이며, 법적·행정적 효력이
              없습니다. 진단 결과에 따른 의사결정의 책임은 이용자에게 있습니다.
            </p>
          </Section>

          <Section title="제7조 분쟁 해결">
            <p>
              서비스와 이용자 간에 발생한 분쟁은 상호 협의를 통해 해결하며,
              협의가 이루어지지 않을 경우 관련 법령에 따른 절차를 따릅니다.
            </p>
          </Section>
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
