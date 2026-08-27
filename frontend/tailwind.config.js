/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: {
          50:  '#FFF4EF',
          100: '#FFE8DC',
          200: '#FFD0BC',
          300: '#FFB090',
          400: '#FF8560',
          500: '#F97316',   // Primary coral-orange (matches mockup)
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        peach: '#FFF1EC',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        ticker:     'ticker 30s linear infinite',
        blink:      'blink 1s step-end infinite',
        float:      'float 3s ease-in-out infinite',
        'fade-up':  'fadeUp 0.6s ease forwards',
        'progress': 'progress 1.2s ease forwards',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          '0%':   { strokeDashoffset: '314' },
        },
      },
    },
  },
  plugins: [],
};
