// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './src/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        "card-foreground": 'var(--card-foreground)',
        primary: 'var(--primary)',
        "primary-foreground": 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        "secondary-foreground": 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        "muted-foreground": 'var(--muted-foreground)',
        accent: 'var(--accent)',
        "accent-foreground": 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        "destructive-foreground": 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: 'var(--sidebar)',
        "sidebar-foreground": 'var(--sidebar-foreground)',
        "sidebar-primary": 'var(--sidebar-primary)',
        "sidebar-primary-foreground": 'var(--sidebar-primary-foreground)',
        "sidebar-accent": 'var(--sidebar-accent)',
        "sidebar-accent-foreground": 'var(--sidebar-accent-foreground)',
        "sidebar-border": 'var(--sidebar-border)',
        "sidebar-ring": 'var(--sidebar-ring)',
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'calc(var(--radius) + 4px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-filters'),
  ],
};
