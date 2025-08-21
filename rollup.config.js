import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/bpack.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/bpack.mjs',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [resolve(), commonjs()],
  external: ['child_process', 'fs', 'path'], // Node.js built-in modules
};