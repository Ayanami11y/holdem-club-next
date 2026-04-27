import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/socket.io': {
        target: backendTarget,
        ws: true,
      },
      '/api': backendTarget,
    },
  },
});
