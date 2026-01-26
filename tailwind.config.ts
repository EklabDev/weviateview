import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /!?bg-(blue|green|purple|gray|red)-(50|100|600|700)/,
    }
  ],
} satisfies Config;
