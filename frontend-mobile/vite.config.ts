import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Use relative base for Capacitor (file:// protocol in Android WebView)
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure chunk names work with relative paths
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
