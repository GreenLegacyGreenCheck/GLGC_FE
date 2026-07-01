import { describe, expect, it, vi } from "vitest";

const { html2canvasMock, addImage, addPage, save, jsPDFConstructor } =
  vi.hoisted(() => ({
    html2canvasMock: vi.fn().mockResolvedValue({
      width: 800,
      height: 1600,
      toDataURL: () => "data:image/png;base64,fake",
    }),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    jsPDFConstructor: vi.fn(),
  }));

vi.mock("html2canvas", () => ({ default: html2canvasMock }));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(function MockJsPdf(...args: unknown[]) {
    jsPDFConstructor(...args);
    return { addImage, addPage, save };
  }),
}));

import { downloadReportPdf } from "./report-pdf";

describe("downloadReportPdf", () => {
  it("splits the capture into A4 pages and saves the PDF", async () => {
    const element = document.createElement("div");

    const mockCtx = { drawImage: vi.fn() };
    const mockPageCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,page"),
    };

    // Intercept canvas creation inside downloadReportPdf only.
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return mockPageCanvas as unknown as HTMLElement;
      return realCreateElement(tag);
    });

    await downloadReportPdf(element);

    vi.restoreAllMocks();

    expect(html2canvasMock).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ scale: 2 }),
    );

    const [options] = jsPDFConstructor.mock.calls[0];
    expect(options.format).toBe("a4");

    // Canvas is 800×1600: page height in px ≈ floor(793.89 * 800 / 539.28) ≈ 1176
    // → 2 pages total, addPage called once (for page 2).
    expect(addPage).toHaveBeenCalledTimes(1);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledWith("탄소배출_진단_리포트.pdf");
  });
});
