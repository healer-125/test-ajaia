import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// During local dev the React app runs on :5173 and proxies API calls to the
// NestJS server on :3000. In production the API serves the built SPA directly,
// so no proxy is needed. Test config lives in vitest.config.ts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
