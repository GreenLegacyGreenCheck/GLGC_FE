"use client";

import {
  ArrowRightIcon,
  CheckIcon,
  CoinIcon,
  SparkleIcon,
  WarningIcon,
} from "@/components/icons";
import type {
  DiagnosisReportData,
  EmissionTreeNode,
  GradeBand,
  TrendScenario,
} from "@/lib/report-data";
import { useState, type Ref } from "react";

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

// Reference scale showing where the current tCO₂e value falls across the
// grade bands (A~D) — used both at the KPI card (current grade in context)
// and the trend forecast (where each scenario would land).
function GradeBandScale({
  bands,
  currentTons,
}: {
  bands: GradeBand[];
  currentTons: number;
}) {
  const scaleMax = bands[bands.length - 1].maxTons;
  // Rendered worst-to-best so the best grade lands on the right — the
  // marker position is mirrored to match (100% - raw position).
  const markerPercent = 100 - Math.min((currentTons / scaleMax) * 100, 100);

  // Each label is centered under its own segment by construction (same
  // width math as the segment above it) instead of being evenly spaced
  // with flex justify-between, which drifted out of alignment whenever
  // the bands themselves weren't equal width.
  const orderedBands = [...bands].reverse();
  const segments = orderedBands.reduce<
    { band: GradeBand; widthPercent: number; leftPercent: number }[]
  >((acc, band) => {
    const widthPercent = ((band.maxTons - band.minTons) / scaleMax) * 100;
    const previous = acc[acc.length - 1];
    const leftPercent = previous
      ? previous.leftPercent + previous.widthPercent
      : 0;

    return [...acc, { band, widthPercent, leftPercent }];
  }, []);

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="flex h-6 w-full overflow-hidden rounded-full">
          {segments.map(({ band, widthPercent }) => (
            <div
              key={band.grade}
              className={`grid place-items-center ${band.colorClass}`}
              style={{ width: `${widthPercent}%` }}
            >
              <span className="text-xs font-black text-white">
                {band.grade}
              </span>
            </div>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
          style={{ left: `${markerPercent}%` }}
        />
      </div>
      <div className="relative mt-2 h-4 text-xs font-bold text-[#789b8c]">
        {segments.map(({ band, widthPercent, leftPercent }) => (
          <span
            key={band.grade}
            className="absolute -translate-x-1/2"
            style={{ left: `${leftPercent + widthPercent / 2}%` }}
          >
            {band.minTons}~{band.maxTons}
          </span>
        ))}
      </div>
    </div>
  );
}

// Visualizes where this business sits on the usage spectrum among peers —
// "동종업 상위 N%" used to be a text-only line; the marker position makes
// that comparison legible at a glance instead of requiring mental math.
function PercentileGauge({ percentile }: { percentile: number }) {
  const markerPercent = 100 - percentile;

  return (
    <div className="mt-4">
      <div className="relative h-3 w-full rounded-full bg-linear-to-r from-[#cfe9de] to-[#e0a23a]">
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
          style={{ left: `${markerPercent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-bold text-[#789b8c]">
        <span>적게 사용</span>
        <span>많이 사용</span>
      </div>
    </div>
  );
}

// Recursive cause-tree node: a labeled box, optionally branching into
// child causes below it (e.g. 전기 → 냉방기기/조명·기타). Built from plain
// borders/divs rather than SVG paths to match this page's existing
// no-charting-library convention.
function EmissionTreeNodeBox({
  node,
  emphasize,
}: {
  node: EmissionTreeNode;
  emphasize?: boolean;
}) {
  const children = node.children ?? [];

  return (
    <div className="inline-flex flex-col items-center">
      <div
        className={`min-w-22 rounded-xl border px-3 py-2 text-center ${
          emphasize
            ? "border-[#1ba77d] bg-[#eef8f3]"
            : "border-[#eef3f0] bg-white"
        }`}
      >
        <p className="text-sm font-black">{node.label}</p>
        <p className="text-xs font-bold text-[#789b8c]">{node.percentage}%</p>
      </div>

      {children.length ? (
        <div className="mt-3 flex flex-col items-center">
          <div aria-hidden="true" className="h-3 w-0.5 bg-[#d8e7e0]" />
          <div className="flex items-start gap-4">
            {children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === children.length - 1;

              return (
                <div
                  key={child.id}
                  className="relative flex flex-col items-center"
                >
                  {children.length > 1 ? (
                    // Each child draws its own half of the branch bar,
                    // anchored to ITS OWN center (50%) rather than a
                    // hardcoded pixel offset — a parent box that itself
                    // has children (e.g. 전기) ends up wider than a plain
                    // leaf box, so only a per-child, self-centered segment
                    // (extending into the shared gap-4 on the far side)
                    // stays attached regardless of that width.
                    <div
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 bg-[#d8e7e0]"
                      style={{
                        left: isFirst ? "50%" : "-1rem",
                        right: isLast ? "50%" : "-1rem",
                      }}
                    />
                  ) : null}
                  <div aria-hidden="true" className="h-3 w-0.5 bg-[#d8e7e0]" />
                  <EmissionTreeNodeBox node={child} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// One scenario ("현재 추세 유지 시" vs "추천 액션 적용 시") in the trend
// forecast — rendered twice side by side so the cost of inaction is
// visible right next to the upside of taking action.
function TrendScenarioCard({
  scenario,
  currentGrade,
  currentGradeColorClass,
}: {
  scenario: TrendScenario;
  currentGrade: string;
  currentGradeColorClass: string;
}) {
  return (
    <div
      className={`flex-1 rounded-2xl border p-4 ${
        scenario.isWarning
          ? "border-[#f1c9a6] bg-[#fdf3e4]"
          : "border-[#bfe9da] bg-[#eef8f3]"
      }`}
    >
      <p
        className={`flex items-center gap-1 text-xs font-black ${
          scenario.isWarning ? "text-[#9a5b1f]" : "text-[#0d5f4b]"
        }`}
      >
        {scenario.isWarning ? (
          <WarningIcon className="size-3.5" />
        ) : (
          <SparkleIcon className="size-5 text-[#0d5f4b]" />
        )}
        {scenario.label}
      </p>
      <p className="mt-2 text-xs font-bold text-[#789b8c]">
        {scenario.months}개월 후 예상
      </p>
      <div className="mt-3 flex items-center justify-center gap-3">
        <span
          className={`inline-grid size-9 place-items-center rounded-lg text-base font-black text-white ${currentGradeColorClass}`}
        >
          {currentGrade}
        </span>
        <ArrowRightIcon className="size-4 shrink-0 text-[#789b8c]" />
        <span
          className={`inline-grid size-9 place-items-center rounded-lg text-base font-black text-white ${scenario.projectedGradeColorClass}`}
        >
          {scenario.projectedGrade}
        </span>
      </div>
      <p className="mt-3 text-center text-lg font-black">
        {scenario.projectedTons}t
      </p>
    </div>
  );
}

type ReportViewProps = {
  report: DiagnosisReportData;
  address?: string;
  title?: string;
  ref?: Ref<HTMLDivElement>;
  aiActions?: import("@/context/diagnosis-context").AiAction[] | null;
};

// Full content of a single diagnosis report — every section a photo-based
// diagnosis produces (KPI, comparison, SHAP cause tree, month-over-month,
// trend forecast, before/after simulation, savings goal, cost savings,
// ESG score). Used both by the "today's diagnosis" report page and by the
// mypage history detail page, parameterized by which report data to show.
export default function ReportView({
  report,
  address,
  title = "탄소배출 진단 결과",
  ref,
  aiActions,
}: ReportViewProps) {
  const [selectedDegrees, setSelectedDegrees] = useState(2);

  const maxComparisonTons = Math.max(
    report.nationalAverageTons,
    report.industryAverageTons,
    report.ourUsageTons,
  );
  const selectedSimulation =
    report.simulationOptions.find(
      (option) => option.degrees === selectedDegrees,
    ) ?? report.simulationOptions[0];

  // Before/After 막대는 둘 중 큰 값을 100%로 기준 삼아 비례 높이로 그린다.
  const beforeAfterMax = Math.max(
    report.annualCo2Tons,
    selectedSimulation.projectedTons,
  );
  const beforeHeightPercent =
    beforeAfterMax > 0 ? (report.annualCo2Tons / beforeAfterMax) * 100 : 100;
  const afterHeightPercent =
    beforeAfterMax > 0
      ? (selectedSimulation.projectedTons / beforeAfterMax) * 100
      : 100;

  return (
    <div ref={ref} className="bg-[#f2faf6]">
      <p className="text-xl font-black">{title}</p>

      {address ? (
        <p className="mt-1 text-sm font-bold text-[#789b8c]">{address}</p>
      ) : null}

      <div className="mt-6 rounded-2xl bg-[#eef8f3] p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-black text-[#0d5f4b]">
          <SparkleIcon className="size-6 text-[#0d5f4b]" />
          AI 종합 의견
        </h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          AI가 이번 진단에서 가장 눈여겨본 한 줄 인사이트예요
        </p>
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
        <h2 className="text-sm font-black text-[#9a7a3f]">핵심 KPI</h2>
        <p className="mt-1 text-xs font-bold text-[#9a7a3f]">
          우리 가게의 연간 탄소 배출량과 등급을 한눈에 확인해요
        </p>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-[#9a7a3f]">연간 탄소 배출량</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#13261f]">
                {report.annualCo2Tons}
              </span>
              <span className="text-sm font-bold text-[#9a7a3f]">tCO₂e/년</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#9a7a3f]">에너지 등급</p>
            <span
              className={`mt-2 inline-grid size-11 place-items-center rounded-xl text-xl font-black text-white ${report.gradeColorClass}`}
            >
              {report.grade}
            </span>
          </div>
        </div>

        <GradeBandScale
          bands={report.gradeBands}
          currentTons={report.annualCo2Tons}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <h2 className="text-base font-black">평균 비교</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          같은 업종의 다른 가게들과 비교했을 때 우리 위치예요
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-bold text-[#789b8c]">
            {report.comparisonLabel}
          </p>
          <p
            className={`text-sm font-black ${
              report.comparisonPercent >= 0
                ? "text-[#c2802e]"
                : "text-[#1ba77d]"
            }`}
          >
            {report.comparisonPercent >= 0 ? "+" : "-"}
            {Math.abs(report.comparisonPercent)}%{" "}
            {report.comparisonPercent >= 0 ? "높음" : "낮음"}
          </p>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div className="flex flex-1 flex-col items-center">
            <div className="flex h-32 w-full max-w-14 items-end">
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
            <p className="text-xs font-bold text-[#789b8c]">전국 평균</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="flex h-32 w-full max-w-14 items-end">
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
            <p className="text-xs font-bold text-[#789b8c]">동종업 평균</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="flex h-32 w-full max-w-14 items-end">
              <div
                className="w-full rounded-t-lg bg-[#e0a23a]"
                style={{
                  height: `${(report.ourUsageTons / maxComparisonTons) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-base font-black">{report.ourUsageTons}</p>
            <p className="text-xs font-bold text-[#789b8c]">우리 가게</p>
          </div>
        </div>

        <p className="mt-5 text-xs font-bold text-[#789b8c]">
          업종 내 사용량 백분위
        </p>
        <PercentileGauge percentile={report.percentile} />

        <div
          className={`mt-4 flex items-start gap-2 rounded-2xl p-3 ${
            report.zScore >= 0 ? "bg-[#fbe7c8]" : "bg-[#eef8f3]"
          }`}
        >
          {report.zScore >= 0 ? (
            <WarningIcon className="size-4 shrink-0 text-[#9a5b1f]" />
          ) : (
            <CheckIcon className="size-4 shrink-0 text-[#0d5f4b]" />
          )}
          <p
            className={`text-sm font-bold ${
              report.zScore >= 0 ? "text-[#9a5b1f]" : "text-[#0d5f4b]"
            }`}
          >
            Z-score {report.zScore >= 0 ? "+" : ""}
            {report.zScore} — {report.percentileMessage}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <h2 className="text-base font-black">에너지원별 배출량</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          전기·가스 등 에너지원별로 배출 비중이 어떻게 나뉘는지 보여줘요
        </p>
        <div className="mt-4 space-y-4">
          {report.energyBreakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm font-black">
                <span className="inline-flex items-center gap-1.5">
                  <item.icon className={`size-4 ${item.iconColorClass}`} />
                  {item.label}
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
        <h2 className="text-base font-black">원인 분석 (SHAP)</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          SHAP 분석 기반 · 탄소 배출 증가의 주요 원인을 트리로 보여줘요
        </p>

        <div className="mt-5 flex justify-center overflow-x-auto pb-1">
          <EmissionTreeNodeBox node={report.emissionTree} emphasize />
        </div>

        <div className="mt-5 rounded-2xl bg-[#f2f6f3] p-3">
          <p className="text-xs font-black text-[#789b8c]">AI 분석 근거</p>
          <ul className="mt-2 space-y-1.5">
            {report.aiEvidenceBullets.map((bullet) => (
              <li
                key={bullet.text}
                className={`flex items-start gap-1.5 text-sm font-bold ${
                  bullet.isPositive ? "text-[#0d5f4b]" : "text-[#9a5b1f]"
                }`}
              >
                <CheckIcon className="mt-0.5 size-3.5 shrink-0" />
                {bullet.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 border-t border-[#eef3f0] pt-4">
          <p className="text-xs font-bold text-[#789b8c]">순위별 상세 보기</p>
          <div className="mt-3 space-y-3">
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
      </div>

      {report.monthOverMonth.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
          <h2 className="text-base font-black">전월 비교</h2>
          <p className="mt-1 text-xs font-bold text-[#789b8c]">
            지난달과 비교해 사용량이 어떻게 달라졌는지 보여줘요
          </p>
          <div className="mt-4 divide-y divide-[#eef3f0]">
            {report.monthOverMonth.map((metric) => (
              <div key={metric.label} className="py-4 first:pt-0 last:pb-0">
                <p className="flex items-center gap-1.5 text-sm font-black">
                  <metric.icon className={`size-4 ${metric.iconColorClass}`} />
                  {metric.label}
                </p>

                <div
                  className={`mt-3 overflow-hidden rounded-2xl border ${metric.accentBorderClass}`}
                >
                  <div className="flex items-center px-4 py-4">
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold text-[#789b8c]">지난달</p>
                      <p className="mt-1 text-3xl font-black">
                        {metric.previousValue}
                      </p>
                      <p className="text-xs font-bold text-[#789b8c]">
                        {metric.unit}
                      </p>
                    </div>
                    <div className="flex h-14 flex-col items-center justify-center gap-1">
                      <div
                        aria-hidden="true"
                        className="h-4 w-px bg-[#d8e7e0]"
                      />
                      <span
                        aria-hidden="true"
                        className="text-[#789b8c]"
                      ></span>
                      <div
                        aria-hidden="true"
                        className="h-4 w-px bg-[#d8e7e0]"
                      />
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs font-bold text-[#789b8c]">이번달</p>
                      <p
                        className={`mt-1 text-3xl font-black ${metric.accentTextClass}`}
                      >
                        {metric.currentValue}
                      </p>
                      <p className="text-xs font-bold text-[#789b8c]">
                        {metric.unit}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-3 text-center text-base font-black text-white ${metric.accentBgClass}`}
                  >
                    {metric.isIncrease ? "▲" : "▼"} {metric.percentChange}%{" "}
                    {metric.isIncrease ? "증가" : "감소"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <h2 className="text-base font-black">추세 예측</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          지금처럼 두면 vs 추천 액션을 적용하면,{" "}
          {report.trendScenarios[0].months}
          개월 후 예상되는 모습이에요
        </p>

        <div className="mt-4 flex gap-3">
          {report.trendScenarios.map((scenario) => (
            <TrendScenarioCard
              key={scenario.label}
              scenario={scenario}
              currentGrade={report.grade}
              currentGradeColorClass={report.gradeColorClass}
            />
          ))}
        </div>

        <p className="mt-5 text-xs font-bold text-[#789b8c]">
          탄소 등급 기준표
        </p>
        <GradeBandScale
          bands={report.gradeBands}
          currentTons={report.annualCo2Tons}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <h2 className="text-base font-black">개선 후 모습 (Before / After)</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          {report.simulationLabel} 탄소 배출량이 어떻게 달라지는지 바로
          비교해보세요
        </p>

        {aiActions?.[0]?.scenario ? (
          <div className="mt-3 rounded-xl bg-[#e8f7f0] p-3">
            <p className="text-xs font-black text-[#1ba77d]">
              💡 {aiActions[0].title} 실행 시 AI 예측
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-bold text-[#789b8c]">현재</p>
                <p className="mt-0.5 text-xs font-bold text-[#13261f] leading-relaxed">
                  {aiActions[0].scenario.beforeText}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#1ba77d]">개선 후</p>
                <p className="mt-0.5 text-xs font-bold text-[#13261f] leading-relaxed">
                  {aiActions[0].scenario.afterText}
                </p>
              </div>
            </div>
          </div>
        ) : null}

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

        {(() => {
          const aiScenario = aiActions?.[0]?.scenario;
          const aiProjected = aiScenario?.projectedTons ?? null;
          const aiPct = aiScenario?.percentReduction ?? null;
          const afterTons = aiProjected ?? selectedSimulation.projectedTons;
          const pctLabel =
            aiPct != null
              ? `-${aiPct.toFixed(1)}%`
              : `${selectedSimulation.percentChange}%`;
          const maxTons = Math.max(report.annualCo2Tons, afterTons);
          const bH = Math.round((report.annualCo2Tons / maxTons) * 100);
          const aH = Math.round((afterTons / maxTons) * 100);
          return (
            <>
              <div className="mt-5 flex items-end gap-4">
                <div className="flex flex-1 flex-col items-center">
                  <div className="flex h-28 w-full max-w-16 items-end">
                    <div
                      className="w-full rounded-t-lg bg-[#e0a23a]"
                      style={{ height: `${bH}%` }}
                    />
                  </div>
                  <p className="mt-2 text-lg font-black">
                    {report.annualCo2Tons}t
                  </p>
                  <p className="text-xs font-bold text-[#789b8c]">Before</p>
                </div>
                <span aria-hidden="true" className="pb-9 text-[#789b8c]"></span>
                <div className="flex flex-1 flex-col items-center">
                  <div className="flex h-28 w-full max-w-16 items-end">
                    <div
                      className="w-full rounded-t-lg bg-[#1ba77d]"
                      style={{ height: `${aH}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <p className="text-lg font-black text-[#1ba77d]">
                      {afterTons.toFixed(2)}t
                    </p>
                    {aiProjected != null && (
                      <span className="rounded-full bg-[#1ba77d] px-1.5 py-0.5 text-[10px] font-black text-white">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#789b8c]">After</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-[#eef8f3] py-3 text-center">
                <span className="text-2xl font-black text-[#1ba77d]">
                  {pctLabel}
                </span>
                {aiPct != null && (
                  <span className="ml-2 rounded-full bg-[#1ba77d] px-2 py-0.5 text-[10px] font-black text-white align-middle">
                    AI 추론
                  </span>
                )}
              </div>
            </>
          );
        })()}
      </div>

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <h2 className="text-base font-black">절감 목표</h2>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          올해 목표 대비 현재 진행 상황이에요
        </p>

        {aiActions?.[0]?.scenario?.reductionGoalText ? (
          <div className="mt-3 rounded-xl bg-[#e8f7f0] p-3">
            <p className="text-xs font-black text-[#1ba77d]">
              💡 {aiActions[0].title} 실행 시 AI 예측
            </p>
            <p className="mt-1 text-xs font-bold text-[#13261f]">
              {aiActions[0].scenario!.reductionGoalText}
            </p>
            {aiActions[0].scenario!.evidenceText ? (
              <p className="mt-1 text-xs font-bold text-[#4a7a6a] leading-relaxed">
                {aiActions[0].scenario!.evidenceText}
              </p>
            ) : null}
          </div>
        ) : null}

        {(() => {
          const aiProjected = aiActions?.[0]?.scenario?.projectedTons ?? null;
          const targetTons = aiProjected ?? report.goal.targetTons;
          const reduction = report.goal.currentTons - targetTons;
          const progressPct =
            aiProjected != null
              ? Math.max(
                  0,
                  Math.round((reduction / report.goal.currentTons) * 100),
                )
              : report.goal.progressPercent;
          return (
            <>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#789b8c]">현재</p>
                  <p className="mt-1 text-3xl font-black">
                    {report.goal.currentTons}t
                  </p>
                </div>
                <div className="mt-4 flex flex-1 items-center justify-center">
                  <ArrowRightIcon className="size-6 text-[#9bb3aa]" />
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <p className="text-xs font-bold text-[#789b8c]">목표</p>
                    {aiProjected != null && (
                      <span className="rounded-full bg-[#1ba77d] px-1.5 py-0.5 text-[10px] font-black text-white">
                        AI 추론
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-3xl font-black text-[#1ba77d]">
                    {targetTons.toFixed(2)}t
                  </p>
                </div>
              </div>
              <div className="mt-5 h-3 w-full rounded-full bg-[#eef3f0]">
                <div
                  className="h-full rounded-full bg-[#1ba77d]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs font-bold text-[#789b8c]">
                  {aiProjected != null
                    ? "이 액션으로 달성 가능한 절감률"
                    : "현재 진행률"}
                </p>
                <p className="text-xl font-black text-[#1ba77d]">
                  {progressPct}%
                </p>
              </div>
            </>
          );
        })()}
      </div>

      <div className="mt-6 rounded-2xl border border-[#eef3f0] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black">절감 비용</h2>
          <span className="rounded-full bg-[#f2f6f3] px-3 py-1 text-xs font-black text-[#789b8c]">
            추정치
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-[#789b8c]">
          절감을 통해 아낄 수 있는 예상 비용이에요 · {report.costSavings.label}
        </p>

        {aiActions?.[0]?.scenario?.costSavingText ? (
          <div className="mt-3 rounded-xl bg-[#e8f7f0] p-3">
            <p className="text-xs font-black text-[#1ba77d]">
              💡 {aiActions[0].title} 실행 시 AI 예측
            </p>
            <p className="mt-1 text-xs font-bold text-[#13261f]">
              {aiActions[0].scenario!.costSavingText}
            </p>
          </div>
        ) : null}

        {(() => {
          const sc = aiActions?.[0]?.scenario ?? null;
          const toMan = (won: number) => `${Math.round(won / 10000)}만원`;
          const hasAiCost =
            sc?.currentAnnualCostWon != null &&
            sc?.projectedAnnualCostWon != null;
          const currentLabel = hasAiCost
            ? toMan(sc!.currentAnnualCostWon!)
            : report.costSavings.currentAnnualCostLabel;
          const projectedLabel = hasAiCost
            ? toMan(sc!.projectedAnnualCostWon!)
            : report.costSavings.projectedAnnualCostLabel;
          const savingsWon =
            sc?.annualSavingsWon ??
            (sc?.estimatedMonthlySavingsWon != null
              ? sc.estimatedMonthlySavingsWon * 12
              : null);
          const savingsLabel =
            savingsWon != null
              ? `연간 약 ${toMan(savingsWon)} 절감 (AI 추론)`
              : report.costSavings.annualSavingsLabel;
          return (
            <>
              <div className="mt-4 flex items-center rounded-2xl bg-[#f2f6f3] py-4">
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs font-bold text-[#789b8c]">현재</p>
                    {hasAiCost && (
                      <span className="rounded-full bg-[#789b8c] px-1.5 py-0.5 text-[10px] font-black text-white">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-black">{currentLabel}</p>
                  <p className="text-xs font-bold text-[#789b8c]">/ 년</p>
                </div>
                <div aria-hidden="true" className="h-12 w-px bg-[#d8e7e0]" />
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs font-bold text-[#789b8c]">
                      절감 후 예상
                    </p>
                    {hasAiCost && (
                      <span className="rounded-full bg-[#1ba77d] px-1.5 py-0.5 text-[10px] font-black text-white">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-black text-[#1ba77d]">
                    {projectedLabel}
                  </p>
                  <p className="text-xs font-bold text-[#789b8c]">/ 년</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-[#eef8f3] px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-black text-[#0d5f4b]">
                  <CoinIcon className="size-4 text-[#caa233]" />
                  {savingsLabel}
                </p>
                {sc?.costEvidenceText ? (
                  <p className="mt-1 text-xs font-bold text-[#4a7a6a]">
                    {sc.costEvidenceText}
                  </p>
                ) : null}
              </div>
            </>
          );
        })()}
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
    </div>
  );
}
