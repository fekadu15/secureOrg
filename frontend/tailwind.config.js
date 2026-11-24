/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#00254b",
        "primary-container": "#173b67",
        "on-primary": "#ffffff",
        "on-primary-container": "#86a6d8",
        "primary-fixed": "#d5e3ff",
        "primary-fixed-dim": "#a8c8fc",
        "on-primary-fixed": "#001c3b",
        "on-primary-fixed-variant": "#264774",
        "inverse-primary": "#a8c8fc",

        "secondary": "#2060a3",
        "secondary-container": "#80b6fe",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#004681",
        "secondary-fixed": "#d4e3ff",
        "secondary-fixed-dim": "#a4c9ff",
        "on-secondary-fixed": "#001c39",
        "on-secondary-fixed-variant": "#004883",

        "tertiary": "#3a1d00",
        "tertiary-container": "#593000",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#d4975f",
        "tertiary-fixed": "#ffdcc0",
        "tertiary-fixed-dim": "#fab97e",
        "on-tertiary-fixed": "#2d1600",
        "on-tertiary-fixed-variant": "#683c0b",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "background": "#f9f9ff",
        "on-background": "#111c2d",
        "surface": "#f9f9ff",
        "surface-dim": "#d0daf2",
        "surface-bright": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e8eeff",
        "surface-container-high": "#dfe8ff",
        "surface-container-highest": "#d9e3fb",
        "surface-variant": "#d9e3fb",
        "surface-tint": "#3f5f8d",
        "on-surface": "#111c2d",
        "on-surface-variant": "#43474f",
        "inverse-surface": "#273143",
        "inverse-on-surface": "#ecf0ff",

        "outline": "#737780",
        "outline-variant": "#c3c6d0",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "margin": "1.5rem",
        "gutter": "1rem"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
