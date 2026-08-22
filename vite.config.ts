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
          // lucide-react and framer-motion are deliberately NOT listed. Naming a
          // package here forces it into a chunk every page downloads; left out,
          // Rollup tree-shakes them into just the route chunks that use them.
          'vendor-mantine': ['@mantine/core', '@mantine/hooks'],
          'vendor-radix': ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
          'vendor-utils': ['axios', 'date-fns', 'dayjs', 'zod', 'react-hook-form', '@tanstack/react-query'],
          'vendor-icons': ['react-icons'],
          'vendor-charts': ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 2500
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
