import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'lib/sdk/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'ES2020',
  tsconfig: './tsconfig.lib.json',
  external: ['react', 'react-dom', 'next'],
  shims: true,
});
