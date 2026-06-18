import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Docs Quality Gate Studio",
  description:
    "A client-side documentation quality gate for structure, clarity, API readiness, and review risk.",
  applicationName: "Docs Quality Gate Studio",
  authors: [{ name: "Luís Guedes da Silva", url: "https://luisjguedes.github.io/docs-portfolio/" }],
  keywords: [
    "documentation quality",
    "DocsOps",
    "technical writing",
    "API documentation",
    "documentation engineering",
    "quality gates",
  ],
  openGraph: {
    title: "Docs Quality Gate Studio",
    description:
      "A client-side documentation quality gate for structure, clarity, API readiness, and review risk.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docs Quality Gate Studio",
    description:
      "A client-side documentation quality gate for structure, clarity, API readiness, and review risk.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
