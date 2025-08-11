import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
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
        accent: "var(--accent)",
        muted: "var(--muted)",
        border: "var(--border)",
        card: "var(--card)",
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#d97706",
      },
      boxShadow: {
        soft: "0 4px 10px -2px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.04)",
        'soft-dark': "0 4px 14px -2px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;
