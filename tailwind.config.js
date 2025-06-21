/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // <== this is important for React projects
  ],
  theme: {
    extend: {
      colors: {
        babyblue: '#87CEEB',
        gray808: '#333333',
        black808: '#0d0d0d'
      }
    },
  },
  plugins: [],
}
