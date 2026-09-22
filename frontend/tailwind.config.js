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
          green: "#9EE60F",
          greenDim: "#7fb80b",
          dark: "#0d0d0d",
          panel: "#14161d",
          surface: "#1a1d26",
          elevated: "#222634",
          felt: "#0d4022",
        },
        primary: { DEFAULT: "#9EE60F", foreground: "#0d0d0d" },
        secondary: { DEFAULT: "#1a1d26", foreground: "#ffffff" },
        muted: { DEFAULT: "#1a1d26", foreground: "#94a3b8" },
        accent: { DEFAULT: "#222634", foreground: "#ffffff" },
        destructive: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        card: { DEFAULT: "#14161d", foreground: "#ffffff" },
        popover: { DEFAULT: "#14161d", foreground: "#ffffff" },
      },
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
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
