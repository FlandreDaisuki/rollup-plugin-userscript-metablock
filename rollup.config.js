import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const input = 'src/index.js';

export default [{
  input,
  plugins: [
    nodeResolve(),
    commonjs(),
  ],
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.common.js',
    format: 'cjs',
    exports: 'default',
  }],
}, {
  input,
  plugins: [
    nodeResolve(),
    commonjs(),
  ],
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.esm.js',
    format: 'esm',
  }],
}];
