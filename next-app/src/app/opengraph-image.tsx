import { ImageResponse } from "next/og";

export const alt = "Wayne \u201CD22-soso\u201D Chiang \u2014 Esports Legacy & Casino Innovations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #000000 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              color: "#38bdf8",
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            D22-soso
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, color: "#f8fafc", fontWeight: 700, lineHeight: 1.05 }}>
            {"Wayne \u201CD22-soso\u201D Chiang"}
          </div>
          <div style={{ fontSize: 34, color: "#94a3b8", lineHeight: 1.3, maxWidth: 900 }}>
            First StarCraft: Brood War World Champion. Inventor of patented casino games.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#67e8f9",
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 999,
              padding: "10px 24px",
            }}
          >
            Esports Legacy
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#fcd34d",
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: 999,
              padding: "10px 24px",
            }}
          >
            Casino Innovations
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
