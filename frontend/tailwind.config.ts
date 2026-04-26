import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07110d',
        felt: '#102117',
        panel: '#12261a',
        gold: '#e4c476',
        cream: '#f7efdc',
        muted: '#bfb49a'
      },
      boxShadow: {
        ambient: '0 24px 80px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
