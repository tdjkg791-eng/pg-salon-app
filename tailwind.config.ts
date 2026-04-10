import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pg: {
          green: '#1D9E75',
          orange: '#D85A30',
          blue: '#378ADD',
          red: '#A32D2D',
          purple: '#534AB7',
          pink: '#D4537E',
        },
      },
    },
  },
  plugins: [],
};

export default config;
