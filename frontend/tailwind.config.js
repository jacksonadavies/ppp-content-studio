/** @type {import('tailwindcss').Config} */
module.exports = {
  blocklist: ["overline"],
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        border: "rgba(255,255,255,0.08)",
        input: "rgba(255,255,255,0.12)",
        ring: "#9EE60F",
        background: "#0d0d0d",
        foreground: "#ffffff",
        ppp: {
          green: "#8FE80A",
          greenDim: "#74bd08",
          dark: "#0a0a0a",
          panel: "#141414",
          surface: "#1b1b1b",
          elevated: "#242424",
          felt: "#0d4022",
        },
        primary: { DEFAULT: "#8FE80A", foreground: "#0a0a0a" },
        secondary: { DEFAULT: "#1b1b1b", foreground: "#ffffff" },
        muted: { DEFAULT: "#1b1b1b", foreground: "#94a3b8" },
        accent: { DEFAULT: "#242424", foreground: "#ffffff" },
        destructive: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        card: { DEFAULT: "#141414", foreground: "#ffffff" },
        popover: { DEFAULT: "#141414", foreground: "#ffffff" },
      },
      fontFamily: {
        display: ["Ethnocentric", "Sora", "sans-serif"],
        subhead: ["Bebas Neue", "Sora", "sans-serif"],
        body: ["Sora", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
