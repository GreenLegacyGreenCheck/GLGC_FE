import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_PT = 595.28;
const MARGIN_PT = 24;

// jsPDF's built-in fonts can't render Hangul, so the report (mostly
// Korean text) is rasterized with html2canvas and embedded as an image.
// The page height is sized to fit the whole capture on a single page,
// since the report's length isn't fixed (it'll vary once real content
// replaces the dummy data) and jsPDF doesn't auto-paginate addImage.
export async function downloadReportPdf(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");

  const contentWidth = A4_WIDTH_PT - MARGIN_PT * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;
  const pageHeight = contentHeight + MARGIN_PT * 2;

  const doc = new jsPDF({
    unit: "pt",
    format: [A4_WIDTH_PT, pageHeight],
  });

  doc.addImage(
    imageData,
    "PNG",
    MARGIN_PT,
    MARGIN_PT,
    contentWidth,
    contentHeight,
  );
  doc.save("탄소배출_진단_리포트.pdf");
}
