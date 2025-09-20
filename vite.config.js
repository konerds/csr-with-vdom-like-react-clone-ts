import { resolve } from 'path';

import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const root = resolve(__dirname, 'src');

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
      },
    },
  },
  plugins: [tsconfigPaths()],
  root,
});
