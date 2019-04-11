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
    output: 'out.js',
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

// describe('rollup-plugin-userscript-metablock', () => {

//   // describe('minimal', async () => {
//   //   const code = await rollup({
//   //     input: 'main.js',
//   //     plugins:[metablock()],
//   //   }).then(generateCode);
//   //   console.log(code);
//   // it('@name required', () => codePromise
//   //   .then(nameRequired));
//   // it('@grant explictly', () => codePromise
//   //   .then(grantExplictly));
//   // it('@grant none', () => codePromise
//   //   .then(grantNone));
//   // });

//   // describe('blank.txt (invalid json)', () => {
//   //   it('JSON.parse throw SyntaxError', () => {
//   //     assert.throws(() => {
//   //       JSON.parse(readFileSync('blank.txt', 'utf8'));
//   //     }, /SyntaxError/g);
//   //   });
//   // });

//   // describe('empty.json', () => {
//   //   const codePromise = rollup({
//   //     input: 'main.js',
//   //     plugins:[metablock({ file: 'empty.json' })],
//   //   }).then(generateCode);

//   //   it('@name required', () => codePromise
//   //     .then(nameRequired));
//   //   it('@grant explictly', () => codePromise
//   //     .then(grantExplictly));
//   //   it('@grant none', () => codePromise
//   //     .then(grantNone));
//   // });

//   // describe('invalid name type (name1.json)', () => {
//   //   const codePromise = rollup({
//   //     input: 'main.js',
//   //     plugins:[metablock({ file: 'name1.json' })],
//   //   }).then(generateCode);

//   //   it('@name required', () => codePromise
//   //     .then(nameRequired));
//   //   it('@grant explictly', () => codePromise
//   //     .then(grantExplictly));
//   //   it('@grant none', () => codePromise
//   //     .then(grantNone));
//   // });

//   // describe('key-value name without default (name2.json)', () => {
//   //   it('key-value name without default throw Error', () => {
//   //     assert.throws(() => {
//   //       rollup({
//   //         input: 'main.js',
//   //         plugins:[metablock({ file: 'name2.json' })],
//   //       });
//   //     }, Error);
//   //   });
//   // });

//   // describe('basic (basic.json)', () => {
//   //   const codePromise = rollup({
//   //     input: 'main.js',
//   //     plugins:[metablock({ file: 'basic.json' })],
//   //   }).then(generateCode);

//   //   codePromise.then(console.log);

//   //   it('@name required', () => codePromise
//   //     .then(nameRequired));
//   //   it('@grant explictly', () => codePromise
//   //     .then(grantExplictly));
//   // });
// });
