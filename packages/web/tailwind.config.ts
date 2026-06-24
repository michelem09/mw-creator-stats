import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#14110d",
        panel: "#1d1812",
        panel2: "#241e16",
        line: "#332a1f",
        ink: "#e8dfd2",
        ink2: "#b9ad99",
        ink3: "#807461",
        teal: "#3fb9a6",
        amber: "#e8902a",
        red: "#d65a4a",
        violet: "#9b7dd6",
        blue: "#5b9bd6",
      },
      fontFamily: {
        sans: ["Archivo", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo"],
      },
    },
  },
  plugins: [],
};
export default config;
