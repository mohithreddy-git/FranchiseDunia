import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#07090D',
        surface: {
          DEFAULT: '#0E1218',
          subtle: '#141A23',
          card: '#11161F',
          hover: '#19212D',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        'border-strong': 'rgba(255, 255, 255, 0.16)',
        primary: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#34D399',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FBBF24',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        foreground: '#E6EAF0',
        muted: {
          DEFAULT: '#8A94A6',
          foreground: '#8A94A6',
          dark: '#586274',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        item: '12px',
        pill: '9999px',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        glowPulse: {
          '0%': { filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' },
          '100%': { filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
