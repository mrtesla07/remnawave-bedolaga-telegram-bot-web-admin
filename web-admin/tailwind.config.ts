import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS variable-driven colors to support theming with alpha (bg-*/opacity)
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surfaceMuted: "rgb(var(--surface-muted) / <alpha-value>)",
        surfaceActive: "rgb(var(--surface-active) / <alpha-value>)",
        outline: "rgb(var(--outline) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        textMuted: "rgb(var(--text-muted) / <alpha-value>)",

        // Brand/status colors can stay constant across themes
        primary: "#6e59f5",
        primaryMuted: "#4c4eff",
        sky: "#3dc9ff",
        success: "#30d184",
        warning: "#f6c260",
        danger: "#ff6b81",
        info: "#4c6ef5",
      },
      boxShadow: {
        card: "0 20px 35px rgba(6, 10, 25, 0.65)",
        inset: "inset 0 0 0 1px rgba(255, 255, 255, 0.02)",
      },
      borderRadius: {
        xl: "20px",
        '2xl': "24px",
      },
      fontFamily: {
        sans: ['"Inter"', '"Manrope"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
