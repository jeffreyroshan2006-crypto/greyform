import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    hmr: { overlay: false } // Disable HMR overlay
  },
  cacheDir: './.vite_cache' // Move cache directory to avoid conflicts
});
