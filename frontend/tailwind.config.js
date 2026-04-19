/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base:      'var(--bg-base)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        hover:     'var(--bg-hover)',
        accent: {
          DEFAULT:   'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          muted:     'var(--accent-muted)',
        },
        success:   'var(--status-success)',
        warning:   'var(--status-warning)',
        error:     'var(--status-error)',
        info:      'var(--status-info)',
        neutral:   'var(--status-neutral)',
        txt: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          accent:    'var(--text-accent)',
        },
        bdr: {
          subtle:  'var(--border-subtle)',
          default: 'var(--border-default)',
          focus:   'var(--border-focus)',
        },
      },
    },
  },
  plugins: [],
}
