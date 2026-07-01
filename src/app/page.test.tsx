import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import Home from "./page";

describe("Home", () => {
  it("renders the GreenCheck home screen", () => {
    renderWithDiagnosis(<Home />);
    expect(
      screen.getByRole("heading", {
        name: "고지서 한 장으로 시작하는 기후 자가진단",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "지금 시작하기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "사용 방법" }),
    ).toBeInTheDocument();
    expect(screen.getByText("누구나 사용 가능해요")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "하단 메뉴" }),
    ).toBeInTheDocument();
  });
});
