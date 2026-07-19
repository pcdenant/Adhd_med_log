export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6E5FA8',
        'primary-dark': '#4B3A63',
        'primary-light': '#EDE9F5',
        accent: '#3D7A5F',
        bg: '#FAF7FC',
        muted: '#5E4F76',
        success: { 50: '#EAF3EC', 700: '#2F6B44' },
        warning: { 50: '#FCF3D9', 700: '#6B5814' },
        danger: { 50: '#FBEAE8', 700: '#9C3C3D' },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Lora"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
