import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F1117",
        surface: "#121721",
        surfaceMuted: "#171D29",
        outline: "rgba(255, 255, 255, 0.08)",
        gain: "#00FF9D",
        loss: "#FF3B5C",
        primary: "#76FFE0",
        secondary: "#77A5FF",
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(118, 255, 224, 0.18), 0 18px 80px rgba(118, 255, 224, 0.12)",
        card: "0 12px 40px rgba(0, 0, 0, 0.32)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 1.6s ease-in-out infinite",
        valueFlash: "valueFlash 1s ease-in-out",
        shimmer: "shimmer 2.8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.72" },
          "50%": { opacity: "1" },
        },
        valueFlash: {
          "0%": { opacity: "0.65", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
