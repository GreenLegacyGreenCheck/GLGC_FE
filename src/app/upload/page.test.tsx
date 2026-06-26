import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiagnosisProvider } from "@/context/diagnosis-context";
import UploadPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderUploadPage() {
  return render(
    <div data-phone-frame>
      <DiagnosisProvider>
        <UploadPage />
      </DiagnosisProvider>
    </div>,
  );
}

describe("UploadPage", () => {
  it("renders the bill upload form", async () => {
    const user = userEvent.setup();

    renderUploadPage();
    expect(
      screen.getByRole("heading", { name: "고지서 업로드" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /사진 찍기 또는 파일 첨부/ }),
    );
    expect(
      screen.getByRole("button", { name: "카메라로 촬영" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "갤러리에서 선택" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("전기 고지서 카메라 촬영"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("전기 고지서 갤러리 선택"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "파일에서 선택" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "주소 입력" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "분석 시작하기" }),
    ).toBeInTheDocument();
  });

  it("previews an uploaded image and opens the preview menu item", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:bill-preview");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    renderUploadPage();
    await user.click(
      screen.getByRole("button", { name: /사진 찍기 또는 파일 첨부/ }),
    );

    const file = new File(["bill"], "bill.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("전기 고지서 갤러리 선택"), file);
    await user.click(screen.getByRole("button", { name: /bill.png/ }));

    expect(
      screen.getByRole("button", { name: "사진 미리보기" }),
    ).toBeInTheDocument();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("disables submit until an electric bill is uploaded, then navigates to /analyzing", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:bill-preview");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    renderUploadPage();
    expect(
      screen.getByRole("button", { name: "분석 시작하기" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: /사진 찍기 또는 파일 첨부/ }),
    );
    const file = new File(["bill"], "bill.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("전기 고지서 갤러리 선택"), file);

    const submitButton = screen.getByRole("button", { name: "분석 시작하기" });

    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);
    expect(push).toHaveBeenCalledWith("/analyzing");

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });
});
