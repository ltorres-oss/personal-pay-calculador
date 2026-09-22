import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        personal: {
          blue: '#0052FF',
          dark: '#0B132B',
          cyan: '#00D2FF',
          accent: '#7928CA',
          light: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      }
    },
  },
  plugins: [],
};
export default config;
