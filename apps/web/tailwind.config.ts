import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#714B67',
          dark: '#55364E',
          light: '#F7F7F8',
          text: '#252525',
          secondary: '#737373',
          surface: '#FFFFFF',
        },
        primary: {
          DEFAULT: '#714B67',
          foreground: '#FFFFFF',
          hover: '#55364E',
        },
        secondary: {
          DEFAULT: '#F7F7F8',
          foreground: '#252525',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#FFFFFF',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
          light: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
