// 알림 설정을 localStorage에 로컬 캐시해둔다.
// 백엔드(NotificationSetting)가 source of truth이고, 이 값은
// 분석 페이지·레이아웃처럼 매 요청마다 서버를 칠 수 없는 곳에서 읽는다.

const KEY = "glgc-notif";

type LocalNotifPrefs = {
  diagnosisAlert: boolean;
  appUpdate: boolean;
};

const defaults: LocalNotifPrefs = {
  diagnosisAlert: true,
  appUpdate: false,
};

export function readNotifPrefs(): LocalNotifPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw
      ? { ...defaults, ...(JSON.parse(raw) as Partial<LocalNotifPrefs>) }
      : defaults;
  } catch {
    return defaults;
  }
}

export function writeNotifPrefs(patch: Partial<LocalNotifPrefs>): void {
  if (typeof window === "undefined") return;
  try {
    const current = readNotifPrefs();
    window.localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

// 브라우저 알림 권한을 요청하고, 허용됐으면 true를 반환한다.
export async function requestNotifPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window))
    return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showBrowserNotif(title: string, body: string): void {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  new Notification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
  });
}
