/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "hsl(354, 85%, 44%)", // Deep Crimson Red
          charcoal: "hsl(220, 13%, 18%)", // Dark Gray
          gold: "hsl(38, 92%, 50%)", // Gumbo roux Gold/Ochre
          light: "hsl(210, 20%, 98%)" // Cream White Background
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
