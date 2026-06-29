export type RawOcrWord = {
  text: string;
  confidence: number;
};

export type RawOcrResult = {
  text: string;
  confidence: number;
  words: RawOcrWord[];
};

const OCR_ENDPOINT_PATH = "/ocr/bill";

// The rest of the app (ocr-extract.ts's confidence averaging, the
// "OCR 추출 정확도" UI) assumes Tesseract.js's 0–100 confidence scale. Some
// OCR backends (PaddleOCR included) report a 0–1 probability instead — a
// real OCR result essentially never scores below 1 on a genuine 0–100
// scale, so treating any confidence <= 1 as a 0–1 fraction and rescaling is
// a safe normalization rather than a guess.
function normalizeConfidenceScale(result: RawOcrResult): RawOcrResult {
  if (result.confidence > 1) {
    return result;
  }

  return {
    ...result,
    confidence: result.confidence * 100,
    words: result.words.map((word) => ({
      ...word,
      confidence: word.confidence > 1 ? word.confidence : word.confidence * 100,
    })),
  };
}

function isRawOcrResult(value: unknown): value is RawOcrResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.text === "string" &&
    typeof candidate.confidence === "number" &&
    Array.isArray(candidate.words)
  );
}

export async function recognizeBillImage(file: File): Promise<RawOcrResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.local을 확인해주세요.",
    );
  }

  const formData = new FormData();
  formData.set("image", file, file.name);

  const response = await fetch(`${baseUrl}${OCR_ENDPOINT_PATH}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR 요청이 실패했습니다. (status: ${response.status})`);
  }

  const data: unknown = await response.json();

  if (!isRawOcrResult(data)) {
    throw new Error("OCR 서버 응답 형식이 올바르지 않습니다.");
  }

  return normalizeConfidenceScale(data);
}
