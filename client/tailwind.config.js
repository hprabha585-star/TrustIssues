/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#14181C',
        surface: '#1C2126',
        surface2: '#242A31',
        line: '#2E353D',
        ink: '#EDEFF1',
        muted: '#8B95A1',
        brass: '#C08A3E',
        verified: '#4C9A7A',
        gap: '#C9634F',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
