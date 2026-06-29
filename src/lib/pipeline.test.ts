import { describe, expect, it, vi } from "vitest";

const createDiagnosis = vi.fn<
  (
    ...args: unknown[]
  ) => Promise<{ diagnosisId: string; recommendedActions: never[] }>
>(async () => ({
  diagnosisId: "diagnosis-1",
  recommendedActions: [],
}));

vi.mock("./diagnosis-api", () => ({
  createDiagnosis: (...args: unknown[]) => createDiagnosis(...args),
}));

vi.mock("./ocr", () => ({
  recognizeBillImage: vi.fn(async (file: File) => {
    if (file.name === "electric.png") {
      return {
        text: "2024년 3월\n사용량 287 kWh 계약종별 일반용",
        confidence: 92,
        words: [],
      };
    }

    return { text: "가스 사용량 45m³", confidence: 88, words: [] };
  }),
}));

import { runDiagnosisPipeline, type PipelineStepId } from "./pipeline";

describe("runDiagnosisPipeline", () => {
  it("runs OCR, scope2 and classification in order and assembles the result", async () => {
    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });
    const gasFile = new File(["bill"], "gas.png", { type: "image/png" });
    const steps: PipelineStepId[] = [];

    const result = await runDiagnosisPipeline(
      { electricFile, gasFile },
      (step) => steps.push(step),
    );

    expect(steps).toEqual(["ocr", "scope2", "classify", "report"]);
    expect(result.electricOcr?.usageKwh.value).toBe(287);
    expect(result.gasOcr?.usageM3.value).toBe(45);
    expect(result.userType).toBe("소상공인");
    expect(result.userTypeOverridden).toBe(false);
    expect(result.totalCo2Kg).toBeGreaterThan(0);
    expect(result.averageOcrConfidence).toBeCloseTo((92 + 92 + 92 + 88) / 4);
    expect(result.diagnosisId).toBe("diagnosis-1");
    expect(result.recommendedActions).toEqual([]);
    expect(createDiagnosis).toHaveBeenCalledWith(
      expect.objectContaining({
        target: "소상공인",
        targetEmissionKg: result.totalCo2Kg,
      }),
    );
  });

  it("treats a missing gas bill as optional and only averages the electric confidence", async () => {
    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });

    const result = await runDiagnosisPipeline(
      { electricFile, gasFile: null },
      () => undefined,
    );

    expect(result.gasOcr).toBeNull();
    expect(result.averageOcrConfidence).toBe(92);
  });

  it("degrades gracefully when gas bill OCR fails, without aborting the pipeline", async () => {
    const { recognizeBillImage } = await import("./ocr");
    vi.mocked(recognizeBillImage).mockImplementationOnce(async () => ({
      text: "사용량 287 kWh",
      confidence: 92,
      words: [],
    }));
    vi.mocked(recognizeBillImage).mockImplementationOnce(async () => {
      throw new Error("worker error");
    });

    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });
    const gasFile = new File(["bill"], "gas.png", { type: "image/png" });

    const result = await runDiagnosisPipeline(
      { electricFile, gasFile },
      () => undefined,
    );

    expect(result.electricOcr?.usageKwh.value).toBe(287);
    expect(result.gasOcr).toBeNull();
  });

  it("excludes fields that weren't found from the confidence average, instead of counting them as 0", async () => {
    const { recognizeBillImage } = await import("./ocr");
    vi.mocked(recognizeBillImage).mockImplementationOnce(async () => ({
      // No contract type or billing month anywhere in this text — only
      // usage is found, so the average should reflect just that field.
      text: "사용량 287 kWh",
      confidence: 92,
      words: [],
    }));

    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });

    const result = await runDiagnosisPipeline(
      { electricFile, gasFile: null },
      () => undefined,
    );

    expect(result.electricOcr?.contractType.value).toBeNull();
    expect(result.electricOcr?.billingMonth.value).toBeNull();
    expect(result.averageOcrConfidence).toBe(92);
  });

  it("logs the extracted user type, billing year/month and usage values to the console", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });
    const gasFile = new File(["bill"], "gas.png", { type: "image/png" });

    await runDiagnosisPipeline({ electricFile, gasFile }, () => undefined);

    expect(logSpy).toHaveBeenCalledWith(
      "[GreenCheck] 추출된 고지서 정보:",
      expect.objectContaining({
        userType: "소상공인",
        year: "2024",
        month: "03",
        electricityKwh: 287,
        gasM3: 45,
      }),
    );

    logSpy.mockRestore();
  });
});
