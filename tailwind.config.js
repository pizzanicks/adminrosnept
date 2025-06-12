// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        garamond: ['"Cormorant Garamond"', 'serif'],
        barlow: ['"Barlow"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        cream: '#FAF5F1',
      },
    },
  },
  plugins: [],
}
