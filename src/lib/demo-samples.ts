export const conceptDocDemo = `# Configure event routing

Use event routing to send incoming events to the right workflow.

This is simple and robust. TODO: add screenshots.

## Steps

1. Open the routing page.
2. Create a rule.
3. Save it.

The system always sends the event correctly.

## Example

Choose the "payment" topic and select the Billing workflow.
`;

export const apiReferenceDemo = `# Create an event

POST /v1/events

Creates an event in the system.

## Request

Send JSON with event data.

\`\`\`json
{
  "type": "payment.created",
  "userId": "123"
}
\`\`\`

## Response

Returns 200 when it works.

TODO: add auth, errors, and all parameters.
`;

export const defaultPasteValue = `# Publish release notes

Use this checklist to prepare release notes for a minor product update.

## Prerequisites

- The release owner has confirmed the release scope.
- Engineering has validated fixed issues and known limitations.
- Product has approved customer-facing terminology.

## Steps

1. Review the changelog and group items by user impact.
2. Draft the summary with one sentence for each major capability.
3. Add upgrade notes for any behavior change.
4. Confirm screenshots and UI labels against the release candidate.
5. Send the draft for technical review.

## Expected result

The release notes explain what changed, who is affected, and what action users need to take.

## Known issues

- If a feature flag is still rolling out, mark the note as limited availability.
- If an issue affects only one region, include the region in the limitation.

Last reviewed: 2026-06-13.
`;
