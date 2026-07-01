// 카카오/Google 인가 화면으로 보내는 URL을 만든다. 실제 client id/redirect uri는
// 각 플랫폼의 OAuth 앱 설정에 등록된 값과 정확히 일치해야 하므로 환경변수로 둔다.
function buildAuthorizeUrl(
  base: string,
  params: Record<string, string>,
): string | null {
  const search = new URLSearchParams(params);
  return `${base}?${search.toString()}`;
}

export function getKakaoAuthorizeUrl(): string | null {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return null;
  }

  return buildAuthorizeUrl("https://kauth.kakao.com/oauth/authorize", {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
  });
}

export function getGoogleAuthorizeUrl(): string | null {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return null;
  }

  return buildAuthorizeUrl("https://accounts.google.com/o/oauth2/v2/auth", {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
  });
}

export function getKakaoRedirectUri(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
}

export function getGoogleRedirectUri(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
}
