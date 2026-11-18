import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Run tests in the real user's timezone (Montréal) so local-vs-UTC date bugs
// show up here instead of only after 19h in production.
process.env.TZ = 'America/Toronto'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    // Only our own tests — never the vendored .impeccable submodule's tests.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', '**/*.{test,spec}.{js,jsx}'],
    },
  },
})
