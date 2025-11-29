/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "nb-bg": "#e3cab8",
        "nb-ink": "#000000",
        "nb-accent": "#6EE7B7",
        "nb-accent-2": "#60A5FA",
        "nb-warn": "#F59E0B",
        "nb-error": "#EF4444",
        "nb-ok": "#10B981",
        "nb-card": "#FFFFFF"
      },
      boxShadow: {
        "nb": "8px 8px 0 0 rgba(0,0,0,0.9)",
        "nb-sm": "4px 4px 0 0 rgba(0,0,0,0.9)",
        "nb-inset": "inset 0 0 0 3px #111"
      },
      borderRadius: {
        "nb": "1.25rem"
      },
      fontFamily: {
        "display": ["Instrument Serif", "Georgia", "serif"],
        "body": ["Inter", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

