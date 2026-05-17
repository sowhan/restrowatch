export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        card: '#1A1A1A',
        border: '#2A2A2A',
        accent: '#F97316',
        swiggy: '#FC8019',
        zomato: '#E23744',
        critical: '#EF4444',
        high: '#F97316',
        medium: '#EAB308',
        low: '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
