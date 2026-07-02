// 백엔드가 RAG 정책 추천 결과를 그대로 전달한다 (GLGC-BE
// `GET /diagnosis/:id/actions/:code/policy`). RAG 응답에는 agency/매칭률/마감일/태그에
// 대응하는 필드가 없어 더미 데이터에 있던 그 항목들은 화면에서 뺐다.
export type SupportProgram = {
  title: string;
  actionTitle: string;
  description: string;
  documents: string;
  link: string;
  difficulty: string;
  carbonSaving: string;
  // 백엔드 RAG 응답 추가 필드
  source?: string; // 지원 기관 (e.g. "중소벤처기업부")
  takes?: string; // 지원 규모 (e.g. "최대 300만원")
  time?: string; // 접수 기간 (e.g. "2026.04.27 ~ 2026.11.30")
  target?: string; // 대상 (e.g. "일반가구")
};

// RAG에 맞춤 매칭이 없을 때 대신 내려주는 일반 안내 항목. 링크/난이도/절감액처럼
// 매칭 결과에만 있는 필드가 없어 SupportProgram과 별도 타입으로 둔다.
export type DefaultActionSuggestion = {
  id: number;
  title: string;
  description: string;
  url: string;
};

export const DUMMY_SUPPORT_PROGRAMS: SupportProgram[] = [
  {
    title: "소상공인 에너지효율화 지원사업",
    actionTitle: "LED 조명 교체",
    description: "노후 조명을 LED로 교체하는 소상공인 대상 지원사업입니다.",
    documents: "사업자등록증 · 고지서 3개월치 · 에너지진단 확인서",
    link: "https://example.com/programs/led-lighting",
    difficulty: "쉬움",
    carbonSaving: "연 30만원",
  },
  {
    title: "노후 냉방설비 고효율 교체 지원",
    actionTitle: "인버터 에어컨 교체",
    description: "정속형 냉방기를 인버터형으로 교체하는 비용을 지원합니다.",
    documents: "사업자등록증 · 기존 설비 사진 · 견적서",
    link: "https://example.com/programs/hvac-efficiency",
    difficulty: "중간",
    carbonSaving: "연 50만원",
  },
];
