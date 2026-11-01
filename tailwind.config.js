/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#880D1E",   // Color principal (Vino / Carmesí profundo)
          accent: "#DD2D4A",    // Acento complementario para gradientes
          secondary: "#F26A8D", // Acento secundario
          light: "#F49CBB",     // Acento claro
          soft: "#FAD7E4",      // Fondos suaves
        },
        surface: {
          bg: "#FAF7F8",        // Fondo general cálido ultra claro del dashboard
          input: "#F6F6F7",     // Fondo de inputs en el formulario de login
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 20px 50px rgba(136, 13, 30, 0.08)',
        'button': '0 10px 25px -5px rgba(221, 45, 74, 0.45)',
      }
    },
  },
  plugins: [],
}