// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Paleta de colores personalizada para "Koppel"
      colors: {
        'koppel-blue': '#0055a4', // Un azul corporativo fuerte
        'koppel-yellow': '#ffd400', // Un amarillo vibrante
      },
      fontFamily: {
        // Una fuente sans-serif moderna que se ve bien
        sans: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
