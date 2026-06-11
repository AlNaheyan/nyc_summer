import type { Config } from "tailwindcss";

// Playful summer "claymorphism" palette (TECH_SPEC §9): vibrant sun/coral +
// sky/grape/mint candy accents, pillowy clay shadows, sticker pop shadows,
// chunky rounded shapes, bouncy motion. Mobile-first.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sun: {
          DEFAULT: "#FFB627",
          soft: "#FFE08A",
        },
        coral: {
          DEFAULT: "#FF5E5B",
          soft: "#FF8C8A",
        },
        sky: {
          DEFAULT: "#1CA7EC",
          soft: "#7FD4F5",
        },
        grape: {
          DEFAULT: "#9B5DE5",
          soft: "#C9A7F2",
        },
        mint: {
          DEFAULT: "#16C79A",
          soft: "#8AE7CF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.75rem",
        blob: "2.5rem",
      },
      boxShadow: {
        // Soft pillowy clay depth.
        card: "0 14px 34px -12px rgba(255, 94, 91, 0.38)",
        clay: "0 10px 24px -8px rgba(42, 26, 18, 0.18), inset 0 2px 4px rgba(255,255,255,0.6)",
        // Chunky offset "sticker" pop used on primary actions.
        pop: "0 5px 0 0 rgba(42, 26, 18, 0.12)",
        "pop-coral": "0 5px 0 0 #D6443F",
        "pop-sky": "0 5px 0 0 #1583BC",
        "pop-grape": "0 5px 0 0 #7A3FD1",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-16px) rotate(6deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "bounce-soft": "bounce-soft 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
