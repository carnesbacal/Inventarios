/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta alineada con la app "Auditoria" (azul) de Carnes Bacal.
        brand: {
          50: '#eef4fb',
          100: '#d9e6f6',
          200: '#b3cded',
          300: '#84ade0',
          400: '#5286cd',
          500: '#2f66b3',
          600: '#1f4e93',
          700: '#1a3f76',
          800: '#173357',
          900: '#0e2544',
          950: '#081627',
        },
        // Navy profundo para hero, botones y superficies oscuras.
        navy: {
          800: '#0e2748',
          900: '#0a1c33',
          950: '#06111f',
        },
        // Acento (punto de estado / detalles), como el ambar de sus logins.
        accent: {
          400: '#f5b301',
          500: '#e0a300',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        soft: '0 4px 16px rgba(16,24,40,0.08)',
      },
    },
  },
  plugins: [],
}
