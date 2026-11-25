/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        navy: 'var(--color-navy)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        accent: 'var(--color-accent-warm)',
        muted: 'var(--color-text-muted)',
      },
      fontFamily: {
        display: ['Silkscreen', 'system-ui', 'sans-serif'],
        title: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hard: 'var(--shadow-hard)',
        'hard-sm': 'var(--shadow-hard-sm)',
      },
      borderRadius: {
        brand: 'var(--radius)',
      },
    },
  },
  plugins: [],
}
