"use client";

import BottomNavigation from "@/components/BottomNavigation";
import { useDiagnosis } from "@/context/diagnosis-context";
import { DUMMY_REPORT } from "@/lib/report-data";
import { downloadReportPdf } from "@/lib/report-pdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.6"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
    </svg>
  );
}

function ScoreRing({ score, colorHex }: { score: number; colorHex: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative grid size-18 place-items-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 72 72"
        width={72}
        height={72}
        className="absolute inset-0 size-18 -rotate-90"
      >
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#eef3f0"
          strokeWidth="7"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={colorHex}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-lg font-black">{score}</span>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { address, electricFile, result } = useDiagnosis();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDegrees, setSelectedDegrees] = useState(2);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!electricFile || !result) {
      router.replace("/upload");
    }
  }, [electricFile, result, router]);

  if (!result) {
    return null;
  }

  const report = DUMMY_REPORT;
  const maxComparisonTons = Math.max(
    report.nationalAverageTons,
    report.industryAverageTons,
    report.ourUsageTons,
  );
  const selectedSimulation =
    report.simulationOptions.find(
      (option) => option.degrees === selectedDegrees,
    ) ?? report.simulationOptions[0];

  const handleDownload = async () => {
    if (!reportRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      await downloadReportPdf(reportRef.current);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="scrollbar-hidden h-screen overflow-y-auto overscroll-contain pb-32 sm:h-full">
        <header className="bg-[#f2faf6] pt-8 sticky top-0 z-10">
          <div className="flex items-center justify-between px-5 pb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/user-type"
                className="grid size-10 place-items-center rounded-full border border-[#c9eee4] bg-white text-[#13261f]"
                aria-label="사용자 유형 확인으로 돌아가기"
              >
                <ChevronLeftIcon />
              </Link>
              <h1 className="text-xl font-black ml-3">탄소배출 진단 결과</h1>
            </div>
            <span className="text-lg font-black mr-4 text-[#78a091]">3/3</span>
          </div>
          <div className="h-1 bg-[#d8f2ea]">
            <div className="h-full w-full bg-[#1ba77d]" />
          </div>
        </header>

        <section className="px-5 pb-7 pt-8">
          <div ref={reportRef} className="bg-[#f2faf6]">
            <p className="text-xl font-black">탄소배출 진단 결과</p>

            {address ? (
              <p className="mt-1 text-sm font-bold text-[#789b8c]">{address}</p>
            ) : null}

            <div className="mt-6 rounded-2xl bg-[#eef8f3] p-5">
              <h2 className="text-sm font-black text-[#0d5f4b]">
                ✨ AI 종합 의견
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#13261f]">
                {report.aiSummary.map((part, index) => (
                  <span
                    key={index}
                    className={
                      part.emphasis ? "font-black text-[#1ba77d]" : undefined
                    }
                  >
                    {part.text}
                  </span>
                ))}
              </p>
            </div>

            <div className="mt-4 rounded-3xl bg-[#fdf3e4] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[#9a7a3f]">
                    연간 탄소 배출량
                  </p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#13261f]">
                      {report.annualCo2Tons}
                    </span>
                    <span className="text-sm font-bold text-[#9a7a3f]">
                      tCO₂e/년
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#9a7a3f]">
                    에너지 등급
                  </p>
                  <span
                    className={`mt-2 inline-grid size-11 place-items-center rounded-xl text-xl font-black text-white ${report.gradeColorClass}`}
                  >
                    {report.grade}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-[#f1dfb9] pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#789b8c]">
                    {report.comparisonLabel}
                  </p>
                  <p className="text-sm font-black text-[#c2802e]">
                    +{report.comparisonPercent}% 높음
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-32 w-12 items-end">
                      <div
                        className="w-full rounded-t-lg bg-[#cfe9de]"
                        style={{
                          height: `${(report.nationalAverageTons / maxComparisonTons) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-base font-black">
                      {report.nationalAverageTons}
                    </p>
                    <p className="text-xs font-bold text-[#789b8c]">
                      전국 평균
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex h-32 w-12 items-end">
                      <div
                        className="w-full rounded-t-lg bg-[#cfe0f5]"
                        style={{
                          height: `${(report.industryAverageTons / maxComparisonTons) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-base font-black">
                      {report.industryAverageTons}
                    </p>
                    <p className="text-xs font-bold text-[#789b8c]">
                      동종업 평균
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex h-32 w-12 items-end">
                      <div
                        className="w-full rounded-t-lg bg-[#e0a23a]"
                        style={{
                          height: `${(report.ourUsageTons / maxComparisonTons) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-base font-black">
                      {report.ourUsageTons}
                    </p>
                    <p className="text-xs font-bold text-[#789b8c]">
                      우리 가게
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#fbe7c8] p-3">
                  <span aria-hidden="true">⚠️</span>
                  <p className="text-sm font-bold text-[#9a5b1f]">
                    Z-score +{report.zScore} — {report.percentileMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">에너지원별 배출량</h2>
              <div className="mt-4 space-y-4">
                {report.energyBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>
                        {item.icon} {item.label}
                      </span>
                      <span>
                        {item.co2Tons} tCO₂e ({item.percentage}%)
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full rounded-full bg-[#eef3f0]">
                      <div
                        className={`h-full rounded-full ${item.barColorClass}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">주요 배출 원인 분석</h2>
              <p className="mt-1 text-xs font-bold text-[#789b8c]">
                SHAP 분석 기반 · 탄소배출 증가 주요 원인
              </p>
              <div className="mt-4 space-y-3">
                {report.emissionCauses.map((cause) => (
                  <div
                    key={cause.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eef3f0] text-xs font-black text-[#789b8c]">
                        {cause.rank}
                      </span>
                      <span className="text-sm font-bold">{cause.label}</span>
                    </div>
                    <span className="text-sm font-black text-[#c2802e]">
                      +{cause.percentChange}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">이번 달 vs 지난 달 변화</h2>
              <div className="mt-4 space-y-4">
                {report.monthOverMonth.map((metric) => (
                  <div key={metric.label}>
                    <p className="text-sm font-bold text-[#789b8c]">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-base font-black">
                      {metric.previousValue} → {metric.currentValue}
                      {metric.unit}
                    </p>
                    <p
                      className={`mt-1 text-sm font-black ${
                        metric.isIncrease ? "text-[#c2802e]" : "text-[#1ba77d]"
                      }`}
                    >
                      {metric.isIncrease ? "▲" : "▼"} {metric.percentChange}%{" "}
                      {metric.isIncrease ? "증가" : "감소"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">탄소 절감 목표</h2>
              <p className="mt-1 text-xs font-bold text-[#789b8c]">올해 목표</p>
              <div className="mt-3 flex items-center gap-4">
                <p className="text-xl font-black">{report.goal.currentTons}t</p>
                <span aria-hidden="true" className="text-[#789b8c]">
                  →
                </span>
                <p className="text-xl font-black text-[#1ba77d]">
                  {report.goal.targetTons}t
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2.5 flex-1 rounded-full bg-[#eef3f0]">
                  <div
                    className="h-full rounded-full bg-[#1ba77d]"
                    style={{ width: `${report.goal.progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-black text-[#1ba77d]">
                  {report.goal.progressPercent}%
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-[#789b8c]">
                현재 진행률
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">감축 시뮬레이션</h2>
              <p className="mt-1 text-xs font-bold text-[#789b8c]">
                {report.simulationLabel} 탄소 배출량이 어떻게 달라지는지
                확인해보세요
              </p>

              <div className="mt-4 flex gap-2">
                {report.simulationOptions.map((option) => (
                  <button
                    key={option.degrees}
                    type="button"
                    aria-pressed={selectedDegrees === option.degrees}
                    onClick={() => setSelectedDegrees(option.degrees)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-black ${
                      selectedDegrees === option.degrees
                        ? "bg-[#1ba77d] text-white"
                        : "bg-[#eef3f0] text-[#789b8c]"
                    }`}
                  >
                    {option.degrees}도
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 text-center">
                <div>
                  <p className="text-xs font-bold text-[#789b8c]">현재</p>
                  <p className="text-xl font-black">{report.annualCo2Tons}t</p>
                </div>
                <span aria-hidden="true" className="text-[#789b8c]">
                  →
                </span>
                <div>
                  <p className="text-xs font-bold text-[#789b8c]">예상</p>
                  <p className="text-xl font-black text-[#1ba77d]">
                    {selectedSimulation.projectedTons}t
                  </p>
                </div>
                <span className="text-sm font-black text-[#1ba77d]">
                  {selectedSimulation.percentChange}%
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
              <h2 className="text-base font-black">예상 절감 비용</h2>
              <p className="mt-1 text-xs font-bold text-[#789b8c]">
                {report.costSavings.label}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div>
                  <p className="text-xs font-bold text-[#789b8c]">현재</p>
                  <p className="text-lg font-black">
                    {report.costSavings.currentAnnualCostLabel}
                  </p>
                </div>
                <span aria-hidden="true" className="text-[#789b8c]">
                  →
                </span>
                <div>
                  <p className="text-xs font-bold text-[#789b8c]">예상</p>
                  <p className="text-lg font-black text-[#1ba77d]">
                    {report.costSavings.projectedAnnualCostLabel}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-black text-[#1ba77d]">
                {report.costSavings.annualSavingsLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
            <h2 className="text-base font-black">탄소 등급 변화 예측</h2>
            <div className="mt-4 flex items-center justify-center gap-5">
              <div className="text-center">
                <span
                  className={`inline-grid size-11 place-items-center rounded-xl text-xl font-black text-white ${report.gradePrediction.currentGradeColorClass}`}
                >
                  {report.gradePrediction.currentGrade}
                </span>
                <p className="mt-2 text-xs font-bold text-[#789b8c]">현재</p>
              </div>
              <span aria-hidden="true" className="text-[#789b8c]">
                →
              </span>
              <div className="text-center">
                <span
                  className={`inline-grid size-11 place-items-center rounded-xl text-xl font-black text-white ${report.gradePrediction.projectedGradeColorClass}`}
                >
                  {report.gradePrediction.projectedGrade}
                </span>
                <p className="mt-2 text-xs font-bold text-[#789b8c]">
                  추천 적용 시
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">ESG 자가진단 점수</h2>
              <span className="rounded-full bg-[#fbe7c8] px-3 py-1 text-xs font-black text-[#9a5b1f]">
                {report.esgStatusLabel}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {report.esgScores.map((esg) => (
                <div key={esg.label} className="flex flex-col items-center">
                  <ScoreRing score={esg.score} colorHex={esg.ringColorHex} />
                  <p className="mt-2 text-sm font-bold text-[#789b8c]">
                    {esg.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="mt-8 w-full rounded-2xl bg-[#1ba77d] px-6 py-5 text-xl font-black text-white disabled:opacity-60"
          >
            {isDownloading ? "PDF 생성 중..." : "리포트 PDF 다운로드 ⬇"}
          </button>

          <Link
            href="/actions"
            className="mt-3 block w-full rounded-2xl border-2 border-[#1ba77d] bg-white px-6 py-5 text-center text-xl font-black text-[#1ba77d]"
          >
            감축 액션 추천 보기 →
          </Link>
        </section>
      </div>

      <BottomNavigation activeLabel="진단 리포트" />
    </>
  );
}
