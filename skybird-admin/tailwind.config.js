/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // SkyBirds brand green; every page styles its accents with primary-*.
        primary: {
          50: '#f1f8ec',
          100: '#e0f0d4',
          200: '#c2e2ab',
          300: '#98cf78',
          400: '#6ebd44',
          500: '#52a22f',
          600: '#3d8425',
          700: '#2e6b2e',
          800: '#245322',
          900: '#10251D',
        },
        // Cooler neutral than Tailwind's default gray, for a cleaner dashboard look.
        gray: colors.slate,
        brand: {
          ink: '#10251D',
          leaf: '#6ebd44',
          forest: '#2e6b2e',
          mint: '#e6f4dc',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 37, 29, 0.04), 0 1px 3px rgba(16, 37, 29, 0.06)',
      },
    },
  },
  plugins: [],
}
