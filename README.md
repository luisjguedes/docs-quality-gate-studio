# Docs Quality Gate Studio

A Vercel-ready Next.js app that runs a transparent, client-side documentation quality gate for structure, clarity, API readiness, completeness, and review risk.

Live app: https://docs-quality-gate-studio.vercel.app/

The app does not use AI APIs, tokens, databases, analytics, login, or saved evaluations. It is designed as a serious interactive product demo for DocsOps and API documentation judgment.

## What it does

- Scores pasted documentation or built-in demo samples from 0-100.
- Produces a verdict: `Ready`, `Needs Review`, or `High Risk`.
- Shows category scores and a full evidence matrix.
- Explains why each check matters.
- Exports Markdown and JSON reports in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Validate

```bash
npm run lint
npm run test
npm run build
```

Or run the full local gate:

```bash
npm run verify
```

## Deployment

Deploy directly to Vercel as a standard Next.js App Router project.

Recommended repository description:

```text
A client-side documentation quality gate for structure, clarity, API readiness, and review risk.
```

Vercel setup:

1. Import the GitHub repository into Vercel.
2. Keep the default Next.js framework settings.
3. Use `npm run build` as the build command.
4. No environment variables are required.

Optional:

- Set `NEXT_PUBLIC_SITE_URL` to your production URL if you use a custom domain. Vercel deployment URLs are detected automatically.

## LinkedIn launch note

Suggested post:

```text
I built Docs Quality Gate Studio: a client-side documentation quality gate for structure, clarity, API readiness, and review risk.

It uses deterministic checks, not an AI API, so every score is tied to visible evidence and a review rationale.

Try it with the built-in docs/API demos or paste a draft to see the scorecard.
```
