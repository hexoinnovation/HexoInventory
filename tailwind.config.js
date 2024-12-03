/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Retain the dark mode setting from the first config
  theme: {
    screens: {
      "x-small": "320px",
      small: "576px",
      medium: "768px",
      large: "992px",
      "extra-large": "1200px",
      "xx-large": "1400px",
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
        40: "7.5rem", // Custom spacing for ml-40
      },
      animation: {
        drift: "driftEffect 4s linear infinite", // Custom animation 'drift'
        dr: "dr 2s infinite", // Custom 'dr' animation
        neon: "neon 1.5s ease-in-out infinite", // Neon text animation
        pulseSlow: "pulseSlow 3s infinite",
        wiggle: 'wiggle 1s ease-in-out infinite',
        spinBounce: "spinBounce 3s cubic-bezier(0.25, 1, 0.5, 1) infinite", // Custom spin and bounce animation
        pulseSpin: "pulseSpin 2s linear infinite", // Spinning with pulsing
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulseSpin: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.2)" }, // Rotate halfway and enlarge
          "100%": { transform: "rotate(360deg) scale(1)" }, // Complete rotation
        },
        driftEffect: {
          "0%": { transform: "translateX(0)" }, // Start position
          "50%": { transform: "translateX(50px)" }, // Drift to 50px
          "100%": { transform: "translateX(0)" }, // Back to start
        },
        neon: {
          "0%, 100%": {
            textShadow:
              "0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ff0080, 0 0 20px #ff0080, 0 0 25px #ff0080, 0 0 30px #ff0080",
          },
          "50%": {
            textShadow:
              "0 0 10px #fff, 0 0 20px #ff0080, 0 0 30px #ff0080, 0 0 40px #ff0080, 0 0 50px #ff0080, 0 0 60px #ff0080",
            transform: "scale(1.1)", // Slight size increase
          },
          spinBounce: {
            "0%, 100%": { transform: "rotate(0deg) scale(1)" },
            "50%": { transform: "rotate(180deg) scale(1.2)" }, // Spin and enlarge
          },
        },
        pulseSlow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)", color: "rgb(59, 130, 246)" }, // Slight growth effect
        },
      },
      fontFamily: {
        label: ["Host Grotesk", "sans-serif"], // Added custom font-family
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        "@media print": {
          body: {
            marginTop: "0",
          },
          ".sidebar": {
            display: "none !important", // Hide sidebar during print
          },
          ".content": {
            marginTop: "0 !important", // Adjust content margins for print
          },
          ".print\\:hidden": {
            display: "none", // Hide elements with the class 'print:hidden' during printing
          },
          ".print\\:right-align": {
            display: "flex",
            justifyContent: "flex-end",  // Align content to the right
            textAlign: "right",  // Right-align the text
            width: "100%",  // Make sure the container takes up full width
            marginRight: "20px",  // Optional margin for spacing
            paddingRight: "10px",  // Optional padding for better spacing
          },
           /* Right-align Signature during print */
           ".signature-right-align": {
            display: "flex",
            justifyContent: "flex-end",  // Align content to the right
            textAlign: "right",  // Ensure text is right-aligned
            width: "120",  // Ensure container takes full width
            marginRight: "20px",  // Optional margin for spacing
          },
          "@page": {
            margin: "0",
            size: "auto",  // Ensure content fits on the page
          },
        },
      });
    },
  ],
};
