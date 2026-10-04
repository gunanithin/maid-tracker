import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 100,
        functions: 90,
        branches: 95,
        statements: 100
      },
      exclude: ['src/main.jsx', 'src/setupTests.js', 'debug.js', 'vite.config.js', 'eslint.config.js', 'playwright.config.js', 'e2e/**', 'dist/**', '**/*.test.js', '**/*.test.jsx']
    }
  }
})
