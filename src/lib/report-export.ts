import type { EvaluationResult } from "./evaluator";

export function buildMarkdownReport(result: EvaluationResult, sourceName: string) {
  const categoryRows = result.categories
    .map((category) => `| ${category.label} | ${category.score} | ${category.weight}% |`)
    .join("\n");
  const checks = result.categories
    .flatMap((category) =>
      category.checks.map(
        (check) =>
          `- **${category.label} / ${check.label}**: ${check.status.toUpperCase()} - ${check.evidence}`,
      ),
    )
    .join("\n");
  const recommendations = result.recommendations
    .map((recommendation) => `- ${recommendation}`)
    .join("\n");

  return `# Docs Quality Gate Report

Source: ${sourceName}
Mode: ${result.mode.toUpperCase()}
Score: ${result.score}/100
Verdict: ${result.verdict}
Generated: ${result.generatedAt}

${result.summary}

## Category Scores

| Category | Score | Weight |
| --- | ---: | ---: |
${categoryRows}

## Recommendations

${recommendations || "- No blocking recommendations."}

## Evidence

${checks}
`;
}

export function buildJsonReport(result: EvaluationResult, sourceName: string) {
  return JSON.stringify(
    {
      source: sourceName,
      ...result,
    },
    null,
    2,
  );
}
