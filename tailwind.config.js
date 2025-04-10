/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      minHeight: {
        'screen-dynamic': ['100vh', '100dvh'],
      },
      maxHeight: {
        'screen-dynamic': ['100vh', '100dvh'],
      },
      colors: {
        // Navy blue shades
        navy: {
          50: '#E7E9EF',
          100: '#C2C9D6',
          200: '#9AA6BC',
          300: '#7283A2',
          400: '#4A6088',
          500: '#233D6E',
          600: '#1C3259',
          700: '#152744',
          750: '#11223A', // Additional shade for darker backgrounds
          800: '#0E1B2F',
          850: '#0A1525', // Additional shade for darker backgrounds
          900: '#070F1A',
        },
        // 24k gold shades
        gold: {
          50: '#FFF7E6',
          100: '#FFE9B3',
          200: '#FFDB80',
          300: '#FFCD4D',
          400: '#FFBF1A',
          500: '#FFB100', // Pure 24k gold color
          600: '#CC8E00',
          700: '#996B00',
          800: '#664700',
          900: '#332400',
        }
      }
    },
  },
  plugins: [],
} 