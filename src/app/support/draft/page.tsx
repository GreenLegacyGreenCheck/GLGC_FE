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

// ─── icons ────────────────────────────────────────────────────────────────────

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

// ─── small shared components ──────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-black text-[#789b8c]">
      {children}
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
      className="w-full rounded-2xl border-2 border-[#e5eee9] bg-white px-4 py-3 text-sm font-bold placeholder:text-[#c8ddd5] focus:border-[#1ba77d] focus:outline-none"
    />
  );
}

// ─── Format selection modal ───────────────────────────────────────────────────

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
          {/* PDF */}
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
                  서명이 삽입된 자동 작성 초안
                </p>
              </div>
            </div>
          </button>

          {/* HWPX */}
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
                  빈 PDF 원본 · 한글 앱에서 직접 편집
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

// ─── Main page ────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}.`;
}

function DraftPageInner() {
  const searchParams = useSearchParams();
  const programTitle = searchParams.get("title") ?? "";

  const { result } = useDiagnosis();
  const prefillAddress =
    result?.electricOcr?.supplyAddress.value ??
    result?.gasOcr?.supplyAddress.value ??
    "";

  // 설치 기간 자동 계산: 신청일+3 ~ 신청일+12
  const startD = new Date();
  startD.setDate(startD.getDate() + 3);
  const endD = new Date();
  endD.setDate(endD.getDate() + 12);

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    address: prefillAddress,
    landlinePhone: "",
    mobilePhone: "",
    email: "",
    installLocation: "자택 베란다", // 베란다형 태양광 기본값
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

  function field(key: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  function handleSign() {
    if (sigRef.current?.isEmpty()) return;
    setSignatureUrl(sigRef.current?.getDataUrl() ?? null);
  }

  function handleClearSig() {
    sigRef.current?.clear();
    setSignatureUrl(null);
  }

  const canProceed = Boolean(signatureUrl && form.name);

  async function handlePdfDownload() {
    setIsGenerating(true);
    setError(null);
    try {
      const data: SolarApplicationData = {
        ...form,
        signatureDataUrl: signatureUrl,
      };
      const pdfBytes = await fillSolarApplicationPdf(data);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
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
    // Blank template download
    const a = document.createElement("a");
    a.href = "/forms/solar-application.pdf";
    a.download = "베란다형태양광_신청서_원본.pdf";
    a.click();
    setShowModal(false);
  }

  return (
    <>
      <div className="flex h-screen flex-col sm:h-full">
        {/* ── Sticky: 헤더 + 소개 + 사업 카드 ── */}
        <div className="sticky top-0 z-10 bg-[#f2faf6]">
          <header className="flex items-center gap-4 px-5 py-5">
            <Link
              href="/support"
              className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
              aria-label="맞춤 지원사업으로 돌아가기"
            >
              <ChevronLeftIcon />
            </Link>
            <h1 className="text-xl font-black">서류 초안 받아보기</h1>
          </header>

          <div className="border-b border-[#e5eee9] px-5 pb-4">
            <div className="rounded-2xl bg-[#eef8f3] px-5 py-4">
              <p className="text-sm font-black text-[#0d5f4b]">
                지원사업 공고문을 기반으로 신청 목적, 기대 효과, 사업장 정보를
                자동으로 정리해드려요.
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a7d63]">
                서명이 필요한 문서는 전자서명을 삽입해 PDF로 다운로드할 수
                있습니다.
              </p>
            </div>

            {programTitle ? (
              <div className="mt-3 rounded-2xl border border-[#e5eee9] bg-white px-5 py-4">
                <p className="text-xs font-black text-[#789b8c]">지원사업</p>
                <p className="mt-1 text-base font-black">{programTitle}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── 스크롤 영역: 폼 전체 ── */}
        <div className="scrollbar-hidden flex-1 overflow-y-auto overscroll-contain pb-32">
          <section className="px-5 pt-6">
            {/* ── 신청인 정보 ── */}
            <h2 className="mt-6 text-base font-black">신청인 정보</h2>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>성명 *</FieldLabel>
                  <TextInput
                    value={form.name}
                    onChange={field("name")}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <FieldLabel>생년월일</FieldLabel>
                  <TextInput
                    value={form.birthDate}
                    onChange={field("birthDate")}
                    placeholder="2000.01.01"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>주소</FieldLabel>
                <TextInput
                  value={form.address}
                  onChange={field("address")}
                  placeholder="서울특별시 노원구 ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>일반전화</FieldLabel>
                  <TextInput
                    value={form.landlinePhone}
                    onChange={field("landlinePhone")}
                    placeholder="02-000-0000"
                    type="tel"
                  />
                </div>
                <div>
                  <FieldLabel>휴대전화</FieldLabel>
                  <TextInput
                    value={form.mobilePhone}
                    onChange={field("mobilePhone")}
                    placeholder="010-0000-0000"
                    type="tel"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>전자메일</FieldLabel>
                <TextInput
                  value={form.email}
                  onChange={field("email")}
                  placeholder="me@example.com"
                  type="email"
                />
              </div>
            </div>

            {/* ── 설치 정보 ── */}
            <h2 className="mt-6 text-base font-black">설치 정보</h2>
            <div className="mt-3 space-y-4">
              <div>
                <FieldLabel>설치장소</FieldLabel>
                <TextInput
                  value={form.installLocation}
                  onChange={field("installLocation")}
                  placeholder="자택 베란다"
                />
              </div>

              <div>
                <FieldLabel>설치기간</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    value={form.installStartDate}
                    onChange={field("installStartDate")}
                    placeholder="2026. 07. 03."
                  />
                  <TextInput
                    value={form.installEndDate}
                    onChange={field("installEndDate")}
                    placeholder="2026. 07. 12."
                  />
                </div>
              </div>
            </div>

            {/* ── 환급 계좌 ── */}
            <h2 className="mt-6 text-base font-black">환급 계좌</h2>
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>거래 은행</FieldLabel>
                  <TextInput
                    value={form.bank}
                    onChange={field("bank")}
                    placeholder="국민은행"
                  />
                </div>
                <div>
                  <FieldLabel>계좌번호</FieldLabel>
                  <TextInput
                    value={form.accountNumber}
                    onChange={field("accountNumber")}
                    placeholder="000-000-000000"
                  />
                </div>
              </div>
              <p className="text-xs font-bold text-[#789b8c]">
                예금주는 성명과 동일하게 자동 입력됩니다.
              </p>
            </div>

            {/* ── 전자서명 ── */}
            <h2 className="mt-6 text-base font-black">전자서명</h2>
            <p className="mt-1 text-xs font-bold text-[#789b8c]">
              아래 영역에 서명 후 &apos;서명 완료&apos;를 눌러주세요. PDF의 (인)
              위치에 자동으로 삽입됩니다.
            </p>
            <div className="mt-3">
              <SignatureCanvas ref={sigRef} />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleClearSig}
                className="rounded-xl border border-[#e5eee9] bg-white px-4 py-2 text-sm font-black text-[#789b8c]"
              >
                지우기
              </button>
              <button
                type="button"
                onClick={handleSign}
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
                  서명이 등록되었습니다. PDF (인) 위치에 삽입돼요.
                </span>
              </div>
            ) : null}

            {/* ── Error ── */}
            {error ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            ) : null}

            {/* ── Download button ── */}
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
      </div>

      {/* Format selection modal */}
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
