/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0b",
        coal: "#111114",
        steel: "#1a1a1f",
        ember: "#ff3d2e",
        emberdark: "#c41e0e",
        gold: "#f5b730",
        ash: "#8a8a93",
        bone: "#f4f1ea",
      },
      fontFamily: {
        display: ['"Anton"', "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
