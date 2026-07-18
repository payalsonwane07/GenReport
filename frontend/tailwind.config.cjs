/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#3B82F6',
          dark: '#60A5FA',
        },
        surface: {
          light: '#FFFFFF',
          muted: '#F8F9FA',
          dark: '#374151',
          darker: '#1F2937',
          darkest: '#111827',
        },
        border: {
          light: '#E5E7EB',
          dark: '#4B5563',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'card-dark': '0 4px 6px -1px rgb(0 0 0 / 0.3)',
      },
      transitionProperty: {
        theme: 'background-color, border-color, color, box-shadow',
      },
    },
  },
  plugins: [],
}
