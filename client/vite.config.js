import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    allowedHosts: ['travel0.idzero.mvbuilt.com'],
    watch: {
      usePolling: true,
      interval: 300,
    },
    // Only override HMR transport when fronted by Caddy on the custom
    // domain — plain `npm run dev` on localhost:5173 needs this untouched.
    ...(process.env.CADDY_HOST && {
      hmr: {
        host: process.env.CADDY_HOST,
        protocol: 'wss',
        clientPort: 443,
      },
    }),
  },
});
