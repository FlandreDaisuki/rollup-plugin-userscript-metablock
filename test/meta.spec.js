import { describe, expect, test } from 'vitest';
import {
  ANTIFEATURE_ENUM,
  DEFAULT_META,
  RUN_AT_ENUM,
  SANDBOX_ENUM,
  _binary_enum,
  _binary_string,
  _binary_strings,
  _binary_uri,
  _binary_uris,
  _binary_version,
  _multilingual,
  _ternary_uri,
  _unary,
  getMetaEntry,
} from '../src/meta.js';
import { InvalidMetaValue } from '../src/errors.js';
import { isGlobURI, isMatchPattern } from '../src/utils.js';

const entriesFor = (key, values) => [].concat(values).map((value) => [key, value]);

describe('getMetaEntry', () => {
  const getEntry = (key, value) => getMetaEntry(
    [key, value],
    { validator: 'warn', manager: 'ALL' },
  );

  test.each([
    {
      name: 'uses the default name when it is missing',
      key: 'name',
      value: null,
      expected: entriesFor('name', DEFAULT_META.name),
    },
    {
      name: 'uses a provided name',
      key: 'name',
      value: 'Hello, world',
      expected: entriesFor('name', 'Hello, world'),
    },
    {
      name: 'omits a missing optional description',
      key: 'description',
      value: null,
      expected: null,
    },
    {
      name: 'omits a blank optional description',
      key: 'description',
      value: ' ',
      expected: null,
    },
    {
      name: 'uses the default namespace when it is missing',
      key: 'namespace',
      value: null,
      expected: entriesFor('namespace', DEFAULT_META.namespace),
    },
    {
      name: 'uses a provided namespace',
      key: 'namespace',
      value: 'Hello, world',
      expected: entriesFor('namespace', 'Hello, world'),
    },
    {
      name: 'uses the default grant when it is missing',
      key: 'grant',
      value: null,
      expected: entriesFor('grant', DEFAULT_META.grant),
    },
    {
      name: 'uses a provided grant',
      key: 'grant',
      value: 'GM_getValue',
      expected: entriesFor('grant', 'GM_getValue'),
    },
  ])('$name', ({ key, value, expected }) => {
    expect(getEntry(key, value)).toEqual(expected);
  });
});

describe('multilingual metadata', () => {
  const parseName = _multilingual('name');

  test.each([
    { name: 'a missing value', value: null },
    { name: 'an unsupported value type', value: 42 },
    { name: 'an object without a default translation', value: { en: 'my script' } },
  ])('returns null for $name in warn mode', ({ value }) => {
    expect(parseName(value, 'warn')).toBeNull();
  });

  test.each([
    { name: 'a missing value', value: null },
    { name: 'an unsupported value type', value: 42 },
    { name: 'an object without a default translation', value: { en: 'my script' } },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseName(value, 'error')).toThrow(InvalidMetaValue);
  });

  test.each(['warn', 'error'])('accepts a string in %s mode', (validator) => {
    expect(parseName('my script', validator)).toEqual(entriesFor('name', 'my script'));
  });

  test.each(['warn', 'error'])('expands translations in %s mode', (validator) => {
    expect(parseName(
      { en: 'my script', default: 'my script' },
      validator,
    )).toEqual([
      ['name:en', 'my script'],
      ['name', 'my script'],
    ]);
  });
});

describe('string metadata', () => {
  const parseNamespace = _binary_string('namespace');

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
  ])('returns null for $name in warn mode', ({ value }) => {
    expect(parseNamespace(value, 'warn')).toBeNull();
  });

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseNamespace(value, 'error')).toThrow(InvalidMetaValue);
  });

  test.each(['warn', 'error'])('accepts a string in %s mode', (validator) => {
    expect(parseNamespace('My namespace', validator))
      .toEqual(entriesFor('namespace', 'My namespace'));
  });
});

describe('URI metadata', () => {
  const parseIcon = _binary_uri('icon');

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
  ])('returns null for $name in warn mode', ({ value }) => {
    expect(parseIcon(value, 'warn')).toBeNull();
  });

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseIcon(value, 'error')).toThrow(InvalidMetaValue);
  });

  test('retains an invalid URI in warn mode', () => {
    expect(parseIcon('http', 'warn')).toEqual(entriesFor('icon', 'http'));
  });

  test('throws for an invalid URI in error mode', () => {
    expect(() => parseIcon('http', 'error')).toThrow(InvalidMetaValue);
  });

  test.each([
    { name: 'HTTP URL', value: 'http://example.com/' },
    { name: 'HTTPS URL', value: 'https://example.com/favicon.ico' },
    {
      name: 'data URL',
      value: 'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
    },
  ])('accepts a $name', ({ value }) => {
    expect(parseIcon(value, 'error')).toEqual(entriesFor('icon', value));
  });
});

describe('URI-list metadata', () => {
  const parseRequire = _binary_uris('require');

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
  ])('returns null for $name in warn mode', ({ value }) => {
    expect(parseRequire(value, 'warn')).toBeNull();
  });

  test.each([
    { name: 'a missing value', value: null },
    { name: 'a non-string value', value: 42 },
    { name: 'an invalid URI', value: 'http' },
    { name: 'multiple invalid URIs', value: ['https', 'http'] },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseRequire(value, 'error')).toThrow(InvalidMetaValue);
  });

  test.each([
    { name: 'HTTP URL', value: 'http://example.com/' },
    { name: 'HTTPS URL', value: 'https://example.com/favicon.ico' },
    {
      name: 'data URL',
      value: 'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
    },
    {
      name: 'URL array',
      value: ['http://example.com/', 'https://example.com/favicon.ico'],
    },
  ])('accepts a $name', ({ value }) => {
    expect(parseRequire(value, 'error')).toEqual(entriesFor('require', value));
  });

  test('retains invalid entries in warn mode', () => {
    const values = ['http://example.com/', 'http'];

    expect(parseRequire(values, 'warn')).toEqual(entriesFor('require', values));
  });
});

describe.each([
  { key: 'run-at', values: RUN_AT_ENUM, validValue: 'document-start' },
  { key: 'sandbox', values: SANDBOX_ENUM, validValue: 'raw' },
])('$key enum metadata', ({ key, values, validValue }) => {
  const parseEnum = _binary_enum(key, values);
  const defaultEntry = entriesFor(key, values[0]);

  test('uses the first enum value for null in warn mode', () => {
    expect(parseEnum(null, 'warn')).toEqual(defaultEntry);
  });

  test('throws for null in error mode', () => {
    expect(() => parseEnum(null, 'error')).toThrow(InvalidMetaValue);
  });

  test('returns null for undefined in warn mode', () => {
    expect(parseEnum(undefined, 'warn')).toBeNull();
  });

  test('throws for undefined in error mode', () => {
    expect(() => parseEnum(undefined, 'error')).toThrow(InvalidMetaValue);
  });

  test.each(['warn', 'error'])('accepts an enum member in %s mode', (validator) => {
    expect(parseEnum(validValue, validator)).toEqual(entriesFor(key, validValue));
  });

  test('uses the first enum value for an invalid member in warn mode', () => {
    expect(parseEnum('hello', 'warn')).toEqual(defaultEntry);
  });

  test('throws for an invalid member in error mode', () => {
    expect(() => parseEnum('hello', 'error')).toThrow(InvalidMetaValue);
  });
});

describe('resource metadata', () => {
  const parseResource = _ternary_uri('resource');
  const resources = {
    csv: 'https://my.data/data.csv',
    bgm: 'https://my.data/bgm.mp3',
  };
  const expectedResources = Object.entries(resources)
    .map((entry) => ['resource', ...entry]);

  test('returns null for a missing value in warn mode', () => {
    expect(parseResource(null, 'warn')).toBeNull();
  });

  test('throws for a missing value in error mode', () => {
    expect(() => parseResource(null, 'error')).toThrow(InvalidMetaValue);
  });

  test('returns null for a non-object value in warn mode', () => {
    expect(parseResource('bad-type', 'warn')).toBeNull();
  });

  test('throws for a non-object value in error mode', () => {
    expect(() => parseResource('bad-type', 'error')).toThrow(InvalidMetaValue);
  });

  test('stringifies an invalid resource value in warn mode', () => {
    expect(parseResource({ unknown: 42 }, 'warn'))
      .toEqual([['resource', 'unknown', '42']]);
  });

  test('throws for an invalid resource value in error mode', () => {
    expect(() => parseResource({ unknown: 42 }, 'error')).toThrow(InvalidMetaValue);
  });

  test.each(['warn', 'error'])('accepts an empty object in %s mode', (validator) => {
    expect(parseResource({}, validator)).toEqual([]);
  });

  test.each(['warn', 'error'])('accepts valid resources in %s mode', (validator) => {
    expect(parseResource(resources, validator)).toEqual(expectedResources);
  });
});

describe('version metadata', () => {
  const parseVersion = _binary_version('version');

  test('returns null for a missing version in warn mode', () => {
    expect(parseVersion(null, 'warn')).toBeNull();
  });

  test('throws for a missing version in error mode', () => {
    expect(() => parseVersion(null, 'error')).toThrow(InvalidMetaValue);
  });

  test('coerces a partial version in warn mode', () => {
    expect(parseVersion('1', 'warn')).toEqual(entriesFor('version', '1.0.0'));
  });

  test('throws for a partial version in error mode', () => {
    expect(() => parseVersion('1', 'error')).toThrow(InvalidMetaValue);
  });

  test('returns null for an invalid version in warn mode', () => {
    expect(parseVersion('hello.world', 'warn')).toBeNull();
  });

  test('throws for an invalid version in error mode', () => {
    expect(() => parseVersion('hello.world', 'error')).toThrow(InvalidMetaValue);
  });

  test.each(['warn', 'error'])('accepts a valid version in %s mode', (validator) => {
    expect(parseVersion('1.2.3', validator))
      .toEqual(entriesFor('version', '1.2.3'));
  });
});

describe.each(['noframes', 'unwrap'])('%s unary metadata', (key) => {
  const parseUnary = _unary(key);
  const expected = [[key]];

  test('returns null for a falsy value in warn mode', () => {
    expect(parseUnary(null, 'warn')).toBeNull();
  });

  test('throws for a falsy value in error mode', () => {
    expect(() => parseUnary(null, 'error')).toThrow(InvalidMetaValue);
  });

  test.each([
    { name: 'boolean true', value: true },
    { name: 'a non-boolean truthy value', value: 42 },
  ])('accepts $name', ({ value }) => {
    expect(parseUnary(value, 'error')).toEqual(expected);
  });
});

describe('match-pattern validation', () => {
  test.each([
    { name: 'null', value: null },
    { name: 'blank text', value: ' ' },
    { name: 'a bare wildcard', value: '*' },
    { name: 'a URL without a path', value: 'http://www.google.com' },
    { name: 'a wildcard in the hostname prefix', value: 'http://*foo/bar' },
    { name: 'a wildcard inside the hostname', value: 'http://foo.*.bar/baz' },
    { name: 'a malformed URL', value: 'http:/bar' },
    { name: 'an unsupported scheme', value: 'foo://*' },
  ])('rejects $name', ({ value }) => {
    expect(isMatchPattern(value)).toBe(false);
  });

  test.each([
    'http://*/*',
    'http://*/foo*',
    'https://*.google.com/foo*bar',
    'http://example.org/foo/bar.html',
    'file:///foo*',
    '*://mail.google.com/*',
  ])('accepts %s', (value) => {
    expect(isMatchPattern(value)).toBe(true);
  });
});

describe('glob-URI validation', () => {
  test.each([
    { name: 'null', value: null },
    { name: 'blank text', value: ' ' },
  ])('rejects $name', ({ value }) => {
    expect(isGlobURI(value)).toBe(false);
  });

  test.each([
    '*',
    'http://www.google.com',
    'http://*foo/bar',
    'http://foo.*.bar/baz',
    'http:/bar',
    'foo://*',
    'http://*/*',
    'http://*/foo*',
    'https://*.google.com/foo*bar',
    'http://example.org/foo/bar.html',
    'file:///foo*',
    '*://mail.google.com/*',
  ])('accepts %s', (value) => {
    expect(isGlobURI(value)).toBe(true);
  });
});

describe('antifeature metadata', () => {
  const parseAntifeature = _binary_strings('antifeature', {
    message: (key) => `${key}'s metaValue should be one of [${ANTIFEATURE_ENUM.join(', ')}]`,
    apply: (value) => ANTIFEATURE_ENUM.includes(value),
  });

  test.each([
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
  ])('returns null for $name in warn mode', ({ value }) => {
    expect(parseAntifeature(value, 'warn')).toBeNull();
  });

  test.each([
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseAntifeature(value, 'error')).toThrow(InvalidMetaValue);
  });

  test.each([
    { name: 'one valid value', value: 'ads' },
    { name: 'multiple valid values', value: ['ads', 'miner'] },
  ])('accepts $name', ({ value }) => {
    expect(parseAntifeature(value, 'error')).toEqual(entriesFor('antifeature', value));
  });

  test.each([
    { name: 'one invalid value', value: 'virus' },
    { name: 'a mixture of valid and invalid values', value: ['ads', 'virus'] },
  ])('retains $name in warn mode', ({ value }) => {
    expect(parseAntifeature(value, 'warn')).toEqual(entriesFor('antifeature', value));
  });

  test.each([
    { name: 'one invalid value', value: 'virus' },
    { name: 'a mixture of valid and invalid values', value: ['ads', 'virus'] },
  ])('throws for $name in error mode', ({ value }) => {
    expect(() => parseAntifeature(value, 'error')).toThrow(InvalidMetaValue);
  });
});
