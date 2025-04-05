///////////////////////////////////////////////////////////////////////////////
// Vite server build configuration
///////////////////////////////////////////////////////////////////////////////

import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/socket.io": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8080",
        ws: true,
        changeOrigin: true,
      },
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8080",
        changeOrigin: true,
      },
      "/audio": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8080",
        changeOrigin: true,
      },
      "/static": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    outDir: "static",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'socket.io-client',
            '@hookform/resolvers/zod',
            'react-hook-form',
            'zod'
          ],
          'ui': [
            '@/components/ui/button',
            '@/components/ui/input',
            '@/components/ui/textarea',
            '@/components/ui/label',
            '@/components/ui/progress',
            '@/components/ui/card',
            '@/components/ui/accordion',
            '@/components/ui/slider',
            '@/components/ui/badge',
            '@/components/ui/select',
            '@/components/ui/tooltip',
            '@/components/ui/switch'
          ]
        }
      }
    }
  },
  clearScreen: false,
  logLevel: "info",
});
