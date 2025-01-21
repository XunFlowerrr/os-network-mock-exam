import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:
          "hsl(var(--background-h), var(--background-s), var(--background-l))",
        foreground:
          "hsl(var(--foreground-h), var(--foreground-s), var(--foreground-l))",
      },
    },
  },
  plugins: [],
} satisfies Config;
