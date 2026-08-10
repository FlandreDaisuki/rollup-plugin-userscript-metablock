import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { describe, expect, test } from 'vitest';
import { ALL_META_KEY_NAMES } from '../src/meta.js';

const schemaPath = path.resolve(import.meta.dirname, '../userscript-metadata.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);

describe('userscript metadata schema', () => {
  test('accepts an empty object because the plugin supplies its defaults', () => {
    expect(validate({})).toBe(true);
  });

  test('covers every supported top-level metadata key', () => {
    const schemaMetaKeys = Object.keys(schema.properties)
      .filter((key) => key !== '$schema')
      .sort();

    expect(schemaMetaKeys).toEqual([...ALL_META_KEY_NAMES].sort());
  });

  test('accepts the JSON shape consumed by the file option', () => {
    expect(validate({
      '$schema': schema.$id,
      'name': {
        'default': 'My userscript',
        'zh-TW': '我的使用者腳本',
      },
      'description': 'A useful userscript',
      'namespace': 'example.com/userscripts',
      'version': '1.0',
      'match': ['https://example.com/*'],
      'include': '*://*.example.net/*',
      'exclude': '/^https:\\/\\/private[.]example[.]com\\//',
      'require': 'https://cdn.example.com/dependency.js',
      'resource': {
        stylesheet: 'https://cdn.example.com/style.css',
      },
      'noframes': true,
      'grant': ['unsafeWindow', 'GM_getValue', 'GM.setValue'],
      'run-at': 'document-start',
      'nocompat': true,
    })).toBe(true);
  });

  test.each([
    {
      name: 'an unknown metadata key',
      metadata: { unknown: true },
    },
    {
      name: 'a resource list instead of an object map',
      metadata: { resource: ['style', 'https://example.com/style.css'] },
    },
    {
      name: 'a translation object without its default value',
      metadata: { name: { en: 'My userscript' } },
    },
    {
      name: 'false for a valueless metadata key',
      metadata: { noframes: false },
    },
  ])('rejects $name', ({ metadata }) => {
    expect(validate(metadata)).toBe(false);
  });
});

describe('loose string metadata', () => {
  test.each([
    { grant: 'unsafeWindow' },
    { grant: ['GM_getValue', 'GM.setValue'] },
    { grant: 'a-future-userscript-api' },
    { match: '<all_urls>' },
    { match: ['*://*/*', 'http*://example.com/*'] },
    { include: '/^https:\\/\\/example[.]com\\//' },
    { exclude: ['https://example.com/private/*'] },
  ])('accepts string or string-list value %#', (metadata) => {
    expect(validate(metadata)).toBe(true);
  });

  test.each([
    { grant: 42 },
    { grant: ['GM_getValue', 42] },
    { match: true },
    { include: { pattern: '*' } },
  ])('rejects non-string value %#', (metadata) => {
    expect(validate(metadata)).toBe(false);
  });
});
