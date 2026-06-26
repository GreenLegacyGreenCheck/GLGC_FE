"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import { classifyUser } from "@/lib/classification";
import { calculateScope2 } from "@/lib/scope2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function toDigitsAndDot(raw: string) {
  return raw.replace(/[^0-9.]/g, "");
}

function toAmountDisplay(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");

  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, "");

  return digits ? Number(digits) : null;
}

function parseUsage(raw: string): number | null {
  return raw ? Number(raw) : null;
}

type AmountFieldProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  inputMode: "decimal" | "numeric";
};

function BillField({
  label,
  unit,
  value,
  onChange,
  inputMode,
}: AmountFieldProps) {
  return (
    <div className="mt-5">
      <label className="block text-sm font-black">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="h-14 flex-1 rounded-2xl bg-[#f3f8f5] px-5 text-base font-bold outline-none focus:ring-4 focus:ring-[#1ba77d]/10"
          inputMode={inputMode}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="shrink-0 text-sm font-black text-[#789b8c]">
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function EditBillPage() {
  const router = useRouter();
  const { address, electricFile, gasFile, result, setAddress, setResult } =
    useDiagnosis();

  useEffect(() => {
    if (!electricFile || !result) {
      router.replace("/upload");
    }
  }, [electricFile, result, router]);

  const [addressInput, setAddressInput] = useState(address);
  const [electricUsage, setElectricUsage] = useState(
    result?.electricOcr?.usageKwh.value?.toString() ?? "",
  );
  const [electricAmount, setElectricAmount] = useState(
    result?.electricOcr?.billedAmount.value !== null &&
      result?.electricOcr?.billedAmount.value !== undefined
      ? result.electricOcr.billedAmount.value.toLocaleString("ko-KR")
      : "",
  );
  const [gasUsage, setGasUsage] = useState(
    result?.gasOcr?.usageM3.value?.toString() ?? "",
  );
  const [gasAmount, setGasAmount] = useState(
    result?.gasOcr?.billedAmount.value !== null &&
      result?.gasOcr?.billedAmount.value !== undefined
      ? result.gasOcr.billedAmount.value.toLocaleString("ko-KR")
      : "",
  );

  if (!result || !result.electricOcr) {
    return null;
  }

  const existingElectricOcr = result.electricOcr;

  const handleSave = () => {
    const newElectricUsage = parseUsage(electricUsage);
    const newElectricAmount = parseAmount(electricAmount);
    const newGasUsage = gasFile ? parseUsage(gasUsage) : null;
    const newGasAmount = gasFile ? parseAmount(gasAmount) : null;

    const electricOcr = {
      ...existingElectricOcr,
      usageKwh: {
        value: newElectricUsage,
        confidence: newElectricUsage !== null ? 100 : 0,
      },
      billedAmount: {
        value: newElectricAmount,
        confidence: newElectricAmount !== null ? 100 : 0,
      },
    };

    const gasOcr =
      gasFile && result.gasOcr
        ? {
            ...result.gasOcr,
            usageM3: {
              value: newGasUsage,
              confidence: newGasUsage !== null ? 100 : 0,
            },
            billedAmount: {
              value: newGasAmount,
              confidence: newGasAmount !== null ? 100 : 0,
            },
          }
        : result.gasOcr;

    const scope2 = calculateScope2({
      usageKwh: newElectricUsage,
      usageM3: newGasUsage,
    });

    const classification = result.userTypeOverridden
      ? { userType: result.userType, zScore: result.zScore }
      : classifyUser({
          usageKwh: newElectricUsage,
          contractType: existingElectricOcr.contractType.value,
        });

    setAddress(addressInput);
    setResult({
      ...result,
      electricOcr,
      gasOcr,
      totalCo2Kg: scope2.totalCo2Kg,
      userType: classification.userType,
      zScore: classification.zScore,
    });
    router.push("/user-type");
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="flex items-center gap-4 border-b border-[#e5eee9] bg-[#f2faf6] px-5 py-6">
          <Link
            href="/user-type"
            className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
            aria-label="사용자 유형 확인으로 돌아가기"
          >
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-xl font-black">고지서 항목 수정</h1>
        </header>

        <section className="px-5 py-6">
          <div className="flex items-start gap-3 rounded-2xl bg-[#fdf0df] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f8dfb8] text-lg">
              🔍
            </span>
            <div>
              <p className="text-base font-black text-[#9a5b1f]">
                OCR 인식 결과를 확인해 주세요
              </p>
              <p className="mt-1 text-sm font-bold text-[#b08152]">
                자동 추출된 수치가 고지서와 다를 경우 직접 수정해 주세요.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-emerald-950/8">
            <h2 className="text-sm font-bold text-[#789b8c]">전기 고지서</h2>

            <BillField
              label="전력 사용량"
              unit="kWh"
              inputMode="decimal"
              value={electricUsage}
              onChange={(value) => setElectricUsage(toDigitsAndDot(value))}
            />
            <BillField
              label="전기 요금"
              unit="원"
              inputMode="numeric"
              value={electricAmount}
              onChange={(value) => setElectricAmount(toAmountDisplay(value))}
            />
          </div>

          {gasFile ? (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-emerald-950/8">
              <h2 className="text-sm font-bold text-[#789b8c]">가스 고지서</h2>

              <BillField
                label="가스 사용량"
                unit="m³"
                inputMode="decimal"
                value={gasUsage}
                onChange={(value) => setGasUsage(toDigitsAndDot(value))}
              />
              <BillField
                label="가스 요금"
                unit="원"
                inputMode="numeric"
                value={gasAmount}
                onChange={(value) => setGasAmount(toAmountDisplay(value))}
              />
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg shadow-emerald-950/8">
            <h2 className="text-sm font-bold text-[#789b8c]">기본 정보</h2>

            <div className="mt-4">
              <label className="block text-sm font-black">주소</label>
              <input
                className="mt-2 h-14 w-full rounded-2xl bg-[#f3f8f5] px-5 text-base font-bold outline-none focus:ring-4 focus:ring-[#1ba77d]/10"
                aria-label="주소"
                value={addressInput}
                onChange={(event) => setAddressInput(event.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="mt-8 w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white"
            onClick={handleSave}
          >
            저장하고 계속하기 →
          </button>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
