"use client";

import BottomNavigation from "@/components/BottomNavigation";
import EsgSurveySheet from "@/components/EsgSurveySheet";
import { SparkleIcon, SproutIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useDiagnosis } from "@/context/diagnosis-context";
import { getEsgQuestions } from "@/lib/diagnosis-api";
import type { EsgSurveyAnswers, EsgSurveyQuestion } from "@/lib/esg-survey";
import { runDiagnosisPipeline, type PipelineStepId } from "@/lib/pipeline";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 분석에 시간이 걸리는 동안 설문을 유도하는 팝업을 띄우기까지의 지연.
// 너무 빠르면 로딩 화면이 뜨자마자 끼어드는 느낌이라, 진행 단계가 한두 개
// 보인 뒤에 자연스럽게 제안하도록 둔다.
const SURVEY_PROMPT_DELAY_MS = 2800;

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

export default function AnalyzingPage() {
  const router = useRouter();
  const {
    address,
    electricFile,
    gasFile,
    status,
    result,
    setResult,
    setStatus,
    esgSurveyAnswers,
    setEsgSurveyAnswers,
  } = useDiagnosis();
  const { token } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<PipelineStepId>>(
    new Set(),
  );
  const [displayPercent, setDisplayPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [surveyPromptVisible, setSurveyPromptVisible] = useState(false);
  const [surveySheetOpen, setSurveySheetOpen] = useState(false);
  const [esgQuestions, setEsgQuestions] = useState<EsgSurveyQuestion[] | null>(
    null,
  );
  const [esgQuestionsFailed, setEsgQuestionsFailed] = useState(false);
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

  // ESG 설문 문항은 백엔드(XGBoost 서비스)에서 받아와야 해서, 분석이
  // 시작되자마자 미리 가져와 둔다 — 설문 팝업이 뜰 때 로딩 없이 바로
  // 보여주기 위함.
  useEffect(() => {
    let isCancelled = false;

    getEsgQuestions()
      .then((questions) => {
        if (!isCancelled) setEsgQuestions(questions);
      })
      .catch(() => {
        if (!isCancelled) setEsgQuestionsFailed(true);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 문항을 못 가져오면 설문 자체가 불가능하므로, 진단 흐름이 막히지 않게
  // 빈 응답으로 곧바로 통과시킨다.
  useEffect(() => {
    if (esgQuestionsFailed && !esgSurveyAnswers) {
      setEsgSurveyAnswers({});
    }
  }, [esgQuestionsFailed, esgSurveyAnswers, setEsgSurveyAnswers]);

  // 설문에 이미 답했다면(esgSurveyAnswers) 다시 끼어들지 않는다. 설문은
  // 필수라 한 번 떠오르면 사용자가 직접 닫을 방법은 없다 — 탭해서 시작하거나,
  // 분석이 먼저 끝나면 자동으로 열린다(아래 강제 오픈 effect 참고).
  useEffect(() => {
    if (esgSurveyAnswers || !esgQuestions) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setSurveyPromptVisible(true);
      }
    }, SURVEY_PROMPT_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [esgSurveyAnswers, esgQuestions]);

  // 분석이 설문보다 먼저 끝나도 결과로 못 넘어가게, 설문을 못 본 채로
  // 끝났다면 곧바로 강제로 띄운다.
  useEffect(() => {
    if (
      status === "done" &&
      result &&
      !esgSurveyAnswers &&
      esgQuestions &&
      !surveySheetOpen
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSurveyPromptVisible(false);
      setSurveySheetOpen(true);
    }
  }, [status, result, esgSurveyAnswers, esgQuestions, surveySheetOpen]);

  // 분석과 설문이 둘 다 끝났을 때만 결과로 넘어간다.
  useEffect(() => {
    if (status === "done" && result && esgSurveyAnswers) {
      router.push("/user-type");
    }
  }, [status, result, esgSurveyAnswers, router]);

  const handleOpenSurvey = () => {
    setSurveyPromptVisible(false);
    setSurveySheetOpen(true);
  };

  const handleCompleteSurvey = (answers: EsgSurveyAnswers) => {
    setEsgSurveyAnswers(answers);
    setSurveySheetOpen(false);
  };

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
      // 분석은 이미 끝났으니 다시 돌리지 않는다 — 설문까지 끝났을 때만
      // 결과로 넘어가고, 안 끝났으면 강제 오픈 effect가 설문을 띄운다.
      if (esgSurveyAnswers) {
        router.replace("/user-type");
      }
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

    runDiagnosisPipeline({ electricFile, gasFile, address, token }, (step) => {
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
      {!errorMessage ? (
        <div className="absolute inset-x-0 top-3 z-50 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-[#0d2c22]/95 px-3 py-1.5 text-white shadow-lg">
            <SproutIcon className="size-3.5 animate-spin text-[#7be0bb]" />
            <span className="text-xs font-black">{percent}%</span>
          </div>
        </div>
      ) : null}

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
                <SproutIcon className="size-9 text-[#1ba77d]" />
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

      {surveyPromptVisible && !surveySheetOpen ? (
        <div className="absolute inset-x-5 bottom-28 z-30">
          <button
            type="button"
            onClick={handleOpenSurvey}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-xl shadow-emerald-950/15"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eef8f3]">
              <SparkleIcon className="size-6 text-[#1ba77d]" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-black text-[#13261f]">
                결과를 보려면 설문을 완료해주세요
              </span>
              <span className="mt-0.5 block text-xs font-bold text-[#789b8c]">
                ESG 자가진단 설문, 1분이면 끝나요
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {surveySheetOpen && esgQuestions ? (
        <EsgSurveySheet
          questions={esgQuestions}
          onComplete={handleCompleteSurvey}
        />
      ) : null}

      {!surveySheetOpen ? <BottomNavigation activeLabel="진단 리포트" /> : null}
    </>
  );
}
