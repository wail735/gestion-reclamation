/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#005493',     // rgb(0, 84, 147) - Royal SEAAL Blue
          green: '#127E36',    // rgb(18, 126, 54) - Standard SEAAL Green
          darkBg: '#03264A',   // rgb(3, 38, 74) - Deep official blue for backgrounds
          card: '#063B6E',     // Solid lighter blue for cards instead of weak rgba
          border: '#1A5A96',   // Border color for cards
          text: '#FFFFFF',     // Pure white text
          muted: '#A5C8EA',    // Muted light blue text for better contrast
        }
      },
    },
  },
  plugins: [],
}
