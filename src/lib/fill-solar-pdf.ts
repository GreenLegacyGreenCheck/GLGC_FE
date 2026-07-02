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

// ─── Coordinate map (별지 제1호, A4 = 595.28 x 841.89pt, y=0 at BOTTOM) ────
// 이미지 출력 결과 기반 보정:
//   성명~설치기간: 이전값 -38pt  /  보조금~계좌: -34pt  /  날짜~서명: -90pt
const COORDS = {
  name: { x: 175, y: 650, size: 10 },
  birthDate: { x: 393, y: 650, size: 10 },
  address: { x: 170, y: 630, size: 10 },
  landlinePhone: { x: 135, y: 590, size: 9 },
  mobilePhone: { x: 270, y: 590, size: 9 },
  email: { x: 392, y: 590, size: 9 },
  installLocation: { x: 170, y: 570, size: 10 },
  installPeriod: { x: 170, y: 550, size: 10 },
  bankName: { x: 282, y: 474, size: 10 },
  accountHolder: { x: 428, y: 474, size: 10 },
  accountNumber: { x: 190, y: 454, size: 10 },
  dateYear: { x: 258, y: 268, size: 11 },
  applicantName: { x: 395, y: 243, size: 11 },
  signatureImg: { x: 453, y: 232, width: 50, height: 28 },
} as const;

// ─── 기존 샘플 데이터를 흰 사각형으로 덮는 영역 ──────────────────────────────
const CLEAR_BOXES = [
  { x: 149, y: 638, w: 147, h: 20 }, // 성명
  { x: 370, y: 638, w: 170, h: 20 }, // 생년월일
  { x: 149, y: 618, w: 390, h: 20 }, // 주소
  { x: 130, y: 578, w: 112, h: 20 }, // 일반전화
  { x: 247, y: 578, w: 140, h: 20 }, // 휴대전화
  { x: 387, y: 578, w: 153, h: 20 }, // 전자메일
  { x: 144, y: 558, w: 396, h: 20 }, // 설치장소
  { x: 144, y: 538, w: 396, h: 20 }, // 설치기간
  { x: 257, y: 462, w: 117, h: 20 }, // 은행명
  { x: 409, y: 462, w: 130, h: 20 }, // 예금주
  { x: 184, y: 442, w: 355, h: 20 }, // 계좌번호
  { x: 244, y: 256, w: 258, h: 22 }, // 날짜
  { x: 353, y: 231, w: 130, h: 24 }, // 신청인 이름 + (인)
] as const;

async function loadFont(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  // NanumGothic TTF: 전체 한글 커버리지, pdf-lib 호환성 좋음
  for (const path of [
    "/fonts/NanumGothic-Regular.ttf",
    "/fonts/NotoSansKR-Regular.otf",
  ]) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const bytes = await res.arrayBuffer();
      return await pdfDoc.embedFont(bytes);
    } catch {
      continue;
    }
  }
  return pdfDoc.embedFont("Helvetica");
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
