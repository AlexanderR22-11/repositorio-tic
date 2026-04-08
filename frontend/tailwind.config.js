import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // permite alternar tema con la clase 'dark'
  theme: {
    extend: {
      colors: {
        utn: "#006847"
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // opcional
    daisyui
  ],
  daisyui: {
    themes: [
      {
        utnTheme: {
          "primary": "#006847",
          "secondary": "#004d35",
          "accent": "#00a86b",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
        },
      },
    ],
  },
}
