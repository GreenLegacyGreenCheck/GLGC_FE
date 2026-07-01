function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl)
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  return baseUrl;
}

type PresignedUrlResponse = { uploadUrl: string; key: string };

// 백엔드에서 S3 Presigned Upload URL 발급
export async function getPresignedUploadUrl(
  file: File,
): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({
    filename: file.name,
    contentType: file.type || "image/jpeg",
  });

  const res = await fetch(`${getBaseUrl()}/upload/presigned-url?${params}`);
  if (!res.ok) {
    throw new Error(`Presigned URL 발급 실패 (${res.status})`);
  }
  return res.json() as Promise<PresignedUrlResponse>;
}

// S3에 파일 직접 업로드 (PUT)
export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (${res.status})`);
  }
}

// Presigned URL 발급 → S3 업로드를 한 번에 처리하고 S3 key 반환
export async function uploadBillToS3(file: File): Promise<string> {
  const { uploadUrl, key } = await getPresignedUploadUrl(file);
  await uploadFileToS3(uploadUrl, file);
  return key;
}
