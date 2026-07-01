import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const MARGIN_PT = 28;

// jsPDF의 내장 폰트는 한글을 렌더링하지 못하므로 html2canvas로 래스터화한 뒤
// 이미지로 삽입한다. 전체 캡처를 A4 높이 단위로 잘라 페이지를 나눈다.
export async function downloadReportPdf(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const contentWidthPt = A4_WIDTH_PT - MARGIN_PT * 2;
  const contentHeightPt = A4_HEIGHT_PT - MARGIN_PT * 2;

  // A4 한 페이지의 content 영역이 캡처 이미지에서 차지하는 픽셀 수
  const pageHeightPx = Math.floor(
    (contentHeightPt * canvas.width) / contentWidthPt,
  );
  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();

    const srcY = page * pageHeightPx;
    const srcHeight = Math.min(pageHeightPx, canvas.height - srcY);

    // 해당 페이지 슬라이스만 임시 캔버스로 잘라낸다.
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = srcHeight;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) continue;

    ctx.drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      srcHeight,
      0,
      0,
      canvas.width,
      srcHeight,
    );

    const imgData = pageCanvas.toDataURL("image/png");
    const imgHeightPt = (srcHeight * contentWidthPt) / canvas.width;

    doc.addImage(
      imgData,
      "PNG",
      MARGIN_PT,
      MARGIN_PT,
      contentWidthPt,
      imgHeightPt,
    );
  }

  doc.save("탄소배출_진단_리포트.pdf");
}
