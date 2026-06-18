"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ClipboardCheck,
  FileJson,
  FileText,
  Link as LinkIcon,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  conceptDocDemo,
  apiReferenceDemo,
  defaultPasteValue,
} from "@/lib/demo-samples";
import type { CheckStatus, EvaluationMode, EvaluationResult } from "@/lib/evaluator";
import { evaluateDocument } from "@/lib/evaluator";
import { buildJsonReport, buildMarkdownReport } from "@/lib/report-export";

type TabKey = "paste" | "concept" | "api";

const tabs: Array<{ key: TabKey; label: string; description: string }> = [
  {
    key: "paste",
    label: "Paste",
    description: "Analyze any draft.",
  },
  {
    key: "concept",
    label: "Concept Doc Demo",
    description: "Weak task page.",
  },
  {
    key: "api",
    label: "API Reference Demo",
    description: "Weak endpoint page.",
  },
];

const modeOptions: Array<{ key: EvaluationMode; label: string }> = [
  { key: "auto", label: "Auto" },
  { key: "docs", label: "Docs" },
  { key: "api", label: "API" },
];

const statusStyles: Record<CheckStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  fail: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusIcons: Record<CheckStatus, React.ReactNode> = {
  pass: <CheckCircle2 className="size-4" aria-hidden="true" />,
  warning: <AlertTriangle className="size-4" aria-hidden="true" />,
  fail: <AlertTriangle className="size-4" aria-hidden="true" />,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("concept");
  const [mode, setMode] = useState<EvaluationMode>("auto");
  const [draft, setDraft] = useState(defaultPasteValue);

  const sourceText = getSourceText(activeTab, draft);
  const sourceName = getSourceName(activeTab);
  const result = useMemo(
    () => evaluateDocument(sourceText, mode),
    [mode, sourceText],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f3ee] text-neutral-950">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold uppercase text-neutral-700">
              <ShieldCheck className="size-3.5 text-emerald-700" aria-hidden="true" />
              Client-side documentation quality gate
            </div>
            <h1 className="text-3xl font-semibold text-neutral-950 sm:text-4xl">
              Docs Quality Gate Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
              Paste a draft or run a demo to score structure, clarity, API readiness,
              completeness, and publication risk with transparent checks.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-[430px]">
            <MetricCard label="Mode" value={result.mode.toUpperCase()} />
            <MetricCard label="Checks" value={String(countChecks(result))} />
            <MetricCard label="Storage" value="None" />
          </div>
        </header>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(440px,0.9fr)_minmax(620px,1.1fr)]">
          <div className="min-w-0 rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="size-4 text-neutral-700" aria-hidden="true" />
                    Source
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Choose a demo or paste your own draft.
                  </p>
                </div>
                <ModeControl mode={mode} setMode={setMode} />
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-md border px-3 py-3 text-left transition ${
                      activeTab === tab.key
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-neutral-400"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span
                      className={`mt-1 block text-xs ${
                        activeTab === tab.key ? "text-neutral-200" : "text-neutral-500"
                      }`}
                    >
                      {tab.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <label
                htmlFor="source"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                {activeTab === "paste" ? "Editable source" : "Demo source"}
              </label>
              <textarea
                id="source"
                value={sourceText}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setActiveTab("paste");
                }}
                spellCheck={false}
                className="min-h-[500px] w-full max-w-full resize-y rounded-md border border-neutral-300 bg-[#fcfbf8] p-4 font-mono text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <ResultsHeader result={result} sourceName={sourceName} />
            <CategoryGrid result={result} />
            <Recommendations result={result} />
            <EvidenceMatrix result={result} />
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-neutral-200 py-5 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
          <p>Built by Luís Guedes da Silva</p>
          <div className="flex flex-wrap gap-3">
            <FooterLink href="https://github.com/luisjguedes" label="GitHub" icon={<LinkIcon className="size-4" />} />
            <FooterLink href="https://www.linkedin.com/in/luisjguedes/" label="LinkedIn" icon={<LinkIcon className="size-4" />} />
            <FooterLink href="https://luisjguedes.github.io/docs-portfolio/" label="Portfolio" icon={<LinkIcon className="size-4" />} />
          </div>
        </footer>
      </div>
    </main>
  );
}

function ModeControl({
  mode,
  setMode,
}: {
  mode: EvaluationMode;
  setMode: (mode: EvaluationMode) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-1">
      <SlidersHorizontal className="ml-2 size-4 text-neutral-500" aria-hidden="true" />
      {modeOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => setMode(option.key)}
          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
            mode === option.key
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-600 hover:text-neutral-950"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ResultsHeader({
  result,
  sourceName,
}: {
  result: EvaluationResult;
  sourceName: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex size-28 shrink-0 flex-col items-center justify-center rounded-lg border border-neutral-200 bg-[#fcfbf8]">
            <span className={scoreColor(result.score) + " text-4xl font-semibold"}>
              {result.score}
            </span>
            <span className="mt-1 text-xs font-semibold uppercase text-neutral-500">
              /100
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <VerdictBadge verdict={result.verdict} />
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                {sourceName}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-neutral-950">
              {result.verdict === "Ready"
                ? "Ready for final review"
                : result.verdict === "Needs Review"
                  ? "Useful draft, review required"
                  : "High-risk draft"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {result.summary}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton
            label="Markdown"
            icon={<ArrowDownToLine className="size-4" aria-hidden="true" />}
            onClick={() =>
              downloadReport(
                "docs-quality-gate-report.md",
                buildMarkdownReport(result, sourceName),
                "text/markdown",
              )
            }
          />
          <ExportButton
            label="JSON"
            icon={<FileJson className="size-4" aria-hidden="true" />}
            onClick={() =>
              downloadReport(
                "docs-quality-gate-report.json",
                buildJsonReport(result, sourceName),
                "application/json",
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

function CategoryGrid({ result }: { result: EvaluationResult }) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {result.categories.map((category) => (
        <div
          key={category.key}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-neutral-950">{category.label}</h3>
            <span className="text-sm font-semibold text-neutral-700">
              {category.score}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-neutral-100">
            <div
              className={`h-2 rounded-full ${barColor(category.score)}`}
              style={{ width: `${category.score}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Weight: {category.weight}% · Checks: {category.checks.length}
          </p>
        </div>
      ))}
    </div>
  );
}

function Recommendations({ result }: { result: EvaluationResult }) {
  const strengths = result.strengths.length ? result.strengths : ["No strengths yet. Add more complete content to unlock positive signals."];
  const recommendations = result.recommendations.length
    ? result.recommendations
    : ["No blocking recommendations. Keep final technical review in the workflow."];

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <CheckCircle2 className="size-4 text-emerald-700" aria-hidden="true" />
          Strengths
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          {strengths.map((strength) => (
            <li key={strength} className="rounded-md bg-emerald-50 px-3 py-2">
              {strength}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <ClipboardCheck className="size-4 text-amber-700" aria-hidden="true" />
          Recommended fixes
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          {recommendations.map((recommendation) => (
            <li key={recommendation} className="rounded-md bg-amber-50 px-3 py-2">
              {recommendation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EvidenceMatrix({ result }: { result: EvaluationResult }) {
  const rows = result.categories.flatMap((category) =>
    category.checks.map((check) => ({
      category: category.label,
      check,
    })),
  );

  return (
    <div className="min-w-0 rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 p-4">
        <h3 className="text-base font-semibold">Evidence matrix</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Each score is tied to a named check, visible evidence, and a review rationale.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Check</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Evidence</th>
              <th className="px-4 py-3 font-semibold">Why this matters</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map(({ category, check }) => (
              <tr key={check.id} className="align-top">
                <td className="px-4 py-4 font-medium text-neutral-700">{category}</td>
                <td className="px-4 py-4 text-neutral-950">{check.label}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyles[check.status]}`}
                  >
                    {statusIcons[check.status]}
                    {check.status}
                  </span>
                </td>
                <td className="max-w-sm px-4 py-4 leading-6 text-neutral-600">
                  {check.evidence}
                </td>
                <td className="max-w-sm px-4 py-4 leading-6 text-neutral-600">
                  {check.why}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-neutral-950">{value}</div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: EvaluationResult["verdict"] }) {
  const className =
    verdict === "Ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : verdict === "Needs Review"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${className}`}>
      {verdict}
    </span>
  );
}

function ExportButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-950 hover:text-neutral-950"
    >
      {icon}
      {label}
    </button>
  );
}

function FooterLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
    >
      {icon}
      {label}
    </a>
  );
}

function getSourceText(activeTab: TabKey, draft: string) {
  if (activeTab === "concept") {
    return conceptDocDemo;
  }

  if (activeTab === "api") {
    return apiReferenceDemo;
  }

  return draft;
}

function getSourceName(activeTab: TabKey) {
  if (activeTab === "concept") {
    return "Concept Doc Demo";
  }

  if (activeTab === "api") {
    return "API Reference Demo";
  }

  return "Pasted Draft";
}

function countChecks(result: EvaluationResult) {
  return result.categories.reduce(
    (total, category) => total + category.checks.length,
    0,
  );
}

function downloadReport(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function scoreColor(score: number) {
  if (score >= 82) {
    return "text-emerald-700";
  }

  if (score >= 55) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

function barColor(score: number) {
  if (score >= 82) {
    return "bg-emerald-600";
  }

  if (score >= 55) {
    return "bg-amber-500";
  }

  return "bg-rose-600";
}
