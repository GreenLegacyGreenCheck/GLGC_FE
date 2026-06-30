export type TrendDirection = "improving" | "steady" | "worsening";

export type MyDiagnosisEntry = {
  id: string;
  target: string;
  grade: "A" | "B" | "C" | "D";
  co2Tons: number;
  usageKwh: number | null;
  address: string | null;
  billingMonth: string | null;
  createdAt: string;
};

export type MyDiagnosesSummary = {
  diagnosisCount: number;
  lowestEmissionTons: number;
  recentTrend: TrendDirection;
  trendChangePercent: number;
  trendSparkline: number[];
};

export type MyDiagnosesResult = {
  diagnoses: MyDiagnosisEntry[];
  summary: MyDiagnosesSummary;
};

function isMyDiagnosisEntry(value: unknown): value is MyDiagnosisEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.target === "string" &&
    ["A", "B", "C", "D"].includes(entry.grade as string) &&
    typeof entry.co2Tons === "number" &&
    (entry.usageKwh === null || typeof entry.usageKwh === "number") &&
    (entry.address === null || typeof entry.address === "string") &&
    (entry.billingMonth === null || typeof entry.billingMonth === "string") &&
    typeof entry.createdAt === "string"
  );
}

function isMyDiagnosesResult(value: unknown): value is MyDiagnosesResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  if (
    !Array.isArray(result.diagnoses) ||
    typeof result.summary !== "object" ||
    result.summary === null
  ) {
    return false;
  }
  const summary = result.summary as Record<string, unknown>;
  return (
    result.diagnoses.every(isMyDiagnosisEntry) &&
    typeof summary.diagnosisCount === "number" &&
    typeof summary.lowestEmissionTons === "number" &&
    ["improving", "steady", "worsening"].includes(
      summary.recentTrend as string,
    ) &&
    typeof summary.trendChangePercent === "number" &&
    Array.isArray(summary.trendSparkline)
  );
}

export type NotificationSettings = {
  diagnosisAlert: boolean;
  weeklyReport: boolean;
  goalAlert: boolean;
  appUpdate: boolean;
};

function isNotificationSettings(value: unknown): value is NotificationSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.diagnosisAlert === "boolean" &&
    typeof settings.weeklyReport === "boolean" &&
    typeof settings.goalAlert === "boolean" &&
    typeof settings.appUpdate === "boolean"
  );
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

export async function getMyDiagnoses(
  token: string,
): Promise<MyDiagnosesResult> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/users/me/diagnoses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `진단 이력을 불러오지 못했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isMyDiagnosesResult(data)) {
    throw new Error("진단 이력 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export async function getNotificationSettings(
  token: string,
): Promise<NotificationSettings> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/users/me/notification-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `알림 설정을 불러오지 못했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isNotificationSettings(data)) {
    throw new Error("알림 설정 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

export async function updateNotificationSettings(
  token: string,
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/users/me/notification-settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(
      `알림 설정을 저장하지 못했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isNotificationSettings(data)) {
    throw new Error("알림 설정 응답 형식이 올바르지 않습니다.");
  }

  return data;
}
