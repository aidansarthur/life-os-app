import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        moss: "#3b6650",
        mint: "#dff4e9",
        clay: "#b66b47",
        gold: "#d9a441",
        sky: "#d9ebf8"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
