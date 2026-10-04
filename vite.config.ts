import { defineConfig } from 'vitest/config';

// The explorer is a static folder that must work from any path (served from a
// subfolder, or opened via a preview link), so every asset URL is relative.
// Pages: the market explorer (index.html), the prototype (play.html) and the
// round 1 toys of the fun core (toy.html, board.html).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { index: 'index.html', play: 'play.html', toy: 'toy.html', board: 'board.html' },
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
