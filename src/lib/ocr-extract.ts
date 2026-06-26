import type { OcrExtraction } from "@/context/diagnosis-context";

const CONTRACT_TYPE_KEYWORDS = ["산업용", "일반용", "교육용", "주택용"];

function parseMatchedNumber(raw: string): number | null {
  const normalized = raw.replace(/,/g, "");
  const value = Number.parseFloat(normalized);

  return Number.isFinite(value) ? value : null;
}

export function extractUsageKwh(text: string): number | null {
  const labeled = text.match(/사용량[^\d]{0,20}([\d,]+(?:\.\d+)?)\s*k\s*wh/i);

  if (labeled) {
    return parseMatchedNumber(labeled[1]);
  }

  const bare = text.match(/([\d,]+(?:\.\d+)?)\s*k\s*wh/i);

  return bare ? parseMatchedNumber(bare[1]) : null;
}

export function extractUsageM3(text: string): number | null {
  const labeled = text.match(
    /사용량[^\d]{0,20}([\d,]+(?:\.\d+)?)\s*(?:m\s*3|m\s*³|㎥)/i,
  );

  if (labeled) {
    return parseMatchedNumber(labeled[1]);
  }

  const bare = text.match(/([\d,]+(?:\.\d+)?)\s*(?:m\s*3|m\s*³|㎥)/i);

  return bare ? parseMatchedNumber(bare[1]) : null;
}

export function extractContractType(text: string): string | null {
  return (
    CONTRACT_TYPE_KEYWORDS.find((keyword) => text.includes(keyword)) ?? null
  );
}

export function extractSupplyAddress(text: string): string | null {
  const match = text.match(
    /(?:공급받는\s*주소|사용\s*장소|공급\s*주소|주소)\s*[:\s]\s*([^\n]{5,40})/,
  );

  return match ? match[1].trim() : null;
}

export function extractBilledAmount(text: string): number | null {
  const labeled = text.match(/(?:청구\s*금액|요금)[^\d]{0,20}([\d,]+)\s*원/);

  if (labeled) {
    return parseMatchedNumber(labeled[1]);
  }

  const bare = text.match(/([\d,]+)\s*원/);

  return bare ? parseMatchedNumber(bare[1]) : null;
}

export function extractBillFields(
  rawText: string,
  confidence: number,
): OcrExtraction {
  const usageKwh = extractUsageKwh(rawText);
  const usageM3 = extractUsageM3(rawText);
  const contractType = extractContractType(rawText);
  const supplyAddress = extractSupplyAddress(rawText);
  const billedAmount = extractBilledAmount(rawText);

  return {
    rawText,
    confidence,
    usageKwh: {
      value: usageKwh,
      confidence: usageKwh !== null ? confidence : 0,
    },
    usageM3: { value: usageM3, confidence: usageM3 !== null ? confidence : 0 },
    contractType: {
      value: contractType,
      confidence: contractType !== null ? confidence : 0,
    },
    supplyAddress: {
      value: supplyAddress,
      confidence: supplyAddress !== null ? confidence : 0,
    },
    billedAmount: {
      value: billedAmount,
      confidence: billedAmount !== null ? confidence : 0,
    },
  };
}
