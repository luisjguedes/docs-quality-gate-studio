import { describe, expect, it } from "vitest";
import { buildJsonReport, buildMarkdownReport } from "./report-export";
import { evaluateDocument } from "./evaluator";

const strongDocsSample = `# Configure routing rules

Use routing rules to send events to the correct workflow.

## Prerequisites

- You have administrator permissions.
- The destination workflow exists.
- The event topic has been validated.

## Steps

1. Open Settings > Event routing.
2. Select Create rule.
3. Enter a topic name.
4. Select the destination workflow.
5. Save the rule.

## Expected result

The rule appears in the routing table and new matching events are sent to the selected workflow.

## Example

\`\`\`json
{
  "topic": "payment.created",
  "workflow": "Billing intake"
}
\`\`\`

## Troubleshooting

If events do not arrive, verify the topic name and confirm the workflow is active.

Last reviewed: 2026-06-13.
`;

const weakDocsSample = `# Routing

This is simple. TODO add details.

Create a thing and save it. It always works and is robust.
`;

const apiSample = `# Create event

POST /v1/events

## Authentication

Use a bearer token.

## Parameters

- type: required event type.
- userId: required user identifier.

## Response

Returns 201 with the event ID.

## Errors

- 400 invalid request body.
- 401 missing token.

\`\`\`json
{
  "id": "evt_123"
}
\`\`\`
`;

describe("evaluateDocument", () => {
  it("returns a clear insufficient-content state for empty input", () => {
    const result = evaluateDocument("");

    expect(result.verdict).toBe("High Risk");
    expect(result.score).toBe(0);
    expect(result.recommendations[0]).toContain("Paste a complete draft");
  });

  it("scores a strong docs sample higher than a weak docs sample", () => {
    const strong = evaluateDocument(strongDocsSample, "docs");
    const weak = evaluateDocument(weakDocsSample, "docs");

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.verdict).not.toBe("High Risk");
  });

  it("triggers API-specific checks for API-like content", () => {
    const result = evaluateDocument(apiSample, "auto");
    const apiCategory = result.categories.find((category) => category.key === "api");

    expect(result.mode).toBe("api");
    expect(apiCategory?.weight).toBeGreaterThan(0);
    expect(apiCategory?.checks.some((check) => check.id === "endpoint-contract")).toBe(true);
  });

  it("downgrades readiness when TODOs or placeholders are present", () => {
    const clean = evaluateDocument(strongDocsSample, "docs");
    const withTodo = evaluateDocument(`${strongDocsSample}\n\nTODO: add migration caveats.`, "docs");

    expect(withTodo.score).toBeLessThan(clean.score);
    expect(withTodo.failedChecks.some((check) => check.id === "placeholder-risk")).toBe(true);
  });

  it("exports markdown and JSON reports with score, verdict, checks, and recommendations", () => {
    const result = evaluateDocument(weakDocsSample, "docs");
    const markdown = buildMarkdownReport(result, "Unit test");
    const json = buildJsonReport(result, "Unit test");

    expect(markdown).toContain("Score:");
    expect(markdown).toContain("Verdict:");
    expect(markdown).toContain("Recommendations");
    expect(markdown).toContain("Evidence");
    expect(json).toContain('"score"');
    expect(json).toContain('"verdict"');
    expect(json).toContain('"checks"');
    expect(json).toContain('"recommendations"');
  });
});
