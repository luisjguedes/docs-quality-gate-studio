export type EvaluationMode = "auto" | "docs" | "api";
export type ResolvedMode = Exclude<EvaluationMode, "auto">;
export type Verdict = "Ready" | "Needs Review" | "High Risk";
export type CheckStatus = "pass" | "warning" | "fail";
export type CategoryKey =
  | "structure"
  | "clarity"
  | "completeness"
  | "api"
  | "governance";

export type CheckResult = {
  id: string;
  label: string;
  status: CheckStatus;
  points: number;
  maxPoints: number;
  evidence: string;
  recommendation: string;
  why: string;
};

export type CategoryResult = {
  key: CategoryKey;
  label: string;
  score: number;
  weight: number;
  checks: CheckResult[];
};

export type EvaluationResult = {
  sourceLength: number;
  mode: ResolvedMode;
  score: number;
  verdict: Verdict;
  summary: string;
  categories: CategoryResult[];
  strengths: string[];
  recommendations: string[];
  failedChecks: CheckResult[];
  generatedAt: string;
};

type CheckInput = Omit<CheckResult, "status">;

type DocumentMetrics = {
  text: string;
  lines: string[];
  words: string[];
  sentences: string[];
  headings: string[];
  bulletLines: string[];
  numberedSteps: string[];
  codeFenceCount: number;
  endpointMentions: string[];
  hasOpenApiShape: boolean;
  hasAuth: boolean;
  hasParameters: boolean;
  hasResponses: boolean;
  hasErrors: boolean;
  hasExamples: boolean;
  hasPrerequisites: boolean;
  hasExpectedOutcome: boolean;
  hasTroubleshooting: boolean;
  hasSourceSignals: boolean;
  longSentences: number;
  vagueTerms: string[];
  placeholders: string[];
  unsupportedClaims: string[];
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  structure: "Structure",
  clarity: "Clarity",
  completeness: "Completeness",
  api: "API readiness",
  governance: "Governance",
};

const DOC_WEIGHTS: Record<CategoryKey, number> = {
  structure: 28,
  clarity: 24,
  completeness: 24,
  api: 0,
  governance: 24,
};

const API_WEIGHTS: Record<CategoryKey, number> = {
  structure: 18,
  clarity: 16,
  completeness: 16,
  api: 34,
  governance: 16,
};

const VAGUE_TERMS = [
  "easy",
  "simple",
  "robust",
  "seamless",
  "leverage",
  "stuff",
  "things",
  "obviously",
  "just",
  "etc",
];

const PLACEHOLDER_PATTERNS = [
  "todo",
  "tbd",
  "fixme",
  "lorem ipsum",
  "coming soon",
  "insert",
  "placeholder",
  "???",
];

const UNSUPPORTED_CLAIMS = [
  "always",
  "never",
  "guaranteed",
  "best-in-class",
  "fully secure",
  "zero risk",
  "perfect",
];

export function evaluateDocument(
  input: string,
  requestedMode: EvaluationMode = "auto",
): EvaluationResult {
  const metrics = getMetrics(input);
  const mode = resolveMode(metrics, requestedMode);

  if (metrics.words.length < 18) {
    return buildInsufficientResult(metrics, mode);
  }

  const weights = mode === "api" ? API_WEIGHTS : DOC_WEIGHTS;
  const categories = buildCategories(metrics, mode, weights);
  const weightedScore = categories.reduce((total, category) => {
    return total + (category.score * category.weight) / 100;
  }, 0);
  const score = clamp(Math.round(weightedScore), 0, 100);
  const failedChecks = categories
    .flatMap((category) => category.checks)
    .filter((check) => check.status !== "pass");
  const strengths = categories
    .filter((category) => category.weight > 0)
    .flatMap((category) => category.checks)
    .filter((check) => check.status === "pass")
    .slice(0, 6)
    .map((check) => check.label);
  const recommendations = failedChecks
    .map((check) => check.recommendation)
    .filter(Boolean)
    .slice(0, 8);

  return {
    sourceLength: metrics.text.length,
    mode,
    score,
    verdict: getVerdict(score, failedChecks),
    summary: getSummary(score, mode, failedChecks.length),
    categories,
    strengths,
    recommendations,
    failedChecks,
    generatedAt: new Date().toISOString(),
  };
}

function buildCategories(
  metrics: DocumentMetrics,
  mode: ResolvedMode,
  weights: Record<CategoryKey, number>,
): CategoryResult[] {
  const structure = [
    makeCheck({
      id: "heading-structure",
      label: "Uses scannable headings",
      points: metrics.headings.length >= 3 ? 10 : metrics.headings.length >= 1 ? 5 : 0,
      maxPoints: 10,
      evidence: `${metrics.headings.length} heading${plural(metrics.headings.length)} found.`,
      recommendation: "Add descriptive H2/H3 headings so reviewers can scan the document quickly.",
      why: "Headings expose the information architecture and make review faster.",
    }),
    makeCheck({
      id: "procedural-shape",
      label: "Includes steps or structured lists",
      points: metrics.numberedSteps.length >= 3 || metrics.bulletLines.length >= 4 ? 10 : metrics.bulletLines.length > 0 ? 5 : 0,
      maxPoints: 10,
      evidence: `${metrics.numberedSteps.length} numbered step${plural(metrics.numberedSteps.length)} and ${metrics.bulletLines.length} bullet line${plural(metrics.bulletLines.length)} found.`,
      recommendation: "Break dense prose into numbered steps, bullets, or tables where the reader must act.",
      why: "Structured lists reduce cognitive load and make missing requirements easier to spot.",
    }),
    makeCheck({
      id: "reader-entry",
      label: "Defines entry conditions",
      points: metrics.hasPrerequisites ? 8 : 0,
      maxPoints: 8,
      evidence: metrics.hasPrerequisites ? "Prerequisite or requirement language found." : "No prerequisite or requirement signal found.",
      recommendation: "Add prerequisites, permissions, inputs, or assumptions before the task starts.",
      why: "Readers need to know whether they are ready before following a procedure.",
    }),
    makeCheck({
      id: "success-state",
      label: "Defines expected outcome",
      points: metrics.hasExpectedOutcome ? 8 : 0,
      maxPoints: 8,
      evidence: metrics.hasExpectedOutcome ? "Expected result or success language found." : "No expected result signal found.",
      recommendation: "State the expected result, verification step, or success criteria.",
      why: "A clear success state helps users verify that the documentation worked.",
    }),
  ];

  const clarity = [
    makeCheck({
      id: "sentence-length",
      label: "Controls sentence length",
      points: metrics.longSentences === 0 ? 10 : metrics.longSentences <= 2 ? 6 : 2,
      maxPoints: 10,
      evidence: `${metrics.longSentences} sentence${plural(metrics.longSentences)} over 28 words.`,
      recommendation: "Shorten long sentences and split multiple instructions into separate lines.",
      why: "Shorter sentences are easier to translate, review, and follow under pressure.",
    }),
    makeCheck({
      id: "vague-language",
      label: "Avoids vague or filler terms",
      points: metrics.vagueTerms.length === 0 ? 10 : metrics.vagueTerms.length <= 3 ? 6 : 2,
      maxPoints: 10,
      evidence: metrics.vagueTerms.length ? `Flagged terms: ${unique(metrics.vagueTerms).join(", ")}.` : "No common vague terms found.",
      recommendation: "Replace vague terms with concrete behavior, inputs, constraints, or outcomes.",
      why: "Precise language lowers review ambiguity and prevents accidental overpromising.",
    }),
    makeCheck({
      id: "scannability",
      label: "Supports scanning",
      points: metrics.lines.length > 0 && metrics.bulletLines.length + metrics.headings.length >= 5 ? 8 : 4,
      maxPoints: 8,
      evidence: `${metrics.headings.length + metrics.bulletLines.length} scan aids found across ${metrics.lines.length} non-empty lines.`,
      recommendation: "Use headings, bullets, tables, or examples to make key information visible.",
      why: "Most technical readers scan before they commit to reading carefully.",
    }),
  ];

  const completeness = [
    makeCheck({
      id: "examples",
      label: "Includes examples",
      points: metrics.hasExamples || metrics.codeFenceCount > 0 ? 10 : 0,
      maxPoints: 10,
      evidence: metrics.hasExamples ? "Example language or code block found." : "No examples or code blocks found.",
      recommendation: "Add a realistic example, command, request, response, or configuration sample.",
      why: "Examples turn abstract guidance into something users can compare against their own work.",
    }),
    makeCheck({
      id: "edge-cases",
      label: "Covers failure modes",
      points: metrics.hasTroubleshooting || metrics.hasErrors ? 10 : 0,
      maxPoints: 10,
      evidence: metrics.hasTroubleshooting || metrics.hasErrors ? "Troubleshooting, error, or failure language found." : "No failure-mode signal found.",
      recommendation: "Add common errors, constraints, troubleshooting notes, or edge cases.",
      why: "Failure-mode coverage reduces support loops and improves trust in the content.",
    }),
    makeCheck({
      id: "source-context",
      label: "Provides context or source cues",
      points: metrics.hasSourceSignals ? 8 : 0,
      maxPoints: 8,
      evidence: metrics.hasSourceSignals ? "Source, version, owner, or review signal found." : "No source or review signal found.",
      recommendation: "Name the source, owner, version, review status, or last validated context.",
      why: "Traceability helps teams judge freshness and authority.",
    }),
  ];

  const api = [
    makeCheck({
      id: "endpoint-contract",
      label: "Identifies endpoints or operations",
      points: metrics.endpointMentions.length >= 2 || metrics.hasOpenApiShape ? 10 : metrics.endpointMentions.length === 1 ? 5 : 0,
      maxPoints: 10,
      evidence: `${metrics.endpointMentions.length} endpoint or operation signal${plural(metrics.endpointMentions.length)} found.`,
      recommendation: "Name each method and path, or include the relevant OpenAPI operation.",
      why: "API documentation needs a stable contract before readers can integrate.",
    }),
    makeCheck({
      id: "auth-and-parameters",
      label: "Documents auth and parameters",
      points: (metrics.hasAuth ? 5 : 0) + (metrics.hasParameters ? 5 : 0),
      maxPoints: 10,
      evidence: `Auth: ${yesNo(metrics.hasAuth)}. Parameters: ${yesNo(metrics.hasParameters)}.`,
      recommendation: "Add authentication requirements and parameter details with required/optional status.",
      why: "Auth and parameters are the first integration blockers for developers.",
    }),
    makeCheck({
      id: "responses-and-errors",
      label: "Documents responses and errors",
      points: (metrics.hasResponses ? 5 : 0) + (metrics.hasErrors ? 5 : 0),
      maxPoints: 10,
      evidence: `Responses: ${yesNo(metrics.hasResponses)}. Errors: ${yesNo(metrics.hasErrors)}.`,
      recommendation: "Document success responses, error responses, and the error model.",
      why: "Response and error details let developers build reliable handling paths.",
    }),
    makeCheck({
      id: "api-example",
      label: "Includes request or response examples",
      points: metrics.codeFenceCount > 0 || metrics.hasExamples ? 8 : 0,
      maxPoints: 8,
      evidence: `${metrics.codeFenceCount} fenced code block${plural(metrics.codeFenceCount)} found.`,
      recommendation: "Add copyable request and response examples.",
      why: "Examples help developers confirm payload shape without reverse-engineering prose.",
    }),
  ];

  const governance = [
    makeCheck({
      id: "placeholder-risk",
      label: "Contains no placeholders",
      points: metrics.placeholders.length === 0 ? 10 : metrics.placeholders.length <= 2 ? 4 : 0,
      maxPoints: 10,
      evidence: metrics.placeholders.length ? `Placeholders found: ${unique(metrics.placeholders).join(", ")}.` : "No TODO/TBD/placeholder markers found.",
      recommendation: "Resolve placeholders before publication or mark the page as draft-only.",
      why: "Placeholder text is a direct readiness risk and should block publication.",
    }),
    makeCheck({
      id: "claim-risk",
      label: "Avoids unsupported absolute claims",
      points: metrics.unsupportedClaims.length === 0 ? 8 : metrics.unsupportedClaims.length <= 2 ? 4 : 0,
      maxPoints: 8,
      evidence: metrics.unsupportedClaims.length ? `Claims flagged: ${unique(metrics.unsupportedClaims).join(", ")}.` : "No common absolute claims found.",
      recommendation: "Qualify absolute claims or back them with a source, limit, or test condition.",
      why: "Absolute claims increase legal, support, and trust risk when they are not proven.",
    }),
    makeCheck({
      id: "review-readiness",
      label: "Looks review-ready",
      points: metrics.headings.length > 0 && metrics.placeholders.length === 0 && metrics.words.length >= 80 ? 8 : 3,
      maxPoints: 8,
      evidence: `${metrics.words.length} words, ${metrics.headings.length} headings, ${metrics.placeholders.length} placeholder flags.`,
      recommendation: "Add enough structure and remove draft markers before requesting review.",
      why: "Reviewers need a stable artifact, not a rough scratchpad.",
    }),
  ];

  const categoryChecks: Record<CategoryKey, CheckResult[]> = {
    structure,
    clarity,
    completeness,
    api,
    governance,
  };

  return (Object.keys(categoryChecks) as CategoryKey[])
    .filter((key) => weights[key] > 0 || key === "api")
    .map((key) => {
      const checks = key === "api" && mode === "docs" ? api.map(downgradeApiCheck) : categoryChecks[key];
      const score = key === "api" && mode === "docs" ? 100 : scoreChecks(checks);

      return {
        key,
        label: CATEGORY_LABELS[key],
        score,
        weight: weights[key],
        checks,
      };
    });
}

function getMetrics(input: string): DocumentMetrics {
  const text = input.trim();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words = text.match(/\b[\w'-]+\b/g) ?? [];
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();
  const headings = lines.filter((line) => /^#{1,6}\s+\S/.test(line));
  const bulletLines = lines.filter((line) => /^[-*]\s+\S/.test(line));
  const numberedSteps = lines.filter((line) => /^\d+\.\s+\S/.test(line));
  const endpointMentions = text.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+\/[A-Za-z0-9_./:{}-]*/g) ?? [];
  const vagueTerms = findTerms(lower, VAGUE_TERMS);
  const placeholders = findTerms(lower, PLACEHOLDER_PATTERNS);
  const unsupportedClaims = findTerms(lower, UNSUPPORTED_CLAIMS);

  return {
    text,
    lines,
    words,
    sentences,
    headings,
    bulletLines,
    numberedSteps,
    codeFenceCount: (text.match(/```/g) ?? []).length / 2,
    endpointMentions,
    hasOpenApiShape: /openapi:\s*3|paths:\s*\n|^\s*(get|post|put|patch|delete):/im.test(text),
    hasAuth: /\bauth|authorization|bearer|api key|oauth|token\b/i.test(text),
    hasParameters: /\bparameter|query|path parameter|request body|field|required|optional\b/i.test(text),
    hasResponses: /\bresponse|status code|200|201|204|400|401|404|500\b/i.test(text),
    hasErrors: /\berror|failure|failed|invalid|troubleshoot|retry|timeout|4\d\d|5\d\d\b/i.test(text),
    hasExamples: /\bexample|sample|for example|request|response|curl\b/i.test(text),
    hasPrerequisites: /\bprerequisite|required|before you begin|requirement|permission|assumption\b/i.test(text),
    hasExpectedOutcome: /\bexpected result|result|success|verify|confirmation|you should see|done\b/i.test(text),
    hasTroubleshooting: /\btroubleshoot|known issue|edge case|limitation|if this fails|common issue\b/i.test(text),
    hasSourceSignals: /\bsource|owner|last reviewed|validated|version|reviewed|adr|changelog\b/i.test(text),
    longSentences: sentences.filter((sentence) => (sentence.match(/\b[\w'-]+\b/g) ?? []).length > 28).length,
    vagueTerms,
    placeholders,
    unsupportedClaims,
  };
}

function makeCheck(check: CheckInput): CheckResult {
  const ratio = check.maxPoints === 0 ? 1 : check.points / check.maxPoints;
  const status: CheckStatus = ratio >= 0.8 ? "pass" : ratio > 0 ? "warning" : "fail";

  return {
    ...check,
    points: clamp(check.points, 0, check.maxPoints),
    status,
  };
}

function downgradeApiCheck(check: CheckResult): CheckResult {
  return {
    ...check,
    status: "pass",
    points: check.maxPoints,
    evidence: "Not weighted in Docs mode.",
    recommendation: "",
  };
}

function scoreChecks(checks: CheckResult[]) {
  const points = checks.reduce((total, check) => total + check.points, 0);
  const max = checks.reduce((total, check) => total + check.maxPoints, 0);
  return max === 0 ? 100 : clamp(Math.round((points / max) * 100), 0, 100);
}

function resolveMode(metrics: DocumentMetrics, requestedMode: EvaluationMode): ResolvedMode {
  if (requestedMode !== "auto") {
    return requestedMode;
  }

  const apiSignals = [
    metrics.endpointMentions.length > 0,
    metrics.hasOpenApiShape,
    metrics.hasAuth && metrics.hasResponses,
    metrics.hasParameters && metrics.hasErrors,
  ].filter(Boolean).length;

  return apiSignals >= 2 ? "api" : "docs";
}

function buildInsufficientResult(
  metrics: DocumentMetrics,
  mode: ResolvedMode,
): EvaluationResult {
  const check = makeCheck({
    id: "insufficient-content",
    label: "Input has enough content to evaluate",
    points: 0,
    maxPoints: 10,
    evidence: `${metrics.words.length} word${plural(metrics.words.length)} found.`,
    recommendation: "Paste a complete draft, page section, or API reference before running the gate.",
    why: "A quality gate needs enough evidence to produce a fair report.",
  });
  const categories: CategoryResult[] = [
    {
      key: "structure",
      label: CATEGORY_LABELS.structure,
      score: 0,
      weight: 100,
      checks: [check],
    },
  ];

  return {
    sourceLength: metrics.text.length,
    mode,
    score: 0,
    verdict: "High Risk",
    summary: "Insufficient content for a meaningful documentation quality assessment.",
    categories,
    strengths: [],
    recommendations: [check.recommendation],
    failedChecks: [check],
    generatedAt: new Date().toISOString(),
  };
}

function getVerdict(score: number, failedChecks: CheckResult[]): Verdict {
  const hardFailures = failedChecks.filter((check) =>
    ["placeholder-risk", "insufficient-content"].includes(check.id),
  );

  if (score >= 82 && hardFailures.length === 0) {
    return "Ready";
  }

  if (score >= 55) {
    return "Needs Review";
  }

  return "High Risk";
}

function getSummary(score: number, mode: ResolvedMode, issueCount: number) {
  if (score >= 82 && issueCount === 0) {
    return `This ${mode === "api" ? "API reference" : "documentation"} looks ready for final technical review.`;
  }

  if (score >= 55) {
    return `This ${mode === "api" ? "API reference" : "documentation"} has a usable foundation, but the gate found ${issueCount} review item${plural(issueCount)}.`;
  }

  return `This ${mode === "api" ? "API reference" : "documentation"} needs structural work before it should enter publication review.`;
}

function findTerms(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function yesNo(value: boolean) {
  return value ? "yes" : "no";
}

function plural(count: number) {
  return count === 1 ? "" : "s";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
