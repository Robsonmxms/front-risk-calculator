import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        canvas: "#f6f7f5",
        ink: "#161a18",
        moss: {
          DEFAULT: "#0e5b50",
          strong: "#0a453d"
        },
        ember: {
          DEFAULT: "#9f1239",
          strong: "#881337"
        }
      },
      boxShadow: {
        "premium-sm": "0 1px 2px rgba(15, 23, 42, 0.05)"
      },
      borderRadius: {
        lg: "0.5rem"
      }
    }
  },
  plugins: []
};

export default config;
