/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Retain the dark mode setting from the first config
  theme: {
    screens: {
      'x-small': '320px',
      'small': '576px',
      'medium': '768px',
      'large': '992px',
      'extra-large': '1200px',
      'xx-large': '1400px',
    },
    extend: {
      colors: {
        primary: "#fea928",
        secondary: "#ed8900",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "3rem",
        },
      },
      spacing: {
        '40': '7.5rem', // Custom spacing for ml-40
      },
      animation: {
        drift: 'driftEffect 4s linear infinite', // Custom animation 'drift'
        dr: 'dr 2s infinite', // Custom 'dr' animation
        neon: 'neon 1.5s ease-in-out infinite', // Neon text animation
        pulseSlow: 'pulseSlow 3s infinite',
      },
      keyframes: {
        driftEffect: {
          '0%': { transform: 'translateX(0)' }, // Start position
          '50%': { transform: 'translateX(50px)' }, // Drift to 50px
          '100%': { transform: 'translateX(0)' }, // Back to start
        },
        neon: {
          '0%, 100%': {
            textShadow:
              '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ff0080, 0 0 20px #ff0080, 0 0 25px #ff0080, 0 0 30px #ff0080',
          },
          '50%': {
            textShadow:
              '0 0 10px #fff, 0 0 20px #ff0080, 0 0 30px #ff0080, 0 0 40px #ff0080, 0 0 50px #ff0080, 0 0 60px #ff0080',
            transform: 'scale(1.1)', // Slight size increase
          },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)', color: 'rgb(59, 130, 246)' }, // Slight growth effect
        },
      },
      fontFamily: {
        label: ["Host Grotesk", "sans-serif"], // Added custom font-family
      },
    },
  },
  plugins: [],
};
