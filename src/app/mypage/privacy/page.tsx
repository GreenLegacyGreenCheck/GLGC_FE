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

export default function PrivacyPage() {
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
          <h1 className="ml-3 text-xl font-black">개인정보 처리방침</h1>
        </header>

        <section className="px-5 py-6">
          <p className="text-sm font-bold leading-6 text-[#5f7870]">
            GreenCheck(이하 서비스)는 이용자의 개인정보를 소중히 여기며,
            「개인정보 보호법」에 따라 아래와 같이 개인정보 처리방침을
            수립·공개합니다.
          </p>

          <Section title="제1조 수집하는 개인정보 항목">
            <p>서비스는 다음과 같은 정보를 수집합니다.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>이메일 주소 (회원가입·로그인 시)</li>
              <li>전기·가스 고지서 이미지 (탄소 진단 시, 처리 후 즉시 삭제)</li>
              <li>사용량·주소 등 고지서에서 추출된 수치 정보</li>
              <li>기기 식별 정보 및 앱 사용 로그</li>
            </ul>
          </Section>

          <Section title="제2조 개인정보의 수집 및 이용 목적">
            <ul className="list-disc space-y-1 pl-5">
              <li>탄소 배출 진단 및 맞춤 리포트 제공</li>
              <li>공공 지원사업 매칭 서비스 제공</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>법령에 따른 의무 이행</li>
            </ul>
          </Section>

          <Section title="제3조 개인정보의 보유 및 이용 기간">
            <p>
              회원 탈퇴 시 또는 수집 목적이 달성된 날로부터 지체 없이
              파기합니다. 단, 법령에서 별도의 보존 기간을 정한 경우에는 해당
              기간 동안 보관합니다.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                전자상거래 기록: 5년 (전자상거래 등에서의 소비자 보호에 관한
                법률)
              </li>
              <li>접속 로그: 3개월 (통신비밀보호법)</li>
            </ul>
          </Section>

          <Section title="제4조 개인정보의 제3자 제공">
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지
              않습니다. 다만, 이용자의 동의가 있거나 법령에 의한 경우에는 예외로
              합니다.
            </p>
          </Section>

          <Section title="제5조 개인정보의 파기">
            <p>
              개인정보가 불필요하게 된 경우 지체 없이 해당 정보를 파기합니다.
              전자 파일 형태는 복구 불가능한 방법으로 삭제하며, 종이 문서는
              분쇄기로 파기합니다.
            </p>
          </Section>

          <Section title="제6조 정보주체의 권리·의무 및 행사 방법">
            <p>
              이용자는 언제든지 자신의 개인정보를 조회하거나 수정·삭제를 요청할
              수 있습니다. 이의가 있는 경우 개인정보 보호 책임자에게 서면,
              이메일 등으로 연락하시면 지체 없이 처리합니다.
            </p>
          </Section>

          <Section title="제7조 개인정보 보호 책임자">
            <ul className="list-none space-y-1">
              <li>책임자: GreenCheck 팀</li>
            </ul>
          </Section>
        </section>
      </div>

      <BottomNavigation activeLabel="마이페이지" />
    </>
  );
}
