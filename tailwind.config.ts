import type { Config } from "tailwindcss";
import flowbitePlugin from "flowbite/plugin";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite-react/lib/esm/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f8fa",
        ink: "#111827",
        moss: "#0e5b50",
        ember: "#9f1239"
      }
    }
  },
  plugins: [flowbitePlugin]
};

export default config;
