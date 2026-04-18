import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        'bg-elev': '#0A0A0A',
        fg: '#F5F5F4',
        'fg-muted': '#8A8A87',
        'fg-subtle': '#3F3F3E',
        accent: '#7DD3C8',
        'accent-dim': '#3A5D58',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        condensed: ['var(--font-condensed)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-lg': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.0', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'glow-accent': '0 0 80px 0 rgba(125, 211, 200, 0.18)',
      },
      maxWidth: {
        content: '1440px',
        readable: '640px',
      },
    },
  },
  plugins: [],
};

export default config;
