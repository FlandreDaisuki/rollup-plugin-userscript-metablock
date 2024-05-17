import { expect } from 'vitest';
import { describe, test } from 'vitest';
import {
  getMetaEntry,
  DEFAULT_META,
  RUN_AT_ENUM,
  SANDBOX_ENUM,
  _binary_enum,
  _ternary_uri,
  _binary_version,
  _unary,
  _binary_uri,
  _binary_uris,
  _binary_string,
  _multilingual,
} from '../src/meta';
import { InvalidMetaValue } from '../src/errors';
import { isGlobURI, isMatchPattern } from '../src/utils';

// FIXME: These tests should be more readable Q_Q

const answerWrap = (k, v) => [].concat(v).map((u) => [k, u]);

describe('getMetaEntry', () => {
  const f = (k, v) => getMetaEntry([k, v], { validator: 'warn', manager: 'ALL' });

  test('name default', () => expect(f('name', null)).toMatchObject(answerWrap('name', DEFAULT_META.name)));
  test('name feature', () => expect(f('name', 'Hello, world')).toMatchObject(answerWrap('name', 'Hello, world')));
  test('nullable', () => expect(f('description', null), null));
  test('space', () => expect(f('description', ' '), null));
  test('namespace default', () => expect(f('namespace', null)).toMatchObject(answerWrap('namespace', DEFAULT_META.namespace)));
  test('namespace feature', () => expect(f('namespace', 'Hello, world')).toMatchObject(answerWrap('namespace', 'Hello, world')));
  test('grant default', () => expect(f('grant', null)).toMatchObject(answerWrap('grant', DEFAULT_META.grant)));
  test('grant feature', () => expect(f('grant', 'GM_getValue')).toMatchObject(answerWrap('grant', 'GM_getValue')));
});

describe('multilingual', () => {
  const f = _multilingual('name');
  const a = (v) => answerWrap('name', v);

  test('null warn', () => expect(f(null, 'warn')).toBe(null));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('bad-type warn', () => expect(f(42, 'warn')).toBe(null));
  test('bad-type error', () => expect(() => f(42, 'error')).toThrow(InvalidMetaValue));

  const goodStr = 'my script';
  test('good string warn', () => expect(f(goodStr, 'warn')).toMatchObject(a(goodStr)));
  test('good string error', () => expect(f(goodStr, 'error')).toMatchObject(a(goodStr)));

  const badObj = { en: 'my script' };
  test('bad object warn', () => expect(f(badObj, 'warn')).toBe( null));
  test('bad object error', () => expect(() => f(badObj, 'error')).toThrow( InvalidMetaValue));

  const goodObj = { en: 'my script', default: 'my script' };
  const goodObjAns = [['name:en', 'my script'], ['name', 'my script']];
  test('good object warn', () => expect(f(goodObj, 'warn')).toMatchObject( goodObjAns));
  test('good object error', () => expect(f(goodObj, 'error')).toMatchObject( goodObjAns));
});

describe('namespace', () => {
  const f = _binary_string('namespace');
  const a = (v) => answerWrap('namespace', v);

  const good = 'My namespace';
  test('null warn', () => expect(f(null, 'warn')).toBe(null));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));

  test('bad-type warn', () => expect(f(42, 'warn')).toBe(null));
  test('bad-type error', () => expect(() => f(42, 'error')).toThrow(InvalidMetaValue));

  test('good warn', () => expect(f(good, 'warn')).toMatchObject(a(good)));
  test('good error', () => expect(f(good, 'error')).toMatchObject(a(good)));
});

describe('icon (binary uri)', () => {
  const f = _binary_uri('icon');
  const a = (v) => answerWrap('icon', v);

  test('null warn', () => expect(f(null, 'warn')).toBe(null));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('bad-type warn', () => expect(f(42, 'warn')).toBe(null));
  test('bad-type error', () => expect(() => f(42, 'error')).toThrow(InvalidMetaValue));

  const bads = [
    'http',
  ];

  for (const [i, bad] of Object.entries(bads)) {
    test(`bad-uri warn ${i}`, () => expect(f(bad, 'warn')).toMatchObject(a(bad)));
    test(`bad-uri error ${i}`, () => expect(() => f(bad, 'error')).toThrow(InvalidMetaValue));
  }

  const goods = [
    'http://example.com/',
    'https://example.com/favicon.ico',
    'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
  ];

  for (const [i, good] of Object.entries(goods)) {
    test(`good-uri warn ${i}`, () => expect(f(good, 'warn')).toMatchObject(a(good)));
    test(`good-uri error ${i}`, () => expect(f(good, 'error')).toMatchObject(a(good)));
  }
});

describe('require (binary uris)', () => {
  const f = _binary_uris('require');
  const a = (v) => answerWrap('require', v);

  test('null warn', () => expect(f(null, 'warn')).toBe(null));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('bad-type warn', () =>  expect(f(42, 'warn')).toBe(null));
  test('bad-type error', () => expect(() => f(42, 'error')).toThrow(InvalidMetaValue));

  const bads = [
    'http',
    ['https', 'http'],
  ];

  for (const [i, bad] of Object.entries(bads)) {
    test(`bad-uri warn ${i}`, () => expect(f(bad, 'warn')).toMatchObject(a(bad)));
    test(`bad-uri error ${i}`, () => expect(() => f(bad, 'error')).toThrow(InvalidMetaValue));
  }

  const goods = [
    'http://example.com/',
    'https://example.com/favicon.ico',
    'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
    [
      'http://example.com/',
      'https://example.com/favicon.ico',
    ],
  ];

  for (const [i, good] of Object.entries(goods)) {
    test(`good-uri warn ${i}`, () => expect(f(good, 'warn')).toMatchObject(a(good)));
    test(`good-uri error ${i}`, () => expect(f(good, 'error')).toMatchObject(a(good)));
  }

  const partial = ['http://example.com/', 'http'];
  test('partial-uri warn', () => expect(f(partial, 'warn')).toMatchObject(a(partial)));
  test('partial-uri error', () => expect(() => f(partial, 'error')).toThrow(InvalidMetaValue));
});

describe('run-at', () => {
  const f = _binary_enum('run-at', RUN_AT_ENUM);
  const a = (v) => answerWrap('run-at', v);

  test('null warn', () => expect(f(null, 'warn')).toMatchObject(a(RUN_AT_ENUM[0])));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));

  test('undefined warn', () => expect(f(undefined, 'warn')).toBe(null));
  test('undefined error', () => expect(() => f(undefined, 'error')).toThrow(InvalidMetaValue));

  test('valid enum warn', () => expect(f('document-start', 'warn')).toMatchObject(a('document-start')));
  test('valid enum error', () => expect(f('document-start', 'error')).toMatchObject(a('document-start')));

  test('invalid enum warn', () => expect(f('hello', 'warn')).toMatchObject(a(RUN_AT_ENUM[0])));
  test('invalid enum error', () => expect(() => f('hello', 'error')).toThrow(InvalidMetaValue));
});

describe('resource', () => {
  const f = _ternary_uri('resource');
  const good = {
    csv: 'https://my.data/data.csv',
    bgm: 'https://my.data/bgm.mp3',
  };
  const goodAnswer = Object.entries(good).map((v) => ['resource', ...v]);

  test('falsy warn', () => expect(f(null, 'warn')).toBe(null));
  test('falsy error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('bad-type warn', () => expect(f('bad-type', 'warn')).toBe(null));
  test('bad-type error', () => expect(() => f('bad-type', 'error')).toThrow(InvalidMetaValue));
  test('unknown meta value warn', () => expect(f({ 'unknown meta value': 42 }, 'warn')).toEqual([['resource', 'unknown meta value', '42']]));
  test('unknown meta value error', () => expect(() => f({ 'unknown meta value': 42 }, 'error')).toThrow(InvalidMetaValue));
  test('{} warn', () => expect(f({}, 'warn')).toEqual([]));
  test('{} error', () => expect(f({}, 'error')).toEqual([]));
  test('good warn', () => expect(f(good, 'warn')).toEqual(goodAnswer));
  test('good error', () => expect(f(good, 'error')).toEqual(goodAnswer));
});

describe('version', () => {
  const f = _binary_version('version');
  const a = (v) => answerWrap('version', v);

  test('falsy warn', () => expect(f(null, 'warn')).toBe(null));
  test('falsy error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('coerce warn', () => expect(f('1', 'warn')).toMatchObject(a('1.0.0')));
  test('coerce error', () => expect(() => f('1', 'error')).toThrow(InvalidMetaValue));
  test('unknown meta value warn', () => expect(f('hello.world', 'warn')).toBe(null));
  test('unknown meta value error', () => expect(() => f('hello.world', 'error')).toThrow(InvalidMetaValue));
  test('good warn', () => expect(f('1.2.3', 'warn')).toMatchObject(a('1.2.3')));
  test('good error', () => expect(f('1.2.3', 'error')).toMatchObject(a('1.2.3')));
});

describe('noframes (unary)', () => {
  const f = _unary('noframes');
  const a = [['noframes']];

  test('falsy warn', () => expect(f(null, 'warn')).toBe(null));
  test('falsy error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));
  test('trusy warn', () => expect(f(42, 'warn')).toMatchObject(a));
  test('trusy error', () => expect(f(42, 'error')).toMatchObject(a));
  test('good warn', () => expect(f(true, 'warn')).toMatchObject(a));
  test('good error', () => expect(f(true, 'error')).toMatchObject(a));
});

describe('match patterns', () => {
  const badMatchPatterns = [
    null,
    ' ',
    '*',
    'http://www.google.com',
    'http://*foo/bar',
    'http://foo.*.bar/baz',
    'http:/bar',
    'foo://*',
  ];

  for (const [i, bad] of Object.entries(badMatchPatterns)) {
    test(`bad match pattern #${i}`, () => expect(isMatchPattern(bad)).toBe(false));
  }

  const goodMatchPatterns = [
    'http://*/*',
    'http://*/foo*',
    'https://*.google.com/foo*bar',
    'http://example.org/foo/bar.html',
    'file:///foo*',
    '*://mail.google.com/*',
  ];

  for (const [i, good] of Object.entries(goodMatchPatterns)) {
    test(`good match pattern #${i}`, () => expect(isMatchPattern(good)).toBe(true));
  }
});

describe('glob uris', () => {
  const badGlobURIs = [null, ' '];

  for (const [i, bad] of Object.entries(badGlobURIs)) {
    test(`bad glob uri #${i}`, () => expect(isGlobURI(bad)).toBe(false));
  }

  const goodGlobURIs = [
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
  ];

  for (const [i, good] of Object.entries(goodGlobURIs)) {
    test(`good glob uri #${i}`, () => expect(isGlobURI(good)).toBe(true));
  }
});

describe('sandbox', () => {
  const f = _binary_enum('sandbox', SANDBOX_ENUM);
  const a = (v) => answerWrap('sandbox', v);

  test('null warn', () => expect(f(null, 'warn')).toMatchObject(a(SANDBOX_ENUM[0])));
  test('null error', () => expect(() => f(null, 'error')).toThrow(InvalidMetaValue));

  test('undefined warn', () => expect(f(undefined, 'warn')).toBe(null));
  test('undefined error', () => expect(() => f(undefined, 'error')).toThrow(InvalidMetaValue));

  test('valid enum warn', () => expect(f('raw', 'warn')).toMatchObject(a('raw')));
  test('valid enum error', () => expect(f('raw', 'error')).toMatchObject(a('raw')));

  test('invalid enum warn', () => expect(f('hello', 'warn')).toMatchObject(a(SANDBOX_ENUM[0])));
  test('invalid enum error', () => expect(() => f('hello', 'error')).toThrow(InvalidMetaValue));
});
