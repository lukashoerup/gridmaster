import { defineConfig } from 'vitest/config';

// The explorer is a static folder that must work from any path (served from a
// subfolder, or opened via a preview link), so every asset URL is relative.
// Two pages: the market explorer (index.html) and the prototype (play.html).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { index: 'index.html', play: 'play.html' },
    },
    target: 'es2022',
    sourcemap: false,
    // ECharts is one 650 kB chunk; that is expected, not a problem to fix.
    chunkSizeWarningLimit: 800,
  },
  worker: {
    format: 'es',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
