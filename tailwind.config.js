/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070f',
        primary: '#6d8cff',
        accent: '#a855f7',
        warning: '#f59e0b',
        danger: '#f43f5e',
        success: '#22d3ae',
        surface: '#0c1120',
        surface2: '#11172b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(109,140,255,0.15), 0 8px 30px -8px rgba(109,140,255,0.25)',
      },
    },
  },
  plugins: [],
}
