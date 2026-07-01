function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl)
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  return baseUrl;
}

// 백엔드에서 VAPID 공개 키를 가져와 브라우저 구독 생성
async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/push/vapid-public-key`);
  const data = (await res.json()) as { publicKey: string };
  return data.publicKey;
}

// URL-safe Base64 → Uint8Array (VAPID 공개 키 변환)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

// 브라우저 Push 구독 생성 후 백엔드에 등록
export async function subscribePush(token: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return false;

  const registration = await navigator.serviceWorker.ready;
  const publicKey = await getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const { endpoint, keys } = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await fetch(`${getBaseUrl()}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
  });

  return res.ok;
}

// 현재 기기의 Push 구독 해지
export async function unsubscribePush(token: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch(`${getBaseUrl()}/push/subscribe`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}
