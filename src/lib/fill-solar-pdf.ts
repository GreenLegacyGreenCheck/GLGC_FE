import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type SolarApplicationData = {
  name: string;
  birthDate: string;
  address: string;
  detailAddress: string;
  complexName: string; // 공동주택명 (동의서용)
  unitNumber: string; // 동/호수 (동의서용)
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

// ─── Page 0 (별지 제1호: 보조금 신청서) ──────────────────────────────────────
// A4 = 595.28 x 841.89pt, y=0 at BOTTOM
const P0_COORDS = {
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
} as const;

const P0_CLEAR = [
  { x: 149, y: 638, w: 147, h: 20 },
  { x: 370, y: 638, w: 170, h: 20 },
  { x: 149, y: 618, w: 390, h: 20 },
  { x: 130, y: 578, w: 112, h: 20 },
  { x: 247, y: 578, w: 140, h: 20 },
  { x: 387, y: 578, w: 153, h: 20 },
  { x: 144, y: 558, w: 396, h: 20 },
  { x: 144, y: 538, w: 396, h: 20 },
  { x: 257, y: 462, w: 117, h: 20 },
  { x: 409, y: 462, w: 130, h: 20 },
  { x: 184, y: 442, w: 355, h: 20 },
  { x: 244, y: 256, w: 258, h: 22 },
  { x: 353, y: 231, w: 130, h: 24 },
] as const;

// ─── 신청인 (인) 위치 — 페이지별 ────────────────────────────────────────────
// 각 페이지의 하단 서명란에서 '신청인 (인)' 위치.
// 보급업체 (인)는 신청인이 서명하지 않으므로 제외.
// NOTE: 페이지 1~4 좌표는 첫 테스트 후 조정 필요.
const SIG_POSITIONS = [
  { page: 0, x: 453, y: 232, w: 52, h: 28 }, // 별지1호 신청인(인)
  { page: 1, x: 453, y: 200, w: 52, h: 28 }, // 별지1-1호 신청인(인)
  { page: 2, x: 300, y: 238, w: 52, h: 28 }, // 별지1-2호 동의서 신청인(인)
  { page: 3, x: 362, y: 288, w: 52, h: 28 }, // 별지1-3호 소유자(서명 또는 인)
  { page: 4, x: 453, y: 160, w: 52, h: 28 }, // 설치확인서 신청인(인)
] as const;

// 각 페이지에서 기존 이름/날짜 샘플 데이터를 지우고 재입력할 영역
// [page, x, y, w, h]
const EXTRA_PAGE_CLEARS = [
  // 별지1-1호 (page 1): 신청인명·(인) 영역
  [1, 350, 188, 130, 24],
  // 별지1-2호 (page 2): 신청인명 영역
  [2, 140, 250, 160, 22],
  // 별지1-3호 (page 3): 소유자 이름
  [3, 265, 278, 140, 22],
  // 설치확인서 (page 4): 신청인명
  [4, 350, 148, 130, 24],
] as const;

// 각 페이지에 덮어쓸 이름·날짜 위치
const EXTRA_PAGE_TEXT = [
  { page: 1, nameX: 395, nameY: 213, dateX: 258, dateY: 235 },
  { page: 2, nameX: 145, nameY: 263, dateX: 258, dateY: 218 },
  { page: 3, nameX: 270, nameY: 292, dateX: 258, dateY: 328 },
  { page: 4, nameX: 395, nameY: 173, dateX: 258, dateY: 195 },
] as const;

async function loadFont(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  for (const path of [
    "/fonts/NanumGothic-Regular.ttf",
    "/fonts/NotoSansKR-Regular.otf",
  ]) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      return await pdfDoc.embedFont(await res.arrayBuffer());
    } catch {
      continue;
    }
  }
  return pdfDoc.embedFont("Helvetica");
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}년  ${String(t.getMonth() + 1).padStart(2, "0")}월  ${String(t.getDate()).padStart(2, "0")}일`;
}

export async function fillSolarApplicationPdf(
  data: SolarApplicationData,
): Promise<Uint8Array> {
  const res = await fetch("/forms/solar-application.pdf");
  if (!res.ok) throw new Error("서류 템플릿을 불러올 수 없습니다.");

  const pdfDoc = await PDFDocument.load(await res.arrayBuffer());
  const font = await loadFont(pdfDoc);
  const pages = pdfDoc.getPages();
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  function wipe(
    page: ReturnType<typeof pdfDoc.getPages>[0],
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    page.drawRectangle({ x, y, width: w, height: h, color: white });
  }

  function text(
    page: ReturnType<typeof pdfDoc.getPages>[0],
    str: string,
    x: number,
    y: number,
    size = 10,
  ) {
    if (!str.trim()) return;
    page.drawText(str, { x, y, size, font, color: black });
  }

  // ── Page 0: 메인 신청서 ──────────────────────────────────────────────────
  const p0 = pages[0];
  for (const b of P0_CLEAR) wipe(p0, b.x, b.y, b.w, b.h);

  const fullAddress = [data.address, data.detailAddress]
    .filter(Boolean)
    .join(" ");
  text(p0, data.name, P0_COORDS.name.x, P0_COORDS.name.y, P0_COORDS.name.size);
  text(p0, data.birthDate, P0_COORDS.birthDate.x, P0_COORDS.birthDate.y);
  text(p0, fullAddress, P0_COORDS.address.x, P0_COORDS.address.y);
  text(
    p0,
    data.landlinePhone,
    P0_COORDS.landlinePhone.x,
    P0_COORDS.landlinePhone.y,
    P0_COORDS.landlinePhone.size,
  );
  text(
    p0,
    data.mobilePhone,
    P0_COORDS.mobilePhone.x,
    P0_COORDS.mobilePhone.y,
    P0_COORDS.mobilePhone.size,
  );
  text(
    p0,
    data.email,
    P0_COORDS.email.x,
    P0_COORDS.email.y,
    P0_COORDS.email.size,
  );
  text(
    p0,
    data.installLocation,
    P0_COORDS.installLocation.x,
    P0_COORDS.installLocation.y,
  );
  if (data.installStartDate || data.installEndDate) {
    text(
      p0,
      `${data.installStartDate} ~ ${data.installEndDate}`,
      P0_COORDS.installPeriod.x,
      P0_COORDS.installPeriod.y,
    );
  }
  text(p0, data.bank, P0_COORDS.bankName.x, P0_COORDS.bankName.y);
  text(p0, data.name, P0_COORDS.accountHolder.x, P0_COORDS.accountHolder.y);
  text(
    p0,
    data.accountNumber,
    P0_COORDS.accountNumber.x,
    P0_COORDS.accountNumber.y,
  );
  text(p0, todayStr(), P0_COORDS.dateYear.x, P0_COORDS.dateYear.y, 11);
  text(p0, data.name, P0_COORDS.applicantName.x, P0_COORDS.applicantName.y, 11);

  // ── Pages 1-4: 이름 / 날짜 덮어쓰기 ────────────────────────────────────
  for (const c of EXTRA_PAGE_CLEARS) {
    const pg = pages[c[0]];
    if (pg) wipe(pg, c[1], c[2], c[3], c[4]);
  }
  for (const t of EXTRA_PAGE_TEXT) {
    const pg = pages[t.page];
    if (!pg) continue;
    text(pg, data.name, t.nameX, t.nameY, 11);
    text(pg, todayStr(), t.dateX, t.dateY, 11);
  }

  // ── 서명 이미지 — 모든 (인) 위치 ──────────────────────────────────────
  if (data.signatureDataUrl) {
    const base64 = data.signatureDataUrl.split(",")[1];
    if (base64) {
      const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const sigImg = await pdfDoc.embedPng(sigBytes);
      for (const pos of SIG_POSITIONS) {
        const pg = pages[pos.page];
        if (pg)
          pg.drawImage(sigImg, {
            x: pos.x,
            y: pos.y,
            width: pos.w,
            height: pos.h,
          });
      }
    }
  }

  return pdfDoc.save();
}
