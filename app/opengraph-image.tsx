import { ImageResponse } from "next/og";

export const alt = "Nocturne · the 24/7 AI trading agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview card, rendered at build/request time by next/og (Satori).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#080B16",
          backgroundImage:
            "radial-gradient(900px 520px at 80% 8%, rgba(139,92,246,0.30), rgba(8,11,22,0) 60%), radial-gradient(820px 520px at 6% 96%, rgba(91,124,255,0.24), rgba(8,11,22,0) 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "58px",
              height: "58px",
            }}
          >
            {/* midnight badge */}
            <div
              style={{
                position: "absolute",
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                backgroundColor: "#080B16",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
            {/* crescent moon: gradient disc minus a knockout */}
            <div
              style={{
                position: "absolute",
                left: "7px",
                top: "12px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #5B7CFF, #8B5CF6)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "4px",
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                backgroundColor: "#080B16",
              }}
            />
            {/* rising market line */}
            <div
              style={{
                position: "absolute",
                left: "16px",
                top: "38px",
                width: "34px",
                height: "3px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #5B7CFF, #8B5CF6)",
                transform: "rotate(-44deg)",
                transformOrigin: "left center",
              }}
            />
            {/* node */}
            <div
              style={{
                position: "absolute",
                left: "39px",
                top: "10px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #5B7CFF, #8B5CF6)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "30px",
              letterSpacing: "12px",
              color: "#E8ECF6",
              fontWeight: 700,
            }}
          >
            NOCTURNE
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              lineHeight: 1.04,
              fontWeight: 800,
              color: "#E8ECF6",
            }}
          >
            Markets never sleep.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              lineHeight: 1.04,
              fontWeight: 800,
              color: "#8FA2FF",
            }}
          >
            Now neither does your edge.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "22px",
              fontSize: "30px",
              color: "#8B93AB",
            }}
          >
            An autonomous AI agent trading tokenized US equities, 24/7.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.14)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "#E8ECF6",
              fontSize: "24px",
            }}
          >
            Bitget AI Base Camp · Hackathon S2
          </div>
          <div style={{ display: "flex", color: "#8B93AB", fontSize: "24px" }}>
            the 7×24 era · humans sleep, agents don&apos;t
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
