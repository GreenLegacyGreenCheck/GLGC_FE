import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type SolarApplicationData = {
  name: string;
  birthDate: string;
  address: string;
  landlinePhone: string;
  mobilePhone: string;
  email: string;
  installLocation: string;
  installStartDate: string;
  installEndDate: string;
  bank: string;
  accountNumber: string;
  signatureDataUrl: string | null;
};

// ─── Coordinate map for 별지 제1호 서식 ─────────────────────────────────────
// A4 PDF: width=595.28pt, height=841.89pt
// pdf-lib uses bottom-left origin, so y = pageHeight - distanceFromTop
//
// To calibrate: adjust values until text lands inside the correct cell.
// Use browser DevTools with the PDF open: (pixel from top) * (72 / 96) ≈ pt from top
// then y = 841.89 - ptFromTop
// ─────────────────────────────────────────────────────────────────────────────
const COORDS = {
  name: { x: 175, y: 688, size: 10 },
  birthDate: { x: 388, y: 688, size: 10 },
  address: { x: 170, y: 668, size: 10 },
  landlinePhone: { x: 135, y: 643, size: 9 },
  mobilePhone: { x: 285, y: 643, size: 9 },
  email: { x: 398, y: 643, size: 9 },
  installLocation: { x: 170, y: 621, size: 10 },
  installPeriod: { x: 170, y: 601, size: 10 },
  bankName: { x: 282, y: 522, size: 10 },
  accountHolder: { x: 428, y: 522, size: 10 },
  accountNumber: { x: 170, y: 502, size: 10 },
  dateYear: { x: 258, y: 358, size: 11 },
  applicantName: { x: 395, y: 332, size: 11 },
  // (인) stamp position: image placed just to the right of 신청인 이름
  signatureImg: { x: 455, y: 323, width: 48, height: 26 },
} as const;

async function loadFont(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  try {
    const res = await fetch("/fonts/NotoSansKR-Regular.otf");
    if (!res.ok) throw new Error("font fetch failed");
    const bytes = await res.arrayBuffer();
    return pdfDoc.embedFont(bytes);
  } catch {
    // Korean characters won't render but form structure is preserved
    return pdfDoc.embedFont("Helvetica");
  }
}

export async function fillSolarApplicationPdf(
  data: SolarApplicationData,
): Promise<Uint8Array> {
  const res = await fetch("/forms/solar-application.pdf");
  if (!res.ok) throw new Error("서류 템플릿을 불러올 수 없습니다.");
  const templateBytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await loadFont(pdfDoc);

  const page = pdfDoc.getPages()[0];
  const black = rgb(0, 0, 0);

  function draw(text: string, x: number, y: number, size = 10) {
    if (!text.trim()) return;
    page.drawText(text, { x, y, size, font, color: black });
  }

  draw(data.name, COORDS.name.x, COORDS.name.y, COORDS.name.size);
  draw(data.birthDate, COORDS.birthDate.x, COORDS.birthDate.y);
  draw(data.address, COORDS.address.x, COORDS.address.y);
  draw(
    data.landlinePhone,
    COORDS.landlinePhone.x,
    COORDS.landlinePhone.y,
    COORDS.landlinePhone.size,
  );
  draw(
    data.mobilePhone,
    COORDS.mobilePhone.x,
    COORDS.mobilePhone.y,
    COORDS.mobilePhone.size,
  );
  draw(data.email, COORDS.email.x, COORDS.email.y, COORDS.email.size);
  draw(
    data.installLocation,
    COORDS.installLocation.x,
    COORDS.installLocation.y,
  );
  if (data.installStartDate || data.installEndDate) {
    draw(
      `${data.installStartDate} ~ ${data.installEndDate}`,
      COORDS.installPeriod.x,
      COORDS.installPeriod.y,
    );
  }
  draw(data.bank, COORDS.bankName.x, COORDS.bankName.y);
  draw(data.name, COORDS.accountHolder.x, COORDS.accountHolder.y);
  draw(data.accountNumber, COORDS.accountNumber.x, COORDS.accountNumber.y);

  const today = new Date();
  draw(
    `${today.getFullYear()}년  ${String(today.getMonth() + 1).padStart(2, "0")}월  ${String(today.getDate()).padStart(2, "0")}일`,
    COORDS.dateYear.x,
    COORDS.dateYear.y,
    COORDS.dateYear.size,
  );
  draw(
    data.name,
    COORDS.applicantName.x,
    COORDS.applicantName.y,
    COORDS.applicantName.size,
  );

  // Place signature image at (인) position
  if (data.signatureDataUrl) {
    const base64 = data.signatureDataUrl.split(",")[1];
    if (base64) {
      const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const sigImg = await pdfDoc.embedPng(sigBytes);
      const { x, y, width, height } = COORDS.signatureImg;
      page.drawImage(sigImg, { x, y, width, height });
    }
  }

  return pdfDoc.save();
}
