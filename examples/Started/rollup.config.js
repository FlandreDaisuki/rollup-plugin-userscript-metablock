import metablock from '../../src/index.js';

process.chdir(import.meta.dirname);

export default {
  input: 'main.js',
  output: {
    file: 'out.user.js',
    format: 'esm',
  },
  plugins: [metablock()],
};
