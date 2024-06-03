const metablock = require('rollup-plugin-userscript-metablock');

module.exports = {
  input: 'main.js',
  output: {
    file: 'out.user.js',
    format: 'esm',
  },
  plugins: [metablock()],
};
