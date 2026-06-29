import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfflinePage from "./page";

describe("OfflinePage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("location", { ...window.location, reload: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the offline message and the network badge", () => {
    render(<OfflinePage />);

    expect(screen.getByText("네트워크 없음")).toBeInTheDocument();
    expect(screen.getByText("인터넷 연결이 끊어졌어요")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /다시 시도하기/ }),
    ).toBeInTheDocument();
  });

  it("counts down from 6 and reloads automatically once it reaches 0", async () => {
    render(<OfflinePage />);

    expect(screen.getByText("6")).toBeInTheDocument();

    for (let tick = 0; tick < 6; tick += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(window.location.reload).toHaveBeenCalled();
  });

  it("reloads immediately when the retry button is clicked", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<OfflinePage />);
    await user.click(screen.getByRole("button", { name: /다시 시도하기/ }));

    expect(window.location.reload).toHaveBeenCalled();
  });
});
