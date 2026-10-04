import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      },
      exclude: ['src/main.jsx', 'eslint.config.js', 'dist/**', '**/*.test.js', '**/*.test.jsx']
    }
  }
})
