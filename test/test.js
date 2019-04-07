import metablock from '../src/index';
import { rollup } from 'rollup';
import assert from 'assert';
import { readFileSync } from 'fs';

process.chdir(__dirname);

describe('intregral', () => {
  it('aaa', () => true);
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
