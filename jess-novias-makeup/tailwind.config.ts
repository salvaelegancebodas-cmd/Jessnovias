import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF8F3",
        champagne: "#E9DCC9",
        nude: "#D9C2A8",
        "warm-beige": "#C9B8A3",
        "soft-black": "#211E1C",
        "warm-gray": "#8A8078",
      },
      fontFamily: {
        // Títulos: serif editorial. Sustituir por Playfair Display o
        // Cormorant Garamond vía next/font en src/app/layout.tsx
        serif: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        wide2: "0.15em",
      },
    },
  },
  plugins: [],
};

export default config;
