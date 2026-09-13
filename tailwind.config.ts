import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nocturne dark night theme
        midnight: "#080B16",
        panel: "#0E1424",
        ink: "#E8ECF6",
        muted: "#8B93AB",
        hairline: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#5B7CFF", // electric indigo
          violet: "#8B5CF6",
        },
        up: "#34D399", // emerald, gains
        down: "#FB7185", // rose, losses
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        glass: "20px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(91,124,255,0.25)",
        "glow-lg": "0 0 80px rgba(91,124,255,0.30)",
        panel: "0 10px 40px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "accent-grad": "linear-gradient(135deg, #5B7CFF 0%, #8B5CF6 100%)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
