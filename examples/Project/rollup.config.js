import metablock from '../../src/index.js';

process.chdir(__dirname);

export default {
  input: 'main.js',
  output: {
    file: 'out.user.js',
    format: 'esm',
  },
  plugins: [metablock({
    file: './meta.yml',
    override: {
      version: '5.4.3',
    } })],
};
