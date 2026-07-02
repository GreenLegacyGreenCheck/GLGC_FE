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
// A4 PDF: width=595.28pt, height=841.89pt  (y=0 at BOTTOM, y increases upward)
// Row height ≈ 20pt. 연락처는 레이블+값 두 줄이므로 총 40pt.
// ─────────────────────────────────────────────────────────────────────────────
const COORDS = {
  name: { x: 175, y: 688, size: 10 },
  birthDate: { x: 393, y: 688, size: 10 },
  address: { x: 170, y: 668, size: 10 },
  // 연락처: 레이블 행(648)과 값 행(628) 두 줄 — 값 행에 맞춤
  landlinePhone: { x: 135, y: 626, size: 9 },
  mobilePhone: { x: 270, y: 626, size: 9 },
  email: { x: 392, y: 626, size: 9 },
  installLocation: { x: 170, y: 606, size: 10 },
  installPeriod: { x: 170, y: 586, size: 10 },
  bankName: { x: 282, y: 508, size: 10 },
  accountHolder: { x: 428, y: 508, size: 10 },
  accountNumber: { x: 190, y: 488, size: 10 },
  dateYear: { x: 258, y: 358, size: 11 },
  applicantName: { x: 395, y: 332, size: 11 },
  signatureImg: { x: 453, y: 321, width: 50, height: 28 },
} as const;

// ─── 기존 샘플 데이터를 흰 사각형으로 덮는 영역 ──────────────────────────────
// 각 항목의 값 셀 영역을 커버. 폼 경계선을 침범하지 않도록 좌우 1~2pt 여유.
const CLEAR_BOXES = [
  { x: 149, y: 677, w: 147, h: 20 }, // 성명
  { x: 370, y: 677, w: 170, h: 20 }, // 생년월일
  { x: 149, y: 657, w: 390, h: 20 }, // 주소
  { x: 130, y: 615, w: 112, h: 20 }, // 일반전화 (값 행)
  { x: 247, y: 615, w: 140, h: 20 }, // 휴대전화 (값 행)
  { x: 387, y: 615, w: 153, h: 20 }, // 전자메일 (값 행)
  { x: 144, y: 595, w: 396, h: 20 }, // 설치장소
  { x: 144, y: 575, w: 396, h: 20 }, // 설치기간
  { x: 257, y: 497, w: 117, h: 20 }, // 은행명
  { x: 409, y: 497, w: 130, h: 20 }, // 예금주
  { x: 184, y: 477, w: 355, h: 20 }, // 계좌번호
  { x: 244, y: 347, w: 258, h: 22 }, // 날짜
  { x: 353, y: 319, w: 130, h: 24 }, // 신청인 이름 + (인)
] as const;

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
  const white = rgb(1, 1, 1);

  // 기존 샘플 데이터 제거
  for (const box of CLEAR_BOXES) {
    page.drawRectangle({
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      color: white,
    });
  }

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
