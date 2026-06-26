/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.jsx', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hind Madurai"', 'system-ui', 'sans-serif'],
        ui: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
