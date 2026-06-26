import { describe, expect, it } from "vitest";
import {
  extractBillFields,
  extractBilledAmount,
  extractContractType,
  extractSupplyAddress,
  extractUsageKwh,
  extractUsageM3,
} from "./ocr-extract";

describe("extractUsageKwh", () => {
  it("extracts a labeled usage value", () => {
    expect(extractUsageKwh("사용량 287 kWh\n계약종별 주택용")).toBe(287);
  });

  it("falls back to the first bare kWh value", () => {
    expect(extractUsageKwh("총 사용 전력: 1,204kWh 입니다")).toBe(1204);
  });

  it("returns null when nothing matches", () => {
    expect(extractUsageKwh("고지서 내용을 인식할 수 없습니다")).toBeNull();
  });
});

describe("extractUsageM3", () => {
  it("extracts a labeled usage value with a unicode cubic meter sign", () => {
    expect(extractUsageM3("가스 사용량 45m³")).toBe(45);
  });

  it("extracts a bare m3 value", () => {
    expect(extractUsageM3("사용한 가스량 12.5 m3")).toBe(12.5);
  });

  it("returns null when nothing matches", () => {
    expect(extractUsageM3("내용 없음")).toBeNull();
  });
});

describe("extractContractType", () => {
  it("finds a known contract type keyword anywhere in the text", () => {
    expect(extractContractType("계약종별: 일반용 전력")).toBe("일반용");
  });

  it("returns null when no keyword is present", () => {
    expect(extractContractType("계약종별: 알수없음")).toBeNull();
  });
});

describe("extractSupplyAddress", () => {
  it("extracts text following an address label", () => {
    expect(extractSupplyAddress("공급주소: 서울시 마포구 연남동 123-4")).toBe(
      "서울시 마포구 연남동 123-4",
    );
  });

  it("returns null when no address label is present", () => {
    expect(extractSupplyAddress("아무 내용")).toBeNull();
  });
});

describe("extractBilledAmount", () => {
  it("extracts a labeled billed amount", () => {
    expect(extractBilledAmount("청구금액 42,350원")).toBe(42350);
  });

  it("falls back to a bare 원 amount", () => {
    expect(extractBilledAmount("이번 달 요금은 28,700원입니다")).toBe(28700);
  });

  it("returns null when nothing matches", () => {
    expect(extractBilledAmount("내용 없음")).toBeNull();
  });
});

describe("extractBillFields", () => {
  it("composes all fields and assigns the page confidence to matched fields", () => {
    const result = extractBillFields(
      "사용량 287 kWh 계약종별 일반용\n공급주소: 서울시 마포구 연남동 123-4\n청구금액 42,350원",
      94.2,
    );

    expect(result.usageKwh).toEqual({ value: 287, confidence: 94.2 });
    expect(result.contractType).toEqual({ value: "일반용", confidence: 94.2 });
    expect(result.supplyAddress).toEqual({
      value: "서울시 마포구 연남동 123-4",
      confidence: 94.2,
    });
    expect(result.billedAmount).toEqual({ value: 42350, confidence: 94.2 });
    expect(result.usageM3).toEqual({ value: null, confidence: 0 });
  });
});
