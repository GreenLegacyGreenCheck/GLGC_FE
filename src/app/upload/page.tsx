"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DaumPostcodeData = {
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: () => void;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

function XIcon({ className = "size-10 mr-1" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6l12 12M18 6 6 18"
      />
    </svg>
  );
}

function UploadIcon({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 8 4-4 4 4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
      />
    </svg>
  );
}

type BillUploadBoxProps = {
  title: string;
  badge: string;
  badgeClassName: string;
  cta: string;
  compact?: boolean;
  onFileSelected: (file: File | null) => void;
};

type UploadPreview = {
  fileName: string;
  url: string;
};

const supportedExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

function isSupportedFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  return extension ? supportedExtensions.has(extension) : false;
}

function BillUploadBox({
  title,
  badge,
  badgeClassName,
  cta,
  compact = false,
  onFileSelected,
}: BillUploadBoxProps) {
  const headingId = `${title.replace(/\s/g, "-")}-upload`;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const cameraPortalRoot =
    typeof document === "undefined"
      ? null
      : document.querySelector("[data-phone-frame]");

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.target.value = "";

    if (!isSupportedFile(file)) {
      window.alert("지원하지 않는 파일 형식입니다.");
      return;
    }

    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview({
      fileName: file.name,
      url: URL.createObjectURL(file),
    });
    onFileSelected(file);
    setIsOptionOpen(false);
  };

  const openCamera = async () => {
    setIsOptionOpen(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      cameraInputRef.current?.click();
    }
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const captureCameraImage = () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      window.alert(
        "카메라 화면을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    const targetAspectRatio = 3 / 4.65;
    const sourceAspectRatio = video.videoWidth / video.videoHeight;
    const sourceWidth =
      sourceAspectRatio > targetAspectRatio
        ? video.videoHeight * targetAspectRatio
        : video.videoWidth;
    const sourceHeight =
      sourceAspectRatio > targetAspectRatio
        ? video.videoHeight
        : video.videoWidth / targetAspectRatio;
    const sourceX = (video.videoWidth - sourceWidth) / 2;
    const sourceY = (video.videoHeight - sourceHeight) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = Math.round(canvas.width / targetAspectRatio);
    const context = canvas.getContext("2d");

    if (!context) {
      window.alert("사진을 캡처할 수 없습니다.");
      return;
    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    canvas.toBlob((blob) => {
      if (!blob) {
        window.alert("사진을 캡처할 수 없습니다.");
        return;
      }

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      const fileName = `${title} 촬영 이미지.jpg`;

      setPreview({
        fileName,
        url: URL.createObjectURL(blob),
      });
      onFileSelected(new File([blob], fileName, { type: "image/jpeg" }));
      closeCamera();
    }, "image/jpeg");
  };

  return (
    <section className={compact ? "mt-6" : "mt-8"} aria-labelledby={headingId}>
      <div className="mb-3 flex items-center gap-2">
        <h3 id={headingId} className="text-xl font-black">
          {title}
        </h3>
        <span className={badgeClassName}>{badge}</span>
      </div>

      <div className="relative">
        <button
          type="button"
          className={`relative flex w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[#c8eee4] bg-white text-center ${
            compact
              ? "min-h-[104px] items-center gap-4 px-6 text-left"
              : "min-h-[180px] flex-col items-center justify-center px-4"
          }`}
          onClick={() => setIsOptionOpen((current) => !current)}
        >
          {preview ? (
            <>
              <span className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={`${title} 미리보기`}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="absolute inset-0 bg-emerald-950/28" />
              <span className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-left text-sm font-black text-[#0d5f4b] backdrop-blur">
                {preview.fileName}
              </span>
            </>
          ) : (
            <span
              className={`grid place-items-center rounded-2xl bg-[#eef8f3] text-[#79a596] ${
                compact ? "size-14 shrink-0" : "size-16"
              }`}
            >
              <UploadIcon className={compact ? "size-7" : "size-8"} />
            </span>
          )}

          {!preview ? (
            <span className={compact ? "min-w-0" : "mt-5"}>
              <span
                className={`block font-black ${
                  compact ? "text-lg text-[#78a091]" : "text-lg"
                }`}
              >
                {cta}
              </span>
              {!compact ? (
                <span className="mt-2 block text-sm font-bold text-[#78a091]">
                  아이콘을 눌러 업로드 방식을 선택해요
                </span>
              ) : null}
            </span>
          ) : null}
        </button>

        {isOptionOpen && cameraPortalRoot
          ? createPortal(
              <div
                className="absolute inset-0 z-40 grid place-items-center bg-emerald-950/18 px-5"
                role="presentation"
                onClick={() => setIsOptionOpen(false)}
              >
                <div
                  className="relative grid w-[210px] gap-2 rounded-2xl border border-[#d6eee7] bg-white p-3 shadow-xl shadow-emerald-950/15"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="rounded-xl bg-[#dff4ec] px-4 py-3 text-sm font-black text-[#0d5f4b]"
                    onClick={openCamera}
                  >
                    카메라로 촬영
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#dff4ec] px-4 py-3 text-sm font-black text-[#0d5f4b]"
                    onClick={() => {
                      setIsOptionOpen(false);
                      galleryInputRef.current?.click();
                    }}
                  >
                    갤러리에서 선택
                  </button>
                  {preview ? (
                    <button
                      type="button"
                      className="rounded-xl bg-[#1ba77d] px-4 py-3 text-sm font-black text-white"
                      onClick={() => {
                        setIsOptionOpen(false);
                        setIsPreviewOpen(true);
                      }}
                    >
                      사진 미리보기
                    </button>
                  ) : null}
                </div>
              </div>,
              cameraPortalRoot,
            )
          : null}

        {isCameraOpen && cameraPortalRoot
          ? createPortal(
              <div className="absolute inset-0 z-50 overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full bg-black object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-0 bg-black/20" />
                <div className="pointer-events-none absolute left-1/2 top-[6%] z-10 flex -translate-x-1/2 flex-col items-center gap-1">
                  <div className="whitespace-nowrap rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#0d5f4b]">
                    고지서를 세로로 맞춰 주세요
                  </div>
                  <div className="whitespace-nowrap text-center text-xs font-bold leading-5 text-white/90">
                    화면 안에 고지서 전체가 들어오게 촬영해요
                  </div>
                </div>
                <div className="pointer-events-none absolute left-1/2 top-[44%] h-[80%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[1.65rem] border-[3px] border-white/95 shadow-[0_0_0_999px_rgba(0,0,0,0.34)]">
                  <span className="absolute left-4 top-4 size-6 rounded-tl-xl border-l-4 border-t-4 border-[#55d7b2]" />
                  <span className="absolute right-4 top-4 size-6 rounded-tr-xl border-r-4 border-t-4 border-[#55d7b2]" />
                  <span className="absolute bottom-4 left-4 size-6 rounded-bl-xl border-b-4 border-l-4 border-[#55d7b2]" />
                  <span className="absolute bottom-4 right-4 size-6 rounded-br-xl border-b-4 border-r-4 border-[#55d7b2]" />
                </div>
                <div className="absolute inset-x-5 bottom-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div />
                  <button
                    type="button"
                    className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/20"
                    onClick={captureCameraImage}
                    aria-label="사진 사용"
                  >
                    <span className="size-14 rounded-full bg-white" />
                  </button>
                  <button
                    type="button"
                    className="grid size-12 place-items-center justify-self-end text-white"
                    onClick={closeCamera}
                    aria-label="카메라 닫기"
                  >
                    <XIcon />
                  </button>
                </div>
              </div>,
              cameraPortalRoot,
            )
          : null}

        {isCameraOpen && !cameraPortalRoot ? (
          <div className="absolute inset-0 z-30 grid place-items-center rounded-2xl bg-emerald-950/70 p-6">
            <div className="w-full overflow-hidden rounded-2xl bg-white p-3">
              <video
                ref={videoRef}
                className="h-48 w-full rounded-xl bg-black object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-[#1ba77d] px-4 py-3 text-sm font-black text-white"
                  onClick={captureCameraImage}
                >
                  사진 사용
                </button>
                <button
                  type="button"
                  className="grid size-20 place-items-center justify-self-end text-[#5f8676]"
                  onClick={closeCamera}
                  aria-label="카메라 닫기"
                >
                  <XIcon className="size-6" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isPreviewOpen && preview && cameraPortalRoot
          ? createPortal(
              <div
                className="absolute inset-0 z-50 grid place-items-center bg-black/82 p-5"
                role="presentation"
                onClick={() => setIsPreviewOpen(false)}
              >
                <div className="relative w-full overflow-hidden">
                  <button
                    type="button"
                    className="absolute right-5 top-5 z-10 grid size-10 place-items-center text-white drop-shadow"
                    aria-label="사진 미리보기 닫기"
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    <XIcon />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={`${title} 전체 미리보기`}
                    className="max-h-[690px] w-full object-contain"
                  />
                </div>
              </div>,
              cameraPortalRoot,
            )
          : null}

        <input
          ref={cameraInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label={`${title} 카메라 촬영`}
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          aria-label={`${title} 갤러리 선택`}
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}

type AddressInputProps = {
  value: string;
  onChange: (address: string) => void;
};

function AddressInput({ value, onChange }: AddressInputProps) {
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isPostcodeReady, setIsPostcodeReady] = useState(false);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);
  const postcodePortalRoot =
    typeof document === "undefined"
      ? null
      : document.querySelector("[data-phone-frame]");

  useEffect(() => {
    if (!isPostcodeOpen || !isPostcodeReady) {
      return;
    }

    const container = postcodeContainerRef.current;

    if (!container || !window.daum) {
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        onChange(data.roadAddress);
        setIsPostcodeOpen(false);
      },
      onclose: () => {
        setIsPostcodeOpen(false);
      },
    }).embed(container);
  }, [isPostcodeOpen, isPostcodeReady, onChange]);

  return (
    <section className="mt-8" aria-labelledby="address-input">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setIsPostcodeReady(true)}
      />
      <h3 id="address-input" className="text-xl font-black">
        주소 입력
      </h3>
      <div className="mt-3 flex gap-2">
        <input
          className="h-14 flex-1 rounded-2xl border border-[#bee9df] bg-white px-5 text-base font-bold outline-none placeholder:text-[#a3aaa8] focus:border-[#1ba77d] focus:ring-4 focus:ring-[#1ba77d]/10"
          placeholder="예) 서울시 마포구 연남동 123-4"
          aria-label="주소 입력"
          value={value}
          readOnly
          onClick={() => setIsPostcodeOpen(true)}
        />
        <button
          type="button"
          className="h-14 shrink-0 rounded-2xl bg-[#1ba77d] px-5 text-sm font-black text-white"
          onClick={() => setIsPostcodeOpen(true)}
        >
          주소 검색
        </button>
      </div>
      <p className="mt-3 text-sm font-bold text-[#789b8c]">
        · 주소로 사용자 유형을 자동 분류해요
      </p>

      {isPostcodeOpen && postcodePortalRoot
        ? createPortal(
            <div className="absolute inset-0 z-50 flex flex-col bg-white">
              <div className="flex items-center justify-between border-b border-[#e7f4ee] px-5 py-4">
                <h4 className="text-lg font-black">주소 검색</h4>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full text-[#13261f]"
                  aria-label="주소 검색 닫기"
                  onClick={() => setIsPostcodeOpen(false)}
                >
                  <XIcon className="size-6" />
                </button>
              </div>
              <div ref={postcodeContainerRef} className="flex-1" />
            </div>,
            postcodePortalRoot,
          )
        : null}
    </section>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const {
    setAddress,
    setElectricFile,
    setGasFile,
    setEsgSurveyAnswers,
    setXgboostResult,
  } = useDiagnosis();
  const [electricFile, setLocalElectricFile] = useState<File | null>(null);
  const [gasFile, setLocalGasFile] = useState<File | null>(null);
  const [address, setLocalAddress] = useState("");

  const handleSubmit = () => {
    if (!electricFile) {
      return;
    }

    setElectricFile(electricFile);
    setGasFile(gasFile);
    setAddress(address);
    // 새 진단을 시작할 때마다 이전 진단의 ESG 설문 응답과 XGBoost 결과를
    // 초기화해 스피너 없이 새 결과가 표시되게 한다.
    setEsgSurveyAnswers(null);
    setXgboostResult(null);
    router.push("/analyzing");
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="bg-[#f2faf6] pt-8 sticky top-0 z-10">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
                aria-label="홈으로 돌아가기"
              >
                <ChevronLeftIcon />
              </Link>
              <h1 className="text-xl font-black ml-3">고지서 업로드</h1>
            </div>
            <span className="text-lg font-black mr-4 text-[#78a091]">1/3</span>
          </div>
          <div className="h-1 bg-[#d8f2ea]">
            <div className="h-full w-1/4 bg-[#1ba77d]" />
          </div>
        </header>

        <section className="px-5 pb-7 pt-8">
          <h2 className="text-[2rem] font-black leading-tight">
            고지서를 업로드해 주세요
          </h2>
          <p className="mt-4 text-base font-bold leading-7 text-[#789b8c]">
            전기 고지서는 필수예요. 가스 고지서를 함께 첨부하면 더 정확한 진단이
            가능해요.
          </p>

          <BillUploadBox
            title="전기 고지서"
            badge="필수"
            badgeClassName="rounded-full bg-[#1ba77d] px-3 py-1 text-sm font-black text-white"
            cta="사진 찍기 또는 파일 첨부"
            onFileSelected={setLocalElectricFile}
          />

          <BillUploadBox
            title="가스 고지서"
            badge="선택"
            badgeClassName="rounded-full bg-[#d5eee6] px-3 py-1 text-sm font-black text-[#789b8c]"
            cta="가스 고지서 추가하기"
            onFileSelected={setLocalGasFile}
          />

          <AddressInput value={address} onChange={setLocalAddress} />

          <button
            type="button"
            disabled={!electricFile}
            onClick={handleSubmit}
            className={`mt-8 w-full rounded-2xl px-6 py-5 text-xl font-black text-white ${
              electricFile ? "bg-[#1ba77d]" : "bg-[#a8ddc9]"
            }`}
          >
            분석 시작하기
          </button>
          <p className="mt-5 text-center text-sm font-bold text-[#789b8c]">
            업로드한 데이터는 분석 후 즉시 삭제돼요
          </p>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
