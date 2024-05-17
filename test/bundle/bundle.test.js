import path from 'path';
import { readFile } from 'fs/promises';
import { test } from 'vitest';
import { rollup } from 'rollup';
import metablock from '../../src/index';
import { expect } from 'vitest';

test('simplest', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'simplest');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.json'),
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('yaml', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'yaml');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.yaml'),
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('override', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'override');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.yaml'),
        'override': {
          'name': '我的第一個腳本',
        },
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('metablock.cjs', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'metablock.cjs');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.cjs'),
      }),
    ],
  });



  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('metablock.mjs', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'metablock.mjs');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.mjs'),
      }),
    ],
  });



  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});


test('order1', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'order1');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.yaml'),
        'order': [
          'grant',
        ],
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('order2', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'order2');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.yaml'),
        'order': [
          'version',
          '...',
          'grant',
          '...',
        ],
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

test('order3', async() => {
  const testCaseDir = path.resolve(import.meta.dirname, 'order3');
  const answerText = await readFile(path.resolve(testCaseDir, 'answer.txt'), 'utf8');

  const bundle = await rollup({
    input: path.resolve(import.meta.dirname, 'main.js'),
    plugins: [
      metablock({
        'file': path.resolve(testCaseDir, './metablock.yaml'),
        'order': [
          '...',
        ],
      }),
    ],
  });

  const bundleOut = await bundle.generate({
    format: 'esm',
  });

  expect(bundleOut.output[0].code).toBe(answerText);
});

