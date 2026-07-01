"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 서비스 워커 등록 실패는 앱 동작에 영향을 주지 않는다(오프라인 캐시만 비활성화됨).
    });
  }, []);

  return null;
}
