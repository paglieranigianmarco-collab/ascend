/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0b0c10',
          1: '#111218',
          2: '#18191f',
          3: '#1f2028',
          4: '#272830',
        },
        accent: {
          DEFAULT: '#7c6af5',
          light: '#a99cf7',
          dark: '#5b4de0',
        },
        green: {
          ladder: '#22d3a0',
        },
        amber: {
          ladder: '#f59e0b',
        },
        red: {
          ladder: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        glow: '0 0 20px rgba(124,106,245,0.25)',
        'glow-green': '0 0 20px rgba(34,211,160,0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
