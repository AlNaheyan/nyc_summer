import type { Config } from "tailwindcss";

// Summery palette (TECH_SPEC §9): warm sun/coral + sky blue accents,
// large rounded cards, energetic tone. Mobile-first.
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
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(255, 94, 91, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
