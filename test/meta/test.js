import { throws, deepStrictEqual, strictEqual } from 'assert';
import { getMetaEntry, DEFAULT_METAS, RUNAT_ENUM, _binary_enum, _ternary_uri, _binary_version, _unary, _binary_uri, _binary_uris, _binary_string, _multilingual } from '../../src/meta';
import { InvalidMetaValue } from '../../src/errors';
import { isMatchPattern, isGlobURI } from '../../src/utils';

process.chdir(__dirname);

describe('meta', () => {
  const deepStrictSetEqual = (a, b) => deepStrictEqual(new Set(a), new Set(b));
  const answerWrap = (k, v) => [].concat(v).map(u => [k, u]);

  describe('getMetaEntry', () => {
    const f = (k, v) => getMetaEntry([k, v], { validator: 'warn', manager: 'ALL' });

    it('name default', () => deepStrictEqual(f('name', null), answerWrap('name', DEFAULT_METAS.name)));
    it('name feature', () => deepStrictEqual(f('name', 'Hello, world'), answerWrap('name', 'Hello, world')));
    it('nullable', () => deepStrictEqual(f('description', null), null));
    it('space', () => deepStrictEqual(f('description', ' '), null));
    it('namespace default', () => deepStrictEqual(f('namespace', null), answerWrap('namespace', DEFAULT_METAS.namespace)));
    it('namespace feature', () => deepStrictEqual(f('namespace', 'Hello, world'), answerWrap('namespace', 'Hello, world')));
    it('grant default', () => deepStrictEqual(f('grant', null), answerWrap('grant', DEFAULT_METAS.grant)));
    it('grant feature', () => deepStrictEqual(f('grant', 'GM_getValue'), answerWrap('grant', 'GM_getValue')));
  });

  describe('multilingual', () => {
    const f = _multilingual('name');
    const a = (v) => answerWrap('name', v);

    it('null warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('null error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('bad-type warn', () => deepStrictEqual(f(42, 'warn'), null));
    it('bad-type error', () => throws(() => f(42, 'error'), InvalidMetaValue));

    const goodStr = 'my script';
    it('good string warn', () => deepStrictEqual(f(goodStr, 'warn'), a(goodStr)));
    it('good string error', () => deepStrictEqual(f(goodStr, 'error'), a(goodStr)));

    const badObj = { en: 'my script' };
    it('bad object warn', () => deepStrictEqual(f(badObj, 'warn'), null));
    it('bad object error', () => throws(() => f(badObj, 'error'), InvalidMetaValue));

    const goodObj = { en: 'my script', default: 'my script' };
    const goodObjAns = [['name:en', 'my script'], ['name', 'my script']];
    it('good object warn', () => deepStrictSetEqual(f(goodObj, 'warn'), goodObjAns));
    it('good object error', () => deepStrictSetEqual(f(goodObj, 'error'), goodObjAns));
  });

  describe('namespace', () => {
    const f = _binary_string('namespace');
    const a = (v) => answerWrap('namespace', v);

    const good = 'My namespace';
    it('null warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('null error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('bad-type warn', () => deepStrictEqual(f(42, 'warn'), null));
    it('bad-type error', () => throws(() => f(42, 'error'), InvalidMetaValue));
    it('good warn', () => deepStrictEqual(f(good, 'warn'), a(good)));
    it('good error', () => deepStrictEqual(f(good, 'error'), a(good)));
  });

  describe('icon (binary uri)', () => {
    const bads = [
      'http',
    ];

    const goods = [
      'http://example.com/',
      'https://example.com/favicon.ico',
      'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
    ];

    const f = _binary_uri('icon');
    const a = (v) => answerWrap('icon', v);

    it('null warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('null error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('bad-type warn', () => deepStrictEqual(f(42, 'warn'), null));
    it('bad-type error', () => throws(() => f(42, 'error'), InvalidMetaValue));

    bads.forEach((bad, i) => {
      it(`bad-uri warn ${i}`, () => deepStrictEqual(f(bad, 'warn'), a(bad)));
      it(`bad-uri error ${i}`, () => throws(() => f(bad, 'error'), InvalidMetaValue));
    });

    goods.forEach((good, i) => {
      it(`good-uri warn ${i}`, () => deepStrictEqual(f(good, 'warn'), a(good)));
      it(`good-uri error ${i}`, () => deepStrictEqual(f(good, 'error'), a(good)));
    });


  });

  describe('require (binary uris)', () => {
    const f = _binary_uris('require');
    const a = (v) => answerWrap('require', v);

    it('null warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('null error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('bad-type warn', () => deepStrictEqual(f(42, 'warn'), null));
    it('bad-type error', () => throws(() => f(42, 'error'), InvalidMetaValue));

    const bads = [
      'http',
      ['https', 'http'],
    ];

    const goods = [
      'http://example.com/',
      'https://example.com/favicon.ico',
      'data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAwAAAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFzByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSpa/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJlZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uisF81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PHhhx4dbgYKAAA7',
      [
        'http://example.com/',
        'https://example.com/favicon.ico',
      ],
    ];

    const partial = ['http://example.com/', 'http'];

    bads.forEach((bad, i) => {
      it(`bad-uri warn ${i}`, () => deepStrictEqual(f(bad, 'warn'), a(bad)));
      it(`bad-uri error ${i}`, () => throws(() => f(bad, 'error'), InvalidMetaValue));
    });

    goods.forEach((good, i) => {
      it(`good-uri warn ${i}`, () => deepStrictEqual(f(good, 'warn'), a(good)));
      it(`good-uri error ${i}`, () => deepStrictEqual(f(good, 'error'), a(good)));
    });

    it('partial-uri warn', () => deepStrictEqual(f(partial, 'warn'), a(partial)));
    it('partial-uri error', () => throws(() => f(partial, 'error'), InvalidMetaValue));

  });

  describe('run-at', () => {
    const f = _binary_enum('run-at', RUNAT_ENUM);
    const a = (v) => answerWrap('run-at', v);

    it('null warn', () => deepStrictEqual(f(null, 'warn'), a(RUNAT_ENUM[0])));
    it('null error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('undefined warn', () => deepStrictEqual(f(undefined, 'warn'), null));
    it('undefined error', () => throws(() => f(undefined, 'error'), InvalidMetaValue));
    it('start warn', () => deepStrictEqual(f('document-start', 'warn'), a('document-start')));
    it('start error', () => deepStrictEqual(f('document-start', 'error'), a('document-start')));
  });

  describe('resource', () => {
    const f = _ternary_uri('resource');
    const good = {
      csv: 'https://my.data/data.csv',
      bgm: 'https://my.data/bgm.mp3',
    };
    const goodAnswer = Object.entries(good).map(v => ['resource', ...v]);

    it('falsy warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('falsy error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('bad-type warn', () => deepStrictEqual(f('bad-type', 'warn'), null));
    it('bad-type error', () => throws(() => f('bad-type', 'error'), InvalidMetaValue));
    it('bad-metavalue warn', () => deepStrictEqual(f({ 'bad-metavalue': 42 }, 'warn'), [['resource', 'bad-metavalue', '42']]));
    it('bad-metavalue error', () => throws(() => f({ 'bad-metavalue': 42 }, 'error'), InvalidMetaValue));
    it('{} warn', () => deepStrictEqual(f({}, 'warn'), []));
    it('{} error', () => deepStrictEqual(f({}, 'error'), []));
    it('good warn', () => deepStrictEqual(f(good, 'warn'), goodAnswer));
    it('good error', () => deepStrictEqual(f(good, 'error'), goodAnswer));
  });

  describe('version', () => {
    const f = _binary_version('version');
    const a = (v) => answerWrap('version', v);

    it('falsy warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('falsy error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('coerce warn', () => deepStrictEqual(f('1', 'warn'), a('1.0.0')));
    it('coerce error', () => throws(() => f('1', 'error'), InvalidMetaValue));
    it('bad-metavalue warn', () => deepStrictEqual(f('hello.world', 'warn'), null));
    it('bad-metavalue error', () => throws(() => f('hello.world', 'error'), InvalidMetaValue));
    it('good warn', () => deepStrictEqual(f('1.2.3', 'warn'), a('1.2.3')));
    it('good error', () => deepStrictEqual(f('1.2.3', 'error'), a('1.2.3')));
  });

  describe('noframes (unary)', () => {
    const f = _unary('noframes');
    const a = [['noframes']];

    it('falsy warn', () => deepStrictEqual(f(null, 'warn'), null));
    it('falsy error', () => throws(() => f(null, 'error'), InvalidMetaValue));
    it('trusy warn', () => deepStrictEqual(f(42, 'warn'), a));
    it('trusy error', () => deepStrictEqual(f(42, 'error'), a));
    it('good warn', () => deepStrictEqual(f(true, 'warn'), a));
    it('good error', () => deepStrictEqual(f(true, 'error'), a));
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

    badMatchPatterns.forEach((bad, i) => {
      it(`bad match pattern #${i}`, () => {
        strictEqual(isMatchPattern(bad), false);
      });
    });

    const goodMatchPatterns = [
      'http://*/*',
      'http://*/foo*',
      'https://*.google.com/foo*bar',
      'http://example.org/foo/bar.html',
      'file:///foo*',
      '*://mail.google.com/*',
    ];

    goodMatchPatterns.forEach((good, i) => {
      it(`good match pattern #${i}`, () => {
        strictEqual(isMatchPattern(good), true);
      });
    });
  });

  describe('globuris', () => {
    const badGlobURIs = [null, ' '];

    badGlobURIs.forEach((bad, i) => {
      it(`bad globuri #${i}`, () => {
        strictEqual(isGlobURI(bad), false);
      });
    });

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

    goodGlobURIs.forEach((good, i) => {
      it(`good globuri #${i}`, () => {
        strictEqual(isGlobURI(good), true);
      });
    });
  });
});
