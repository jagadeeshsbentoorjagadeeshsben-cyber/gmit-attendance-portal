/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#071A3D",
        sapphire: "#0B2554",
        royal: "#245BFF",
        cyan: "#4DEBFF",
        violet: "#7C5CFF",
        champagne: "#F5C76A",
        success: "#12B76A",
        warning: "#F79009",
        danger: "#F04438",
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "surface-2": "hsl(var(--surface-2))",
        border: "hsl(var(--border))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        brand: "hsl(var(--brand))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        card: "0 2px 8px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        lift: "0 8px 30px rgba(7,26,61,0.10)",
        glow: "0 0 40px rgba(36,91,255,0.25)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.4s ease-out both",
        gradient: "gradientShift 20s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
