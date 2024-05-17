
import fs from 'fs/promises';
import path from 'path';
import { loadFile, SIMPLEST_META, getValidOrder, getSpecialIndexWithOrder, sortbyOrder } from '../../src/options';
import { FileNotFound, UnsupportedFormat } from '../../src/errors';
import { YAMLException } from 'js-yaml';
import { describe, test, expect } from 'vitest';

describe('options:file', () => {
  const ref = Object.freeze({
    name: 'test',
    description: 'This is a test',
    include: [
      'http://*',
      'https://*',
    ],
    grant: 'none',
    namespace: 'npmjs.com/rollup-plugin-userscript-metablock',
  });

  test('null/empty', () => {
    expect(loadFile(null)).resolves.toMatchObject(SIMPLEST_META);
    expect(loadFile('')).resolves.toMatchObject(SIMPLEST_META);
  });
  test('not exists', () => {
    expect(() => loadFile('not_exist.json')).rejects.toThrow(FileNotFound);
  });

  test('unsupported format', () => {
    expect(() => loadFile(path.resolve(import.meta.dirname, 'file/bads/meta.ini'))).rejects.toThrow(UnsupportedFormat);
  });

  test('json', () => {
    expect(loadFile(path.resolve(import.meta.dirname, 'file/goods/meta.json'))).resolves.toMatchObject(ref);
    expect(() => loadFile(path.resolve(import.meta.dirname, 'file/bads/meta.json'))).rejects.toThrow(Error);
  });

  test('js', () => {
    expect(loadFile(path.resolve(import.meta.dirname, 'file/goods/meta.js'))).resolves.toMatchObject(ref);
    expect(loadFile(path.resolve(import.meta.dirname, 'file/goods/meta.esm.js'))).resolves.toMatchObject(ref);
    expect(() => loadFile(path.resolve(import.meta.dirname, 'file/bads/meta.js'))).rejects.toThrow(Error);
  });

  test('yaml', () => {
    expect(loadFile(path.resolve(import.meta.dirname, 'file/goods/meta.yaml'))).resolves.toMatchObject(ref);
    expect(() => loadFile(path.resolve(import.meta.dirname, 'file/bads/meta.yaml'))).rejects.toThrow(YAMLException);
  });
});

describe('options:order', async() => {
  test('getValidOrder()', () => {
    expect(getValidOrder(['name', '...', 'not-meta-keys', '...', 'grant', 'name:zh-TW']))
      .toMatchObject(['name', 'description', 'namespace', '...', 'grant']);
  });

  const orderIndexJson = await fs.readFile(path.resolve(import.meta.dirname, 'order/orderIndex.json'));
  const orderIndexList = JSON.parse(orderIndexJson);

  for (const [idxOfTestCase, testCase] of Object.entries(orderIndexList)) {
    const getSpecialIndex = getSpecialIndexWithOrder(testCase.order);

    test(`order index #${idxOfTestCase}`, () => {
      for (const [k, v] of Object.entries(testCase.orderIndex)) {
        expect(getSpecialIndex(k)).toBe(v);
      }
    });
  }

  const orderJson = await fs.readFile(path.resolve(import.meta.dirname, 'order/order.json'));
  const orderList = JSON.parse(orderJson);

  for (const [idxOfTestCase, testCase] of Object.entries(orderList)) {
    test(`sort by order #${idxOfTestCase}`, () => {
      expect(sortbyOrder(testCase.before, testCase.order)).toMatchObject(testCase.after);
    });
  }
});
