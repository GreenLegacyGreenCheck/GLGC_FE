"use client";

import SignatureCanvas from "@/components/SignatureCanvas";
import type { SignatureCanvasHandle } from "@/components/SignatureCanvas";
import { useDiagnosis } from "@/context/diagnosis-context";
import {
  fillSolarApplicationPdf,
  type SolarApplicationData,
} from "@/lib/fill-solar-pdf";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

// ─── 아이콘 ───────────────────────────────────────────────────────────────────

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

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20 15.7 15.7" />
    </svg>
  );
}

// ─── 스마트 인풋 컴포넌트들 ──────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-2xl border-2 border-[#e5eee9] bg-white px-4 py-3 text-sm font-bold placeholder:text-[#c8ddd5] focus:border-[#1ba77d] focus:outline-none";

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-xs font-black text-[#789b8c]">
      {children}
      {required ? <span className="ml-0.5 text-[#1ba77d]">*</span> : null}
    </span>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INPUT_CLS}
    />
  );
}

// 전화번호 자동 하이픈
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 5)
      return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function PhoneInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(formatPhone(e.target.value))}
      placeholder={placeholder}
      className={INPUT_CLS}
    />
  );
}

// 생년월일 자동 점
function formatBirthDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

function BirthDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatBirthDate(e.target.value))}
      placeholder="2000.01.01"
      className={INPUT_CLS}
      maxLength={10}
    />
  );
}

// 이메일 — 로컬 + 도메인 선택
const EMAIL_DOMAINS = [
  "gmail.com",
  "naver.com",
  "kakao.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
  "hotmail.com",
  "icloud.com",
];

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, domain] = value.includes("@") ? value.split("@") : [value, ""];
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={local}
        onChange={(e) => onChange(`${e.target.value}@${domain}`)}
        placeholder="아이디"
        className="min-w-0 flex-1 rounded-2xl border-2 border-[#e5eee9] bg-white px-4 py-3 text-sm font-bold placeholder:text-[#c8ddd5] focus:border-[#1ba77d] focus:outline-none"
      />
      <span className="shrink-0 font-bold text-[#789b8c]">@</span>
      <input
        type="text"
        value={domain}
        onChange={(e) => onChange(`${local}@${e.target.value}`)}
        placeholder="도메인 선택"
        list="email-domain-list"
        className="min-w-0 flex-1 rounded-2xl border-2 border-[#e5eee9] bg-white px-4 py-3 text-sm font-bold placeholder:text-[#c8ddd5] focus:border-[#1ba77d] focus:outline-none"
      />
      <datalist id="email-domain-list">
        {EMAIL_DOMAINS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
    </div>
  );
}

// 카카오 주소 검색
function openKakaoPostcode(onSelect: (addr: string) => void) {
  const load = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (window as any).daum.Postcode({
      oncomplete: (data: { roadAddress: string; jibunAddress: string }) => {
        onSelect(data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  if (document.getElementById("kakao-postcode-script")) {
    load();
    return;
  }
  const s = document.createElement("script");
  s.id = "kakao-postcode-script";
  s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  s.onload = load;
  document.head.appendChild(s);
}

function AddressInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        readOnly
        placeholder="도로명 주소 검색"
        onClick={() => openKakaoPostcode(onChange)}
        className={`${INPUT_CLS} flex-1 cursor-pointer`}
      />
      <button
        type="button"
        onClick={() => openKakaoPostcode(onChange)}
        className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#1ba77d] px-4 py-3 text-sm font-black text-white"
      >
        <SearchIcon /> 검색
      </button>
    </div>
  );
}

// 은행 선택
const BANKS = [
  "국민은행",
  "신한은행",
  "하나은행",
  "우리은행",
  "IBK기업은행",
  "농협은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "새마을금고",
  "수협은행",
  "부산은행",
  "대구은행",
  "경남은행",
  "광주은행",
  "전북은행",
];

function BankInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list="bank-list"
        placeholder="은행 선택 또는 직접 입력"
        className={INPUT_CLS}
      />
      <datalist id="bank-list">
        {BANKS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>
  );
}

// ─── 다운로드 모달 ─────────────────────────────────────────────────────────────

function DownloadModal({
  onPdf,
  onHwpx,
  onClose,
  isWorking,
}: {
  onPdf: () => void;
  onHwpx: () => void;
  onClose: () => void;
  isWorking: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">다운로드 형식 선택</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#789b8c]"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>
        <p className="mt-2 text-xs font-bold text-[#789b8c]">
          자동 작성된 초안을 원하는 형식으로 다운받으세요.
        </p>
        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={isWorking}
            onClick={onPdf}
            className="w-full rounded-2xl bg-[#1ba77d] px-5 py-4 text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/20 text-xl">
                📄
              </span>
              <div>
                <p className="text-base font-black text-white">
                  {isWorking ? "생성 중..." : "PDF 다운로드"}
                </p>
                <p className="text-xs font-bold text-white/70">
                  서명이 삽입된 자동 작성 초안 (전 페이지)
                </p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={onHwpx}
            className="w-full rounded-2xl border-2 border-[#e5eee9] bg-white px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#eef8f3] text-xl">
                📝
              </span>
              <div>
                <p className="text-base font-black text-[#13261f]">
                  원본 양식 다운로드
                </p>
                <p className="text-xs font-bold text-[#789b8c]">
                  빈 PDF 원본 · 직접 편집용
                </p>
              </div>
            </div>
          </button>
        </div>
        <p className="mt-4 text-center text-xs font-bold text-[#aabbb5]">
          공식 제출 전 내용을 반드시 검토하세요.
        </p>
      </div>
    </div>
  );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mt-7 border-b border-[#eef3f0] pb-2">
      <h2 className="text-base font-black text-[#13261f]">{title}</h2>
      {desc ? (
        <p className="mt-0.5 text-xs font-bold text-[#789b8c]">{desc}</p>
      ) : null}
    </div>
  );
}

// ─── 날짜 포맷 헬퍼 ───────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

function DraftPageInner() {
  const searchParams = useSearchParams();
  const programTitle = searchParams.get("title") ?? "";

  const { result } = useDiagnosis();
  const prefillAddress =
    result?.electricOcr?.supplyAddress.value ??
    result?.gasOcr?.supplyAddress.value ??
    "";

  const startD = new Date();
  startD.setDate(startD.getDate() + 3);
  const endD = new Date();
  endD.setDate(endD.getDate() + 12);

  const [form, setForm] = useState<
    Omit<SolarApplicationData, "signatureDataUrl">
  >({
    name: "",
    birthDate: "",
    address: prefillAddress,
    detailAddress: "",
    complexName: "",
    unitNumber: "",
    landlinePhone: "",
    mobilePhone: "",
    email: "",
    installLocation: "자택 베란다",
    installStartDate: fmtDate(startD),
    installEndDate: fmtDate(endD),
    bank: "",
    accountNumber: "",
  });

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sigRef = useRef<SignatureCanvasHandle>(null);

  function f(key: keyof typeof form) {
    return (v: string) => setForm((prev) => ({ ...prev, [key]: v }));
  }

  const canProceed = Boolean(signatureUrl && form.name);

  async function handlePdfDownload() {
    setIsGenerating(true);
    setError(null);
    try {
      const bytes = await fillSolarApplicationPdf({
        ...form,
        signatureDataUrl: signatureUrl,
      });
      const url = URL.createObjectURL(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "신청서_초안.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setShowModal(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "PDF 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleHwpxDownload() {
    const a = document.createElement("a");
    a.href = "/forms/solar-application.pdf";
    a.download = "베란다형태양광_신청서_원본.pdf";
    a.click();
    setShowModal(false);
  }

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-36 sm:h-full">
        {/* 헤더 */}
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/support"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="맞춤 지원사업으로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">서류 초안 받아보기</h1>
        </header>

        <section className="px-5 pt-5">
          {/* 안내 */}
          <div className="rounded-2xl bg-[#eef8f3] px-5 py-4">
            <p className="text-sm font-black text-[#0d5f4b]">
              지원사업 공고문을 기반으로 필요한 개인정보를 자동 정리해드려요.
            </p>
            <p className="mt-1 text-xs font-bold text-[#3a7d63]">
              전자서명을 삽입해 전 페이지의 (인) 위치에 자동으로 날인됩니다.
            </p>
          </div>

          {programTitle ? (
            <div className="mt-3 rounded-2xl border border-[#e5eee9] bg-white px-5 py-3">
              <p className="text-xs font-black text-[#789b8c]">지원사업</p>
              <p className="mt-0.5 text-sm font-black">{programTitle}</p>
            </div>
          ) : null}

          {/* ── 기본 정보 ── */}
          <SectionHeader title="기본 정보" />
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label required>성명</Label>
                <TextInput
                  value={form.name}
                  onChange={f("name")}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <Label>생년월일</Label>
                <BirthDateInput
                  value={form.birthDate}
                  onChange={f("birthDate")}
                />
              </div>
            </div>
          </div>

          {/* ── 주소 ── */}
          <SectionHeader
            title="주소"
            desc="카카오 주소 검색으로 도로명 주소를 입력해요."
          />
          <div className="mt-3 space-y-3">
            <div>
              <Label>도로명 주소</Label>
              <AddressInput value={form.address} onChange={f("address")} />
            </div>
            <div>
              <Label>상세 주소</Label>
              <TextInput
                value={form.detailAddress}
                onChange={f("detailAddress")}
                placeholder="동, 호수 등 (예: 102동 501호)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>공동주택명</Label>
                <TextInput
                  value={form.complexName}
                  onChange={f("complexName")}
                  placeholder="예: 나래빌라"
                />
              </div>
              <div>
                <Label>세부주소 (동/호)</Label>
                <TextInput
                  value={form.unitNumber}
                  onChange={f("unitNumber")}
                  placeholder="예: 2동 1호"
                />
              </div>
            </div>
          </div>

          {/* ── 연락처 ── */}
          <SectionHeader title="연락처" />
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>일반전화</Label>
                <PhoneInput
                  value={form.landlinePhone}
                  onChange={f("landlinePhone")}
                  placeholder="02-000-0000"
                />
              </div>
              <div>
                <Label>휴대전화</Label>
                <PhoneInput
                  value={form.mobilePhone}
                  onChange={f("mobilePhone")}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div>
              <Label>전자메일</Label>
              <EmailInput value={form.email} onChange={f("email")} />
            </div>
          </div>

          {/* ── 설치 정보 ── */}
          <SectionHeader title="설치 정보" />
          <div className="mt-3 space-y-3">
            <div>
              <Label>설치 장소</Label>
              <TextInput
                value={form.installLocation}
                onChange={f("installLocation")}
                placeholder="자택 베란다"
              />
            </div>
            <div>
              <Label>설치 기간</Label>
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  value={form.installStartDate}
                  onChange={f("installStartDate")}
                  placeholder="2026. 07. 05."
                />
                <TextInput
                  value={form.installEndDate}
                  onChange={f("installEndDate")}
                  placeholder="2026. 07. 14."
                />
              </div>
            </div>
          </div>

          {/* ── 환급 계좌 ── */}
          <SectionHeader title="환급 계좌" />
          <div className="mt-3 space-y-3">
            <div>
              <Label>거래 은행</Label>
              <BankInput value={form.bank} onChange={f("bank")} />
            </div>
            <div>
              <Label>계좌번호</Label>
              <TextInput
                value={form.accountNumber}
                onChange={f("accountNumber")}
                placeholder="000-000-000000"
              />
            </div>
            <p className="text-xs font-bold text-[#789b8c]">
              예금주는 성명과 동일하게 자동 입력됩니다.
            </p>
          </div>

          {/* ── 전자서명 ── */}
          <SectionHeader
            title="전자서명"
            desc="서명 완료 후 PDF의 모든 (인) 위치에 자동으로 날인됩니다."
          />
          <div className="mt-3">
            <SignatureCanvas ref={sigRef} />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                sigRef.current?.clear();
                setSignatureUrl(null);
              }}
              className="rounded-xl border border-[#e5eee9] bg-white px-4 py-2 text-sm font-black text-[#789b8c]"
            >
              지우기
            </button>
            <button
              type="button"
              onClick={() => {
                if (!sigRef.current?.isEmpty())
                  setSignatureUrl(sigRef.current?.getDataUrl() ?? null);
              }}
              className="flex-1 rounded-xl bg-[#eef8f3] px-4 py-2 text-sm font-black text-[#1ba77d]"
            >
              서명 완료
            </button>
          </div>

          {signatureUrl ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#c9eee4] bg-[#f5fbf8] px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureUrl}
                alt="서명 미리보기"
                className="h-10 w-auto object-contain"
              />
              <span className="text-xs font-black text-[#1ba77d]">
                서명 등록 완료 — 전 페이지 (인)에 삽입됩니다.
              </span>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          {/* ── 다운로드 ── */}
          <div className="mt-8 pb-4">
            {!form.name ? (
              <p className="mb-3 text-center text-xs font-bold text-[#789b8c]">
                성명을 입력해주세요.
              </p>
            ) : !signatureUrl ? (
              <p className="mb-3 text-center text-xs font-bold text-[#789b8c]">
                전자서명을 완료해주세요.
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canProceed}
              onClick={() => {
                setError(null);
                setShowModal(true);
              }}
              className="w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white disabled:opacity-40"
            >
              서류 초안 받아보기
            </button>
            <p className="mt-4 text-center text-xs font-bold text-[#aabbb5]">
              정부 서식에 자동 입력 후 다운로드 형식을 선택할 수 있어요.
            </p>
          </div>
        </section>
      </div>

      {showModal ? (
        <DownloadModal
          onPdf={handlePdfDownload}
          onHwpx={handleHwpxDownload}
          onClose={() => setShowModal(false)}
          isWorking={isGenerating}
        />
      ) : null}
    </>
  );
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftPageInner />
    </Suspense>
  );
}
