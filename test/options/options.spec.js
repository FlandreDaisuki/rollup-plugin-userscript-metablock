import { readFileSync } from 'node:fs';
import path from 'node:path';
import { YAMLException } from 'js-yaml';
import { describe, expect, test } from 'vitest';
import {
  SIMPLEST_META,
  getSpecialIndexWithOrder,
  getValidOrder,
  loadFile,
  sortbyOrder,
} from '../../src/options.js';
import { FileNotFound, UnsupportedFormat } from '../../src/errors.js';

const fixturePath = (...segments) => path.resolve(import.meta.dirname, ...segments);
const readJsonFixture = (...segments) => JSON.parse(
  readFileSync(fixturePath(...segments), 'utf8'),
);

const expectedMetadata = Object.freeze({
  name: 'test',
  description: 'This is a test',
  include: [
    'http://*',
    'https://*',
  ],
  grant: 'none',
  namespace: 'npmjs.com/rollup-plugin-userscript-metablock',
});

const orderIndexCases = readJsonFixture('order/orderIndex.json');
const specialIndexCases = orderIndexCases.flatMap(
  ({ order, orderIndex }, caseIndex) => Object.entries(orderIndex)
    .map(([key, expected]) => ({
      name: `case ${caseIndex + 1}, key "${key}"`,
      order,
      key,
      expected,
    })),
);
const sortCases = readJsonFixture('order/order.json');

describe('loadFile', () => {
  test.each([
    { name: 'null', value: null },
    { name: 'an empty string', value: '' },
  ])('returns default metadata for $name', async ({ value }) => {
    await expect(loadFile(value)).resolves.toEqual(SIMPLEST_META);
  });

  test('throws when the file does not exist', async () => {
    await expect(loadFile('not_exist.json')).rejects.toThrow(FileNotFound);
  });

  test('throws for an unsupported file extension', async () => {
    await expect(loadFile(fixturePath('file/invalid/meta.ini')))
      .rejects.toThrow(UnsupportedFormat);
  });

  test.each([
    { name: 'JSON', file: 'meta.json' },
    { name: 'CommonJS', file: 'meta.js' },
    { name: 'an ES module', file: 'meta.esm.js' },
    { name: 'YAML', file: 'meta.yaml' },
  ])('loads metadata from $name', async ({ file }) => {
    await expect(loadFile(fixturePath('file/valid', file)))
      .resolves.toEqual(expectedMetadata);
  });

  test('throws for malformed JSON', async () => {
    await expect(loadFile(fixturePath('file/invalid/meta.json')))
      .rejects.toThrow(SyntaxError);
  });

  test('throws when a JavaScript module has no exports', async () => {
    await expect(loadFile(fixturePath('file/invalid/meta.js')))
      .rejects.toThrow(/Can't find any key export/);
  });

  test('throws for malformed YAML', async () => {
    await expect(loadFile(fixturePath('file/invalid/meta.yaml')))
      .rejects.toThrow(YAMLException);
  });
});

describe('metadata ordering', () => {
  test('normalizes an order and removes unsupported or duplicate keys', () => {
    expect(getValidOrder([
      'name',
      '...',
      'not-meta-keys',
      '...',
      'grant',
      'name:zh-TW',
    ])).toEqual([
      'name',
      'description',
      'namespace',
      '...',
      'grant',
    ]);
  });

  test.each(specialIndexCases)(
    'calculates the relative index for $name',
    ({ order, key, expected }) => {
      expect(getSpecialIndexWithOrder(order)(key)).toBe(expected);
    },
  );

  test.each(sortCases.map((testCase, index) => ({
    name: `case ${index + 1}`,
    ...testCase,
  })))('sorts metadata for $name', ({ before, order, after }) => {
    expect(sortbyOrder(before, order)).toEqual(after);
  });
});
