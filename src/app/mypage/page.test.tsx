import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuth } from "@/context/auth-test-utils";
import MyPagePage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

const getMyDiagnoses = vi.fn();

vi.mock("@/lib/users-api", () => ({
  getMyDiagnoses: (...args: unknown[]) => getMyDiagnoses(...args),
}));

const loggedInAuth = {
  token: "jwt-token",
  user: { id: "user-1", email: "user@example.com" },
};

const diagnosesFixture = {
  diagnoses: [
    {
      id: "2025-05",
      target: "소상공인",
      grade: "C" as const,
      co2Tons: 2.84,
      usageKwh: 330,
      address: "서울 마포구",
      billingMonth: "2025-05",
      createdAt: "2025-05-10T00:00:00.000Z",
    },
    {
      id: "2025-01",
      target: "소상공인",
      grade: "D" as const,
      co2Tons: 3.18,
      usageKwh: 387,
      address: "서울 마포구",
      billingMonth: "2025-01",
      createdAt: "2025-01-10T00:00:00.000Z",
    },
  ],
  summary: {
    diagnosisCount: 5,
    lowestEmissionTons: 2.51,
    recentTrend: "improving" as const,
    trendChangePercent: -10.7,
    // 트렌드 스파크라인 길이는 실제 백엔드에서는 항상 diagnoses 배열 길이와
    // 맞물려 있으므로(같은 데이터에서 파생), 픽스처도 diagnoses 2건에 맞춰
    // 2개로 둔다 — 그래야 마지막 달 라벨과 이력 카드가 같은 텍스트를 중복
    // 렌더링하지 않는다.
    trendSparkline: [3.18, 2.84],
  },
};

describe("MyPagePage", () => {
  it("shows a login prompt when logged out", () => {
    renderWithAuth(<MyPagePage />, { token: null, user: null });

    expect(screen.getByText("비회원")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /로그인하고 진단 이력 확인하기/ }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows the email's local part as the display name when logged in", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    renderWithAuth(<MyPagePage />, loggedInAuth);

    expect(await screen.findByText("user")).toBeInTheDocument();
  });

  it("shows the header stats and recent trend", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    renderWithAuth(<MyPagePage />, loggedInAuth);

    expect(await screen.findByText("5회")).toBeInTheDocument();
    expect(screen.getByText("2.51t")).toBeInTheDocument();
    expect(screen.getAllByText("개선 중").length).toBeGreaterThan(0);
  });

  it("shows the report history, with the latest entry tagged", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    renderWithAuth(<MyPagePage />, loggedInAuth);

    // 트렌드 차트의 "최신 달" 라벨과 이력 카드 중 가장 최근 항목의 월이 같은
    // 텍스트("2025년 5월")라 두 군데에서 렌더링된다 — 의도된 중복이므로
    // getAllByText로 확인한다.
    expect((await screen.findAllByText("2025년 5월")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("2025년 1월").length).toBeGreaterThan(0);
    expect(screen.getByText("가장 최근 진단")).toBeInTheDocument();
  });

  it("switches to the settings tab and shows the menu items", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    const user = userEvent.setup();
    renderWithAuth(<MyPagePage />, loggedInAuth);

    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(screen.getByText("알림 설정")).toBeInTheDocument();
    expect(screen.getByText("개인정보 처리방침")).toBeInTheDocument();
    expect(screen.getByText("이용약관")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "로그아웃" }),
    ).toBeInTheDocument();
  });

  it("links settings items to their respective sub-pages", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    const user = userEvent.setup();
    renderWithAuth(<MyPagePage />, loggedInAuth);

    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(screen.getByRole("link", { name: "알림 설정" })).toHaveAttribute(
      "href",
      "/mypage/notifications",
    );
    expect(
      screen.getByRole("link", { name: "개인정보 처리방침" }),
    ).toHaveAttribute("href", "/mypage/privacy");
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/mypage/terms",
    );
  });

  it("logs out and navigates home when logging out", async () => {
    getMyDiagnoses.mockResolvedValue(diagnosesFixture);
    const user = userEvent.setup();
    renderWithAuth(<MyPagePage />, loggedInAuth);

    await user.click(screen.getByRole("button", { name: "설정" }));
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows a login link instead of logout in the settings tab when logged out", async () => {
    const user = userEvent.setup();
    renderWithAuth(<MyPagePage />, { token: null, user: null });

    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
