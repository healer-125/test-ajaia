import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest-only config (kept out of tsconfig so the production `tsc -b` build is
// not affected by Vitest's bundled Vite type definitions).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
