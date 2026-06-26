import { describe, expect, it, vi } from "vitest";

const { html2canvasMock, addImage, save, jsPDFConstructor } = vi.hoisted(
  () => ({
    html2canvasMock: vi.fn().mockResolvedValue({
      width: 800,
      height: 1600,
      toDataURL: () => "data:image/png;base64,fake",
    }),
    addImage: vi.fn(),
    save: vi.fn(),
    jsPDFConstructor: vi.fn(),
  }),
);

vi.mock("html2canvas", () => ({ default: html2canvasMock }));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(function MockJsPdf(...args: unknown[]) {
    jsPDFConstructor(...args);
    return { addImage, save };
  }),
}));

import { downloadReportPdf } from "./report-pdf";

describe("downloadReportPdf", () => {
  it("sizes the PDF page to fit the entire rasterized capture", async () => {
    const element = document.createElement("div");

    await downloadReportPdf(element);

    expect(html2canvasMock).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ scale: 2 }),
    );

    const [options] = jsPDFConstructor.mock.calls[0];
    const [pageWidth, pageHeight] = options.format;

    expect(pageWidth).toBeCloseTo(595.28);
    // canvas is twice as tall as it is wide, so the page should be too.
    expect(pageHeight).toBeGreaterThan(pageWidth * 1.8);

    expect(addImage).toHaveBeenCalledWith(
      "data:image/png;base64,fake",
      "PNG",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    expect(save).toHaveBeenCalledWith("탄소배출_진단_리포트.pdf");
  });
});
