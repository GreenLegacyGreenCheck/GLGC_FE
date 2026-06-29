import type { RecommendedActionView } from "@/context/diagnosis-context";
import type {
  DefaultActionSuggestion,
  SupportProgram,
} from "./support-programs";

export type CreateDiagnosisInput = {
  target: string;
  electricityRatio: number;
  gasRatio: number;
  targetEmissionKg: number;
};

type RawAction = {
  code: string;
  icon: string | null;
  title: string;
  description: string;
  difficulty: string;
  costLabel: string;
};

type RawRecommendedAction = {
  expectedMinKg: number;
  expectedMaxKg: number;
  action: RawAction;
};

type RawDiagnosis = {
  id: string;
  recommendedActions: RawRecommendedAction[];
};

function isRawAction(value: unknown): value is RawAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return (
    typeof action.code === "string" &&
    (action.icon === null || typeof action.icon === "string") &&
    typeof action.title === "string" &&
    typeof action.description === "string" &&
    typeof action.difficulty === "string" &&
    typeof action.costLabel === "string"
  );
}

function isRawRecommendedAction(value: unknown): value is RawRecommendedAction {
  if (typeof value !== "object" || value === null) return false;
  const recommended = value as Record<string, unknown>;
  return (
    typeof recommended.expectedMinKg === "number" &&
    typeof recommended.expectedMaxKg === "number" &&
    isRawAction(recommended.action)
  );
}

function isRawDiagnosis(value: unknown): value is RawDiagnosis {
  if (typeof value !== "object" || value === null) return false;
  const diagnosis = value as Record<string, unknown>;
  return (
    typeof diagnosis.id === "string" &&
    Array.isArray(diagnosis.recommendedActions) &&
    diagnosis.recommendedActions.every(isRawRecommendedAction)
  );
}

function toRecommendedActionView(
  raw: RawRecommendedAction,
): RecommendedActionView {
  return {
    code: raw.action.code,
    icon: raw.action.icon,
    title: raw.action.title,
    description: raw.action.description,
    difficulty: raw.action.difficulty,
    costLabel: raw.action.costLabel,
    expectedMinKg: raw.expectedMinKg,
    expectedMaxKg: raw.expectedMaxKg,
  };
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

export async function createDiagnosis(input: CreateDiagnosisInput): Promise<{
  diagnosisId: string;
  recommendedActions: RecommendedActionView[];
}> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/diagnosis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`진단 생성에 실패했습니다. (status: ${response.status})`);
  }

  const data: unknown = await response.json();

  if (!isRawDiagnosis(data)) {
    throw new Error("진단 응답 형식이 올바르지 않습니다.");
  }

  return {
    diagnosisId: data.id,
    recommendedActions: data.recommendedActions.map(toRecommendedActionView),
  };
}

type RawPolicyItem = {
  title: string;
  action_title: string;
  description: string;
  documents: string;
  link: string;
  difficulty: string;
  carbon_saving: string;
};

function isRawPolicyItem(value: unknown): value is RawPolicyItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === "string" &&
    typeof item.action_title === "string" &&
    typeof item.description === "string" &&
    typeof item.documents === "string" &&
    typeof item.link === "string" &&
    typeof item.difficulty === "string" &&
    typeof item.carbon_saving === "string"
  );
}

type RawDefaultAction = {
  id: number;
  title: string;
  description: string;
  url: string;
};

function isRawDefaultAction(value: unknown): value is RawDefaultAction {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.url === "string"
  );
}

export type ActionPolicyResult = {
  programs: SupportProgram[];
  defaultActions: DefaultActionSuggestion[];
};

// 정책 추천(RAG)은 외부 서비스라 액션 하나가 실패하거나 응답 형식이
// 예상과 다르더라도 나머지 선택된 액션의 결과는 보여줄 수 있어야 하므로,
// 던지지 않고 빈 결과로 처리한다.
export async function getActionPolicy(
  diagnosisId: string,
  actionCode: string,
): Promise<ActionPolicyResult> {
  const empty: ActionPolicyResult = { programs: [], defaultActions: [] };
  const baseUrl = getBaseUrl();

  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/diagnosis/${diagnosisId}/actions/${actionCode}/policy`,
    );
  } catch {
    return empty;
  }

  if (!response.ok) {
    return empty;
  }

  const data: unknown = await response.json();

  if (typeof data !== "object" || data === null) {
    return empty;
  }

  const { data: rawPrograms, default_actions: rawDefaultActions } =
    data as Record<string, unknown>;

  const programs = Array.isArray(rawPrograms)
    ? rawPrograms.filter(isRawPolicyItem).map((item) => ({
        title: item.title,
        actionTitle: item.action_title,
        description: item.description,
        documents: item.documents,
        link: item.link,
        difficulty: item.difficulty,
        carbonSaving: item.carbon_saving,
      }))
    : [];

  const defaultActions = Array.isArray(rawDefaultActions)
    ? rawDefaultActions.filter(isRawDefaultAction)
    : [];

  return { programs, defaultActions };
}
