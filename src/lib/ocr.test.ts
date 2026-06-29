import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
});

describe("recognizeBillImage", () => {
  it("posts the image to the OCR endpoint and returns the parsed result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        text: "hello",
        confidence: 80,
        words: [
          { text: "hello", confidence: 95 },
          { text: "world", confidence: 70 },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { recognizeBillImage } = await import("./ocr");
    const file = new File(["bill"], "bill.png", { type: "image/png" });
    const result = await recognizeBillImage(file);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/ocr/bill",
      expect.objectContaining({ method: "POST" }),
    );
    const requestBody = fetchMock.mock.calls[0][1].body as FormData;
    const uploadedImage = requestBody.get("image") as File;
    expect(uploadedImage).toBeInstanceOf(File);
    expect(uploadedImage.name).toBe(file.name);
    expect(result).toEqual({
      text: "hello",
      confidence: 80,
      words: [
        { text: "hello", confidence: 95 },
        { text: "world", confidence: 70 },
      ],
    });
  });

  it("throws when the OCR server responds with a non-ok status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const { recognizeBillImage } = await import("./ocr");
    const file = new File(["bill"], "bill.png", { type: "image/png" });

    await expect(recognizeBillImage(file)).rejects.toThrow("500");
  });

  it("throws when the OCR server response is shaped incorrectly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unexpected: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { recognizeBillImage } = await import("./ocr");
    const file = new File(["bill"], "bill.png", { type: "image/png" });

    await expect(recognizeBillImage(file)).rejects.toThrow(
      "OCR 서버 응답 형식이 올바르지 않습니다.",
    );
  });

  it("rescales a 0-1 confidence response up to the 0-100 scale the rest of the app expects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        text: "hello",
        confidence: 0.85,
        words: [
          { text: "hello", confidence: 0.95 },
          { text: "world", confidence: 0.7 },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { recognizeBillImage } = await import("./ocr");
    const file = new File(["bill"], "bill.png", { type: "image/png" });
    const result = await recognizeBillImage(file);

    expect(result).toEqual({
      text: "hello",
      confidence: 85,
      words: [
        { text: "hello", confidence: 95 },
        { text: "world", confidence: 70 },
      ],
    });
  });

  it("throws a clear error when NEXT_PUBLIC_API_BASE_URL is not configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    vi.stubGlobal("fetch", vi.fn());

    const { recognizeBillImage } = await import("./ocr");
    const file = new File(["bill"], "bill.png", { type: "image/png" });

    await expect(recognizeBillImage(file)).rejects.toThrow(
      "NEXT_PUBLIC_API_BASE_URL",
    );
  });
});
