"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import { runDiagnosisPipeline, type PipelineStepId } from "@/lib/pipeline";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STEPS: { id: PipelineStepId; title: string; subtitle: string }[] = [
  { id: "ocr", title: "고지서 OCR 추출", subtitle: "텍스트·수치 인식 중" },
  {
    id: "scope2",
    title: "Scope 2 탄소 계산",
    subtitle: "전력·열에너지 환산 중",
  },
  {
    id: "classify",
    title: "사용자 유형 분류",
    subtitle: "Z-score 기반 자동 분기 중",
  },
  {
    id: "report",
    title: "리포트 생성 완료",
    subtitle: "맞춤 액션 & 지원사업 매칭",
  },
];

// scope2/classify/report run back-to-back with no real async gap between
// them, so without pacing, React batches all three step updates into a
// single render and the user only ever sees step 1 pop — steps 2-4 jump to
// "done" simultaneously. This queue forces each step reveal onto its own
// timer tick, spaced far enough apart (> the .step-badge-pop animation
// duration) that each badge's pop is visible before the next one fires. It
// never adds delay beyond what's needed: a step that already took longer
// than this interval (e.g. the OCR network call) reveals immediately.
const STEP_REVEAL_INTERVAL_MS = 420;

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SproutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-9 text-[#1ba77d]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21v-9" strokeLinecap="round" />
      <path d="M12 12c0-4 -3-6-7-6 0 4 3 6 7 6Z" />
      <path d="M12 12c0-5 3-8 8-8 0 5 -3 8-8 8Z" />
    </svg>
  );
}

export default function AnalyzingPage() {
  const router = useRouter();
  const { electricFile, gasFile, status, result, setResult, setStatus } =
    useDiagnosis();
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStepId>>(
    new Set(),
  );
  const [displayPercent, setDisplayPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const actionQueueRef = useRef<(() => void)[]>([]);
  const isFlushingRef = useRef(false);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // OCR's network round trip can take anywhere from a couple seconds to a
  // couple minutes depending on backend load, so a smooth easing curve
  // (e.g. 1 - e^-t) is the wrong shape here: it converges to its ceiling
  // within ~10s regardless of tau, then sits visually frozen for however
  // much longer the real wait drags on — exactly the "stuck" complaint,
  // just moved from 0% to wherever the ceiling is. Ticking by a fixed +1%
  // on a growing-but-capped delay guarantees a visible bump at least every
  // MAX_TICK_DELAY_MS, no matter how long the real step takes, while still
  // leaving headroom below the next real milestone for that to land on.
  useEffect(() => {
    if (completedSteps.size >= STEPS.length) {
      return;
    }

    const segmentStart = (completedSteps.size / STEPS.length) * 100;
    const segmentSize = 100 / STEPS.length;
    const creepCeiling = segmentStart + segmentSize * 0.94;

    const INITIAL_TICK_DELAY_MS = 700;
    const MAX_TICK_DELAY_MS = 9000;
    const TICK_DELAY_GROWTH = 1.35;

    let current = segmentStart;
    let delay = INITIAL_TICK_DELAY_MS;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      current = Math.min(current + 1, creepCeiling);
      setDisplayPercent(current);

      if (current >= creepCeiling) {
        return;
      }

      delay = Math.min(delay * TICK_DELAY_GROWTH, MAX_TICK_DELAY_MS);
      timeoutId = setTimeout(tick, delay);
    }

    timeoutId = setTimeout(tick, delay);

    return () => clearTimeout(timeoutId);
  }, [completedSteps]);

  useEffect(() => {
    if (!electricFile) {
      router.replace("/upload");
      return;
    }

    if (status === "done" && result) {
      router.replace("/user-type");
      return;
    }

    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    setErrorMessage(null);

    function resetStepQueue() {
      actionQueueRef.current = [];
      isFlushingRef.current = false;

      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }
    }

    function flushStepQueue() {
      // Checked here, not via effect cleanup: an effect cleanup that
      // cancels this timer would also fire during React Strict Mode's
      // dev-only double-invoke of this same effect, permanently stalling
      // the queue on the (guarded, single-run) remount — see hasStartedRef.
      if (!isMountedRef.current) {
        isFlushingRef.current = false;
        return;
      }

      const action = actionQueueRef.current.shift();

      if (!action) {
        isFlushingRef.current = false;
        return;
      }

      action();
      flushTimeoutRef.current = setTimeout(
        flushStepQueue,
        STEP_REVEAL_INTERVAL_MS,
      );
    }

    function enqueueStepReveal(action: () => void) {
      actionQueueRef.current.push(action);

      if (!isFlushingRef.current) {
        isFlushingRef.current = true;
        flushStepQueue();
      }
    }

    resetStepQueue();

    runDiagnosisPipeline({ electricFile, gasFile }, (step) => {
      const stepIndex = STEPS.findIndex((s) => s.id === step);

      enqueueStepReveal(() => {
        setCompletedSteps(new Set(STEPS.slice(0, stepIndex).map((s) => s.id)));
      });
    })
      .then((diagnosisResult) => {
        enqueueStepReveal(() => {
          setCompletedSteps(new Set(STEPS.map((s) => s.id)));
        });
        enqueueStepReveal(() => {
          setResult(diagnosisResult);
          setStatus("done");
          router.push("/user-type");
        });
      })
      .catch((error: unknown) => {
        resetStepQueue();
        hasStartedRef.current = false;

        if (!isMountedRef.current) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "분석 중 오류가 발생했어요.";

        setStatus("error", message);
        setErrorMessage(message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const confirmedPercent = (completedSteps.size / STEPS.length) * 100;
  const percent = Math.round(Math.max(confirmedPercent, displayPercent));
  const currentStepIndex = completedSteps.size;

  return (
    <>
      <div className="scrollbar-hidden flex h-screen flex-col items-center justify-center overflow-y-auto overscroll-contain px-8 pb-32 pt-15.25 sm:h-full">
        {errorMessage ? (
          <div className="text-center">
            <p className="text-lg font-black text-[#13261f]">
              분석 중 문제가 발생했어요
            </p>
            <p className="mt-2 text-sm font-bold text-[#789b8c]">
              {errorMessage}
            </p>
            <button
              type="button"
              className="mt-6 rounded-2xl bg-[#1ba77d] px-6 py-3 text-base font-black text-white"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <div className="relative grid size-40 place-items-center rounded-full">
              <span className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]" />
              <span
                className="sprout-pulse-ring absolute inset-0 rounded-full border-2 border-[#1ba77d]"
                style={{ animationDelay: "0.9s" }}
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                className="absolute inset-0 size-40 -rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#d8f2ea"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#1ba77d"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - percent / 100)}
                  className="transition-[stroke-dashoffset] duration-300 ease-out"
                />
              </svg>
              <div className="grid size-28 place-items-center rounded-full bg-white shadow-inner">
                <SproutIcon />
              </div>
            </div>

            <p className="mt-13.75 text-4xl font-black text-[#13261f]">
              {percent}%
            </p>
            <p className="mt-2 text-base font-bold text-[#789b8c]">
              AI가 분석하고 있어요...
            </p>

            <ul className="mt-10 flex w-full max-w-xs flex-col gap-5">
              {STEPS.map((step, index) => {
                const isDone = completedSteps.has(step.id);
                const isCurrent = !isDone && index === currentStepIndex;
                const badgeStatus = isDone
                  ? "done"
                  : isCurrent
                    ? "current"
                    : "pending";

                return (
                  <li key={step.id} className="flex items-center gap-3">
                    <span
                      key={badgeStatus}
                      className={`step-badge-pop grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                        isDone
                          ? "bg-[#1ba77d] text-white"
                          : isCurrent
                            ? "bg-[#bfe9da] text-[#0d5f4b]"
                            : "bg-[#e7f2ec] text-[#9bb3aa]"
                      }`}
                    >
                      {isDone ? <CheckIcon /> : index + 1}
                    </span>
                    <span>
                      <span
                        className={`block text-base font-black ${
                          isDone || isCurrent
                            ? "text-[#13261f]"
                            : "text-[#9bb3aa]"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="block text-sm font-bold text-[#789b8c]">
                        {step.subtitle}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
