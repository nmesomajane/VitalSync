/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // VitalSync custom colours — use these in className
        primary: "#e94560",
        // className="bg-primary" → background #e94560
        dark: "#080c14",
        // className="bg-dark" → background #080c14
        card: "#0f1923",
        border: "#1e293b",
        muted: "#64748b",
      },
    },
  },
  plugins: [],
};