"use client";

import type { EsgSurveyAnswers, EsgSurveyQuestion } from "@/lib/esg-survey";
import { useState } from "react";

const CATEGORY_COLOR: Record<EsgSurveyQuestion["category"], string> = {
  E: "#1ba77d",
  S: "#3b82f6",
  G: "#8b5cf6",
};

const SCALE = [1, 2, 3, 4, 5];

function AnswerScale({
  value,
  color,
  onSelect,
}: {
  value: number | undefined;
  color: string;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-1.5">
        {SCALE.map((step) => {
          const filled = value !== undefined && step <= value;

          return (
            <span
              key={step}
              aria-hidden="true"
              className={`flex-1 rounded-full transition-all ${filled ? "h-2.5" : "h-2 bg-[#eef3f0]"}`}
              style={filled ? { backgroundColor: color } : undefined}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {SCALE.map((step) => {
          const selected = value === step;

          return (
            <button
              key={step}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(step)}
              className="grid size-10 place-items-center rounded-full border-2 text-sm font-black transition-colors"
              style={
                selected
                  ? {
                      backgroundColor: color,
                      borderColor: color,
                      color: "#fff",
                    }
                  : { borderColor: "#e3eee8", color: "#9bb3aa" }
              }
            >
              {step}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-bold">
        <span style={{ color: value !== undefined ? color : "#9bb3aa" }}>
          전혀 아니다
        </span>
        <span style={{ color: value !== undefined ? color : "#9bb3aa" }}>
          매우 그렇다
        </span>
      </div>
    </div>
  );
}

export default function EsgSurveySheet({
  questions,
  onComplete,
}: {
  questions: EsgSurveyQuestion[];
  onComplete: (answers: EsgSurveyAnswers) => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<EsgSurveyAnswers>({});

  const question = questions[questionIndex];
  const QuestionIcon = question.icon;
  const color = CATEGORY_COLOR[question.category];
  const selectedValue = answers[question.id];
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === questions.length - 1;

  const handlePrevious = () => {
    if (isFirstQuestion) {
      return;
    }

    setQuestionIndex((current) => current - 1);
  };

  const handleNext = () => {
    if (selectedValue === undefined) {
      return;
    }

    if (isLastQuestion) {
      onComplete(answers);
      return;
    }

    setQuestionIndex((current) => current + 1);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#f2faf6]">
      <div className="flex flex-1 flex-col justify-center px-5">
        <div className="ml-2.5 flex items-center gap-2">
          <span className="text-sm font-black" style={{ color }}>
            {question.categoryLabel}
          </span>
          <span className="text-sm font-bold text-[#9bb3aa]">
            {questionIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="mt-3 rounded-3xl bg-white p-6 shadow-sm shadow-emerald-950/5">
          <div
            className="grid size-12 place-items-center rounded-2xl"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <QuestionIcon className="size-6" />
          </div>

          <p className="mt-5 text-lg font-black leading-7 text-[#13261f]">
            {question.text}
          </p>

          <AnswerScale
            value={selectedValue}
            color={color}
            onSelect={(value) =>
              setAnswers((current) => ({ ...current, [question.id]: value }))
            }
          />
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {questions.map((q, index) => (
            <span
              key={q.id}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all ${
                index === questionIndex
                  ? "w-5 bg-[#1ba77d]"
                  : index < questionIndex
                    ? "w-1.5 bg-[#1ba77d]"
                    : "w-1.5 bg-[#d8e7e0]"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 pb-8">
        <div className="flex gap-3">
          {!isFirstQuestion ? (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex-1 rounded-2xl border-2 border-[#d8e7e0] px-6 py-4 text-base font-black text-[#5f7870]"
            >
              이전
            </button>
          ) : null}
          <button
            type="button"
            disabled={selectedValue === undefined}
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-[#1ba77d] px-6 py-4 text-base font-black text-white disabled:opacity-40"
          >
            {isLastQuestion ? "제출" : "다음"}
          </button>
        </div>
        <p className="mt-3 text-center text-xs font-bold text-[#9bb3aa]">
          응답은 ESG 자가진단 점수 산정에만 사용돼요
        </p>
      </div>
    </div>
  );
}

export type { EsgSurveyAnswers };
