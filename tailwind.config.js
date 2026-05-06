/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#eef2ff",
        sky: "#dbeafe",
        aqua: "#67e8f9",
        brand: "#0f766e",
        accent: "#f97316"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(15, 23, 42, 0.18)"
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(103, 232, 249, 0.5), transparent 38%), radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.22), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)"
      }
    }
  },
  plugins: []
};
