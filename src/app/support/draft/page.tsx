"use client";

import SignatureCanvas from "@/components/SignatureCanvas";
import type { SignatureCanvasHandle } from "@/components/SignatureCanvas";
import { useDiagnosis } from "@/context/diagnosis-context";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

const CONSENTS = [
  "개인정보 수집·이용에 동의합니다.",
  "개인정보 제3자 제공에 동의합니다.",
  "신청 내용이 사실임을 확인합니다.",
  "허위 신청 시 지원금 반환 및 관련 법적 책임에 동의합니다.",
] as const;

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

function Label({ children }: { children: React.ReactNode }) {
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

// ─── Printable Document (off-screen, captured by html2canvas) ─────────────────

function DocInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "6px" }}>
      <span
        style={{
          fontSize: "10px",
          color: "#789b8c",
          fontWeight: 700,
          marginRight: "4px",
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontSize: "12px",
          color: value ? "#13261f" : "#c0d4cc",
          fontWeight: 700,
        }}
      >
        {value || "미입력"}
      </span>
    </div>
  );
}

function PrintDocument({
  printRef,
  programTitle,
  programDocuments,
  form,
  consents,
  signatureUrl,
  today,
  co2Tons,
}: {
  printRef: React.RefObject<HTMLDivElement | null>;
  programTitle: string;
  programDocuments: string;
  form: {
    name: string;
    phone: string;
    email: string;
    address: string;
    installLocation: string;
    bank: string;
    accountNumber: string;
  };
  consents: readonly boolean[];
  signatureUrl: string | null;
  today: string;
  co2Tons: number | null;
}) {
  return (
    <div
      ref={printRef}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "750px",
        background: "white",
        padding: "56px 60px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Document header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "2.5px solid #1ba77d",
          paddingBottom: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#1ba77d",
              fontWeight: 900,
              marginBottom: "6px",
              letterSpacing: "0.04em",
            }}
          >
            GreenCheck
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#13261f" }}>
            에너지 효율화 지원사업 신청서
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: "11px",
            color: "#789b8c",
            fontWeight: 700,
            paddingTop: "4px",
          }}
        >
          <div>작성일: {today}</div>
          {programTitle ? (
            <div style={{ marginTop: "4px", color: "#1ba77d" }}>
              {programTitle}
            </div>
          ) : null}
        </div>
      </div>

      {/* Applicant info */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 900,
            color: "#1ba77d",
            letterSpacing: "0.06em",
            marginBottom: "14px",
          }}
        >
          신청인 정보
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 32px",
          }}
        >
          <DocInfoRow label="이름" value={form.name} />
          <DocInfoRow label="전화번호" value={form.phone} />
          <DocInfoRow label="이메일" value={form.email} />
          <DocInfoRow label="거래 은행" value={form.bank} />
          <DocInfoRow label="계좌번호" value={form.accountNumber} />
        </div>
        <div style={{ marginTop: "8px" }}>
          <DocInfoRow label="사업장 주소" value={form.address} />
          <DocInfoRow label="설치 예정 장소" value={form.installLocation} />
        </div>
      </div>

      {/* Purpose */}
      {co2Tons != null ? (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 900,
              color: "#1ba77d",
              letterSpacing: "0.06em",
              marginBottom: "10px",
            }}
          >
            신청 목적 및 기대 효과
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#333",
              lineHeight: "1.85",
              fontWeight: 500,
            }}
          >
            본 신청인은 에너지 사용량 분석 결과 현재 연간 약{" "}
            {co2Tons.toFixed(2)} tCO₂e를 배출하고 있으며, 에너지 효율화를 통한
            탄소 감축을 목적으로 {programTitle || "본 지원사업"}을 신청합니다.
            해당 조치 시행을 통해 연간 탄소배출량을 유의미하게 절감하고 에너지
            비용 감소 및 탄소중립 목표 달성에 기여할 것으로 기대합니다.
          </p>
        </div>
      ) : null}

      {/* Required documents */}
      {programDocuments ? (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 900,
              color: "#1ba77d",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            필요 서류
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#555",
              lineHeight: "1.7",
              fontWeight: 500,
            }}
          >
            {programDocuments}
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "#aabbb5",
              marginTop: "6px",
              fontStyle: "italic",
            }}
          >
            ※ 필요 서류는 지원기관 확인 후 별도 제출하시기 바랍니다.
          </p>
        </div>
      ) : null}

      {/* Consents */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 900,
            color: "#1ba77d",
            letterSpacing: "0.06em",
            marginBottom: "10px",
          }}
        >
          동의 항목
        </div>
        {CONSENTS.map((text, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "15px",
                height: "15px",
                borderRadius: "4px",
                border: `2px solid ${consents[i] ? "#1ba77d" : "#d8e7e0"}`,
                background: consents[i] ? "#1ba77d" : "white",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {consents[i] ? (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M1.5 4.5l2 2 4-4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "#333",
                lineHeight: "1.5",
                fontWeight: 500,
              }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* Signature */}
      <div style={{ borderTop: "1px solid #eef3f0", paddingTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center", minWidth: "180px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#789b8c",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              {today} 신청인
            </div>
            {signatureUrl ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureUrl}
                  alt="서명"
                  style={{
                    height: "90px",
                    width: "180px",
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    borderTop: "1px solid #d8e7e0",
                    paddingTop: "6px",
                    fontSize: "10px",
                    color: "#789b8c",
                  }}
                >
                  (서명)
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: "180px",
                  height: "90px",
                  border: "1px dashed #d8e7e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "11px", color: "#c0d4cc" }}>
                  서명 필요
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "12px",
          borderTop: "1px solid #f0f7f4",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "10px", color: "#aabbb5" }}>
          본 문서는 GreenCheck 탄소배출 진단 서비스를 통해 자동 생성된
          초안입니다. 공식 제출 전 내용을 반드시 확인하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DraftPageInner() {
  const searchParams = useSearchParams();
  const programTitle = searchParams.get("title") ?? "";
  const programDocuments = searchParams.get("documents") ?? "";

  const { result } = useDiagnosis();
  const prefillAddress =
    result?.electricOcr?.supplyAddress.value ??
    result?.gasOcr?.supplyAddress.value ??
    "";
  const co2Tons = result != null ? (result.totalCo2Kg ?? 0) / 1000 : null;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: prefillAddress,
    installLocation: "",
    bank: "",
    accountNumber: "",
  });

  const [consents, setConsents] = useState<boolean[]>(
    CONSENTS.map(() => false),
  );
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const sigRef = useRef<SignatureCanvasHandle>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const allConsented = consents.every(Boolean);
  const canDownload = allConsented && Boolean(signatureUrl);

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

  async function handleDownload() {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const el = printRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const A4_W = 595.28;
      const A4_H = 841.89;
      const MARGIN = 28;
      const cw = A4_W - MARGIN * 2;
      const ch = A4_H - MARGIN * 2;
      const pageHeightPx = Math.floor((ch * canvas.width) / cw);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();
        const srcY = page * pageHeightPx;
        const srcH = Math.min(pageHeightPx, canvas.height - srcY);
        const pc = document.createElement("canvas");
        pc.width = canvas.width;
        pc.height = srcH;
        const ctx = pc.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          srcH,
          0,
          0,
          canvas.width,
          srcH,
        );
        const imgData = pc.toDataURL("image/png");
        const imgH = (srcH * cw) / canvas.width;
        doc.addImage(imgData, "PNG", MARGIN, MARGIN, cw, imgH);
      }
      doc.save("신청서_초안.pdf");
    } finally {
      setIsDownloading(false);
    }
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        {/* Header */}
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

        <section className="px-5 pt-6">
          {/* Intro */}
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
            <div className="mt-4 rounded-2xl border border-[#e5eee9] bg-white px-5 py-4">
              <p className="text-xs font-black text-[#789b8c]">지원사업</p>
              <p className="mt-1 text-base font-black text-[#13261f]">
                {programTitle}
              </p>
              {programDocuments ? (
                <p className="mt-2 text-xs font-bold text-[#789b8c]">
                  필요 서류: {programDocuments}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Form */}
          <h2 className="mt-6 text-base font-black">신청인 정보</h2>
          <div className="mt-3 space-y-4">
            <div>
              <Label>이름</Label>
              <TextInput
                value={form.name}
                onChange={field("name")}
                placeholder="홍길동"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>전화번호</Label>
                <TextInput
                  value={form.phone}
                  onChange={field("phone")}
                  placeholder="010-0000-0000"
                  type="tel"
                />
              </div>
              <div>
                <Label>이메일</Label>
                <TextInput
                  value={form.email}
                  onChange={field("email")}
                  placeholder="me@example.com"
                  type="email"
                />
              </div>
            </div>
            <div>
              <Label>사업장 주소</Label>
              <TextInput
                value={form.address}
                onChange={field("address")}
                placeholder="서울특별시 강남구 ..."
              />
            </div>
            <div>
              <Label>설치 예정 장소</Label>
              <TextInput
                value={form.installLocation}
                onChange={field("installLocation")}
                placeholder="예: 사무실 옥상, 창고 벽면 등"
              />
            </div>
          </div>

          <h2 className="mt-6 text-base font-black">환급 계좌</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label>거래 은행</Label>
              <TextInput
                value={form.bank}
                onChange={field("bank")}
                placeholder="국민은행"
              />
            </div>
            <div>
              <Label>계좌번호</Label>
              <TextInput
                value={form.accountNumber}
                onChange={field("accountNumber")}
                placeholder="000-000-000000"
              />
            </div>
          </div>

          {/* Consents */}
          <h2 className="mt-6 text-base font-black">동의 항목</h2>
          <p className="mt-1 text-xs font-bold text-[#789b8c]">
            모든 항목에 동의해야 서류 초안을 받을 수 있어요.
          </p>
          <div className="mt-3 divide-y divide-[#f0f7f4]">
            {CONSENTS.map((text, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-3 py-3.5"
              >
                <div
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition ${
                    consents[i]
                      ? "border-[#1ba77d] bg-[#1ba77d]"
                      : "border-[#cfe7da] bg-white"
                  }`}
                >
                  {consents[i] ? (
                    <svg
                      aria-hidden="true"
                      className="size-3 text-white"
                      fill="none"
                      viewBox="0 0 12 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  ) : null}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={consents[i]}
                  onChange={(e) => {
                    const next = [...consents];
                    next[i] = e.target.checked;
                    setConsents(next);
                  }}
                />
                <span className="text-sm font-bold text-[#13261f]">{text}</span>
              </label>
            ))}
          </div>

          {/* Signature */}
          <h2 className="mt-6 text-base font-black">전자서명</h2>
          <p className="mt-1 text-xs font-bold text-[#789b8c]">
            아래 영역에 서명 후 &apos;서명 완료&apos;를 눌러주세요.
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
                className="h-12 w-auto object-contain"
              />
              <span className="text-xs font-black text-[#1ba77d]">
                서명이 등록되었습니다.
              </span>
            </div>
          ) : null}

          {/* Download */}
          <div className="mt-8 pb-4">
            {!allConsented ? (
              <p className="mb-3 text-center text-xs font-bold text-[#789b8c]">
                모든 동의 항목을 체크해주세요.
              </p>
            ) : !signatureUrl ? (
              <p className="mb-3 text-center text-xs font-bold text-[#789b8c]">
                전자서명을 완료해주세요.
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canDownload || isDownloading}
              onClick={handleDownload}
              className="w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white disabled:opacity-40"
            >
              {isDownloading ? "PDF 생성 중..." : "신청서 초안 PDF 다운로드"}
            </button>

            <p className="mt-4 text-center text-xs font-bold text-[#aabbb5]">
              공식 제출 전 내용을 반드시 확인하세요.
              <br />
              수정이 필요하면 PDF를 외부 앱에서 편집할 수 있어요.
            </p>
          </div>
        </section>
      </div>

      {/* Hidden printable document — captured by html2canvas for PDF */}
      <PrintDocument
        printRef={printRef}
        programTitle={programTitle}
        programDocuments={programDocuments}
        form={form}
        consents={consents}
        signatureUrl={signatureUrl}
        today={today}
        co2Tons={co2Tons}
      />
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
