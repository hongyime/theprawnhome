/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: { prawn: '#a3a3a3', neon: '#d4d4d4', hotpink: '#737373' },
      boxShadow: { brutal: '5px 8px 0px 0px #000000', 'brutal-hover': '2px 4px 0px 0px #000000' },
      borderWidth: { 3: '3px' },
    },
  },
  plugins: [],
};
