import metablock from '../src/index';
import { rollup } from 'rollup';
import { readFileSync, readdirSync } from 'fs';
import { strictEqual } from 'assert';

const doIntegral = async(path) => {
  process.chdir(path);

  const options = JSON.parse(readFileSync('./options.json', 'utf-8'));
  const answer = readFileSync('./answer.txt', 'utf-8');

  const bundle = await rollup({
    input: `${__dirname}/main.js`,
    plugins: [metablock(options)],
  });

  const bundleOut = await bundle.generate({
    file: 'out.js',
    format: 'esm',
  });

  strictEqual(answer, bundleOut.output[0].code);

  process.chdir(__dirname);
};

describe('integral', () => {
  process.chdir(__dirname);

  const casedirs = readdirSync('testcase');

  for (const dir of casedirs) {
    it(`${dir}`, () => doIntegral(`${__dirname}/testcase/${dir}`));
  }
});
