const CACHE_NAME = "greencheck-v1";

// 오프라인에서도 즉시 열 수 있도록 앱 셸과 오프라인 페이지를 미리 캐시한다.
const PRECACHE_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 외부 도메인이나 GET 외의 요청은 서비스 워커가 관여하지 않는다.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // 백엔드 API 요청은 항상 네트워크에서 가져온다.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 페이지 탐색: 네트워크 우선, 실패 시 /offline으로 폴백.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // Next.js 정적 자산(_next/static)과 public 이미지/아이콘: 캐시 우선.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
  }
});
