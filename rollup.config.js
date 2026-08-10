import terser from '@rollup/plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [{
  input: 'src/cjs.js',
  plugins: [
    nodeResolve({
      // REF: https://stackoverflow.com/a/77847468
      exportConditions: ['node'],
    }),
    commonjs(),
    terser(),
  ],
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.cjs',
    format: 'cjs',
    exports: 'default',
  }],
}, {
  input: 'src/index.js',
  plugins: [
    nodeResolve({
      exportConditions: ['node'],
    }),
    commonjs(),
    terser(),
  ],
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.mjs',
    format: 'esm',
  }],
}];
