const input = 'src/index.js';
const external = [
  'fs',
  'path',
  'chalk',
  'debug',
  'semver',
  'js-yaml',
  'valid-url',
  'magic-string',
];

export default [{
  external,
  input,
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.common.js',
    format: 'cjs',
    exports: 'default',
  }],
}, {
  external,
  input,
  output: [{
    file: 'dist/rollup-plugin-userscript-metablock.esm.js',
    format: 'esm',
  }],
}];
