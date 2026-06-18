import { ImageResponse } from "next/og";

export const alt =
  "Docs Quality Gate Studio scorecards for structure, clarity, API readiness, and review risk.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f6f3ee",
          color: "#171717",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          padding: 56,
          width: "100%",
        }}
      >
        <div
          style={{
            border: "1px solid #d7d3ca",
            borderRadius: 18,
            display: "flex",
            flexDirection: "column",
            gap: 34,
            height: "100%",
            padding: 44,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                border: "1px solid #d7d3ca",
                borderRadius: 999,
                color: "#315f4d",
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0,
                padding: "10px 18px",
                textTransform: "uppercase",
              }}
            >
              Client-side documentation quality gate
            </div>
            <div style={{ color: "#66625b", display: "flex", fontSize: 24 }}>
              No AI API · No database
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                fontWeight: 800,
                letterSpacing: 0,
                lineHeight: 1,
                maxWidth: 780,
              }}
            >
              Docs Quality Gate Studio
            </div>
            <div
              style={{
                color: "#4b4741",
                display: "flex",
                fontSize: 34,
                lineHeight: 1.25,
                maxWidth: 880,
              }}
            >
              Score structure, clarity, API readiness, completeness, and
              publication risk with transparent checks.
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, marginTop: "auto" }}>
            {[
              ["Structure", "92"],
              ["Clarity", "86"],
              ["API readiness", "88"],
              ["Review risk", "Low"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ded9cf",
                  borderRadius: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "22px 24px",
                  width: 250,
                }}
              >
                <div
                  style={{
                    color: "#625e56",
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    color: "#171717",
                    display: "flex",
                    fontSize: 44,
                    fontWeight: 800,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
