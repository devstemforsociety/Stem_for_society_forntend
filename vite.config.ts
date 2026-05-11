import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // vite.config.js
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@mantine/core', '@mantine/hooks', '@radix-ui/react-dialog', '@radix-ui/react-popover', 'lucide-react', 'framer-motion'],
          'vendor-utils': ['axios', 'date-fns', 'dayjs', 'zod', 'react-hook-form', '@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
