import { describe, expect, it, vi } from "vitest";

vi.mock("./ocr", () => ({
  recognizeBillImage: vi.fn(async (file: File) => {
    if (file.name === "electric.png") {
      return { text: "사용량 287 kWh 계약종별 일반용", confidence: 92 };
    }

    return { text: "가스 사용량 45m³", confidence: 88 };
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
    expect(result.averageOcrConfidence).toBeCloseTo((92 + 88) / 2);
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
});
