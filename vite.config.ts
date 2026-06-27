import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@beetle': path.resolve(__dirname, './src'),
    },
  },
  root: './demo',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
