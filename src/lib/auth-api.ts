import type { AuthUser } from "@/context/auth-context";

export type AuthResult = {
  token: string;
  user: AuthUser;
};

type RawAuthResult = {
  token: string;
  user: { id: string; email: string };
};

function isRawAuthResult(value: unknown): value is RawAuthResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (
    typeof result.token !== "string" ||
    typeof result.user !== "object" ||
    result.user === null
  ) {
    return false;
  }
  const user = result.user as Record<string, unknown>;
  return typeof user.id === "string" && typeof user.email === "string";
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.local을 확인해주세요.",
    );
  }

  return baseUrl;
}

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  const baseUrl = getBaseUrl();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("서버에 연결할 수 없습니다.");
  }

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    const message =
      errorBody &&
      typeof errorBody === "object" &&
      "message" in errorBody &&
      typeof (errorBody as { message: unknown }).message === "string"
        ? (errorBody as { message: string }).message
        : "요청이 실패했어요.";
    throw new Error(message);
  }

  const data: unknown = await response.json();

  if (!isRawAuthResult(data)) {
    throw new Error("응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export function signup(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return postAuth("/auth/signup", input);
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return postAuth("/auth/login", input);
}

export function loginWithKakao(
  code: string,
  redirectUri: string,
): Promise<AuthResult> {
  return postAuth("/auth/kakao", { code, redirectUri });
}

export function loginWithGoogle(
  code: string,
  redirectUri: string,
): Promise<AuthResult> {
  return postAuth("/auth/google", { code, redirectUri });
}
