import { throws, deepEqual, strictEqual } from 'assert';
import { loadFile, SIMPLEST_META, getValidOrder, getSpecialIndexWithOrder, sortbyOrder } from '../../src/options';
import { FileNotFound, UnsupportedFormat } from '../../src/errors';
import { YAMLException } from 'js-yaml';

process.chdir(__dirname);

describe('options:file', () => {
  const ref = {
    name: 'test',
    description: 'This is a test',
    include: [
      'http://*',
      'https://*',
    ],
  };

  it('null/empty', () => {
    deepEqual(loadFile(null), SIMPLEST_META);
    deepEqual(loadFile(''), SIMPLEST_META);
  });

  it('not exists', () => {
    throws(() => loadFile('not_exist.json'), FileNotFound);
  });

  it('unsupport format', () => {
    throws(() => loadFile(`${__dirname}/file/bads/meta.ini`), UnsupportedFormat);
  });

  it('json', () => {
    deepEqual(ref, loadFile(`${__dirname}/file/goods/meta.json`));
    throws(() => loadFile(`${__dirname}/file/bads/meta.json`));
  });

  it('js', () => {
    deepEqual(ref, loadFile(`${__dirname}/file/goods/meta.js`));
    deepEqual(ref, loadFile(`${__dirname}/file/goods/meta.esm.js`));
    throws(() => loadFile(`${__dirname}/file/bads/meta.js`), Error);
  });

  it('yml', () => {
    deepEqual(ref, loadFile(`${__dirname}/file/goods/meta.yml`));
    throws(() => loadFile(`${__dirname}/file/bads/meta.yml`), YAMLException);
  });
});

describe('options:order', () => {
  const before = ['name', '...', 'not-metakeys', '...', 'grant', 'name:zh-TW'];
  const after = ['name', '...', 'grant'];
  it('getValidOrder()', () => {
    deepEqual(after, getValidOrder(before));
  });

  const orderIndexList = require(`${__dirname}/order/orderIndex.json`);
  for (const index in orderIndexList) {
    const test = orderIndexList[index];
    const getSpecialIndex = getSpecialIndexWithOrder(test.order);

    it(`order index #${index}`, () => {
      Object.entries(test.orderIndex).forEach(([k, v]) => {
        strictEqual(v, getSpecialIndex(k));
      });
    });
  }

  const orderList = require(`${__dirname}/order/order.json`);
  for (const index in orderList) {
    const test = orderList[index];

    it(`sort by order #${index}`, () => {
      const sorted = sortbyOrder(test.before, test.order);
      deepEqual(sorted, test.after);
    });
  }

});
