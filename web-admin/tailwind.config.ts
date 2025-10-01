import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        surface: "#121529",
        surfaceMuted: "#1a1d32",
        surfaceActive: "#20253d",
        outline: "#1f2338",
        primary: "#6e59f5",
        primaryMuted: "#4c4eff",
        sky: "#3dc9ff",
        success: "#30d184",
        warning: "#f6c260",
        danger: "#ff6b81",
        info: "#4c6ef5",
        textMuted: "#8892b0",
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
