import fs from 'fs';
import path from 'path';
import debug from 'debug';
import YAML from 'js-yaml';
import chalk from 'chalk';
import { isUri } from 'valid-url';
import semver from 'semver';
import MagicString from 'magic-string';

const jclone = (o) => JSON.parse(JSON.stringify(o));
const isString = (v) => typeof(v) === 'string';
const isObject = (v) => typeof(v) === 'object' && v !== null;
const isMatchPattern = (s) => /^([*]|https?|file|ftp):\/\/([*]|(?:\*\.)?[^*/]*)\/.*$/u.test(s);
const isGlobURI = (s) => (/^\/.*\/$/).test(s) || Boolean(isUri(s)) || (isString(s) && s.includes('*'));
const isIPv4 = (s) => {
  if (/^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/.test(s)) {
    return s.split('.').filter(Boolean).map((t) => parseInt(t)).every((n) => n >= 0 && n <= 255);
  }
  return false;
};
const noop = () => {};
const isTestEnv = process.env.NODE_ENV === 'test';

const print = {
  warn: !isTestEnv ? console.warn.bind(console, chalk.yellow('⚠')) : noop,
};

class FileNotFound extends Error {}
class UnsupportedFormat extends Error {}
class UnknownScriptManager extends Error {}
class UnknownMetakeyToScriptManager extends Error {}
class InvalidMetaValue extends Error {}

const DEFAULT_METAS = {
  name: 'New Script',
  namespace: 'npmjs.com/rollup-plugin-userscript-metablock',
  grant: 'none',
};

const getMetaEntry = ([metakey, metavalue], { validator, manager }) => {
  debug('meta:getMetaEntry::[metakey, metavalue]')([metakey, metavalue]);
  const { keynames, keyfuncs } = getMetakeyDataByManager(manager);

  const mk = metakey.trim();

  let mv = metavalue;
  if (isString(metavalue)) {
    mv = metavalue.trim();
  } else if (Array.isArray(metavalue) && metavalue.length && metavalue.every(isString)) {
    mv = metavalue.map((v) => v.trim());
  } else if (isObject(metavalue)) {
    mv = Object.entries(metavalue)
      .map(([k, v]) => {
        if (isString(v)) {
          return [k, v.trim()];
        }
        return [k, v];
      })
      .reduce((prev, [k, v]) => {
        prev[k] = v;
        return prev;
      }, {});
  }

  if (!keynames.includes(mk)) {
    if (validator === 'warn') { print.warn(`The script manager doesn't support metakey: ${mk}`); }
    if (validator === 'error') {
      throw new UnknownMetakeyToScriptManager(`The script manager doesn't support metakey: ${mk}`);
    }
    return null;
  }

  const result = keyfuncs[mk](mv, validator, manager);
  const defmeta = DEFAULT_METAS[mk];
  return defmeta ? result || [[mk, defmeta]] : result;
};

const _validator_tmpl = (vtor, msg) => {
  if (vtor === 'warn') { print.warn(msg); }
  if (vtor === 'error') { throw new InvalidMetaValue(msg); }
};

const _multilingual = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return [[keyname, val]];
  } else if (isObject(val)) {
    if (!val.default) {
      _validator_tmpl(vtor, `${keyname}.default is required`);
      return null;
    }

    return Object.entries(val).map(([lang, text]) => [`${keyname}${lang === 'default' ? '' : ':' + lang}`, text]);
  } else {
    _validator_tmpl(vtor, `${keyname}'s matavalue is an invalid type`);
    return null;
  }
};

const _binary_string = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return [[keyname, val]];
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be string type`);
    return null;
  }
};

const _binary_strings = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return _binary_string(keyname)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      return prev.concat(_binary_string(keyname)(curr, vtor));
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be string or string[] type`);
    return null;
  }
};

const _binary_uri = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (!isUri(val)) {
      _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid URI`);
    }
    return [[keyname, val]];
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be string type`);
    return null;
  }
};

const _binary_uris = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return _binary_uri(keyname)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      return prev.concat(_binary_uri(keyname)(curr, vtor));
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be string or string[] type`);
    return null;
  }
};

const _binary_globuri = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (isGlobURI(val)) {
      return [[keyname, val]];
    } else {
      return _binary_uri(keyname)(val, vtor);
    }
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be globuri string type`);
    return null;
  }
};

const _binary_globuris = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return _binary_globuri(keyname)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      return prev.concat(_binary_globuri(keyname)(curr, vtor));
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be globuri string or globuri string[] type`);
    return null;
  }
};

const _binary_enum = (keyname, enumset) => (val, vtor) => {
  if (val === undefined) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be undefined`);
    return null;
  }
  const _set = new Set(enumset);
  if (_set.has(val)) {
    return [[keyname, val]];
  } else {
    const setstr = [..._set].join(', ');
    _validator_tmpl(vtor, `${keyname}'s metavalue should be one of [${setstr}]`);

    const first = [..._set][0];
    print.warn('Set default value:', first);
    return [[keyname, first]];
  }
};

const _ternary_uri = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isObject(val)) {
    const entries = Object.entries(val);
    for (const [rname, uri] of entries) {
      if (!isUri(String(uri))) {
        _validator_tmpl(vtor, `${keyname}.${rname} metavalue should be a valid URI`);
      }
    }
    return entries.map((entry) => [keyname, ...entry.map(String)]);
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be object type`);
    return null;
  }
};

const _binary_version = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (semver.valid(val)) {
    return [[keyname, semver.clean(val)]];
  }

  const coerce = semver.coerce(val);
  if (semver.valid(coerce)) {
    _validator_tmpl(vtor, `${keyname} can be transform to ${coerce}`);
    return [[keyname, coerce.version]];
  } else {
    _validator_tmpl(vtor, `${keyname}'s matavalue is invalid`);
    return null;
  }
};

const _unary = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }
  return val ? [[keyname]] : null;
};

const _binary_matches = (keyname) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (!isMatchPattern(val)) {
      _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid match pattern string`);
    }
    return [[keyname, val]];
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      if (isString(curr)) {
        if (!isMatchPattern(curr)) {
          _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid match pattern string`);
        }
        return prev.concat([[keyname, curr]]);
      }
      return prev;
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be match pattern string or match pattern string[] type`);
    return null;
  }
};

/* eslint-disable-next-line no-unused-vars */
const _binary_grant = (val, vtor, sm) => {
  const keyname = 'grant';
  if (!val) {
    return [[keyname, 'none']];
  } else if (isString(val)) {
    // TODO: script manager dependency
    return [[keyname, val]];
  } else if (Array.isArray(val) && val.length && val.every(isString)) {
    // TODO: script manager dependency
    return val.map((v) => [keyname, v]);
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be ${keyname} string or ${keyname} string[] type`);
    return null;
  }
};

const RUNAT_ENUM = ['end', 'start', 'idle', 'body'].map((s) => `document-${s}`).concat('context-menu');
const INJECTINTO_ENUM = ['page', 'content', 'auto'];

const BASIC_METAKEY_FUNCS = {
  name: _multilingual('name'),
  description: _multilingual('description'),
  namespace: _binary_string('namespace'),
  match: _binary_matches('match'),
  include: _binary_globuris('include'),
  exclude: _binary_globuris('exclude'),
  icon: _binary_uri('icon'),
  require: _binary_uris('require'),
  'run-at': _binary_enum('run-at', RUNAT_ENUM),
  resource: _ternary_uri('resource'),
  version: _binary_version('version'),
  noframes: _unary('noframes'),
  grant: _binary_grant,
};


const GF_METAKEY_FUNCS = {
  ...BASIC_METAKEY_FUNCS,
  updateURL: _binary_uri('updateURL'),
  installURL: _binary_uri('installURL'),
  downloadURL: _binary_uri('downloadURL'),
  license: _binary_string('license'),
  supportURL: _binary_uri('supportURL'),
  contributionURL: _binary_uri('contributionURL'),
  contributionAmount: _binary_string('contributionAmount'),
  compatible: _binary_strings('compatible'),
  incompatible: _binary_strings('incompatible'),
};


const TM_METAKEY_FUNCS = {
  ...GF_METAKEY_FUNCS,
  author: _binary_string('author'),

  /**
   * The authors homepage that is used at the options page to link from the scripts name to the given page.
   * Please note that if the @namespace tag starts with 'http://' its content will be used for this too.
   */
  homepage: _binary_uri('homepage'),
  homepageURL: _binary_uri('homepageURL'),
  website: _binary_uri('website'),
  source: _binary_uri('source'),

  /**
   * Icon URLs
   */
  defaulticon: _binary_uri('defaulticon'),
  icon64: _binary_uri('icon64'),
  iconURL: _binary_uri('iconURL'),
  icon64URL: _binary_uri('icon64URL'),

  updateURL: _binary_uri('updateURL'),
  downloadURL: _binary_uri('downloadURL'),
  supportURL: _binary_uri('supportURL'),

  connect: (val, vtor) => {
    const keyname = 'connect';
    const isValidConnect = (v) => isIPv4(v) || isUri(v) || /[\w-]+(\.[\w-]+)+/.test(v) || v === '*' || v === "localhost";
    if (!val) {
      _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
      return null;
    }

    if (isString(val)) {
      if (!isValidConnect(val)) {
        _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid connect string`);
      }
      return [[keyname, val]];
    } else if (Array.isArray(val) && val.length && val.every(isString)) {
      const goods = val.reduce((prev, curr) => {
        if (isString(curr)) {
          if (!isValidConnect(curr)) {
            _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid connect string`);
          }
          return prev.concat([[keyname, curr]]);
        }
        return prev;
      }, []).filter(Boolean);
      return goods.length ? goods : null;
    } else {
      _validator_tmpl(vtor, `${keyname}'s metavalue should be ${keyname} string or ${keyname} string[] type`);
      return null;
    }
  },
  // ['unwrap'](){},
  nocompat: (val, vtor) => {
    const keyname = 'nocompat';
    if (!val) {
      return null;
    }
    if (/chrome/i.test(val)) {
      return [[keyname, 'Chrome']];
    }
    _validator_tmpl(vtor, `${keyname}'s metavalue should be 'chrome'`);
    return null;
  },
};
const TM_METAKEY_NAMES = Object.keys(TM_METAKEY_FUNCS);


const GM3_METAKEY_FUNCS = {
  ...GF_METAKEY_FUNCS,
  author: _binary_string('author'),
  installURL: _binary_uri('installURL'),
  downloadURL: _binary_uri('downloadURL'),
  homepageURL: _binary_uri('homepageURL'),
  updateURL: _binary_uri('updateURL'),
};
const GM3_METAKEY_NAMES = Object.keys(GM3_METAKEY_FUNCS);


const GM4_METAKEY_FUNCS = { ...GF_METAKEY_FUNCS };
const GM4_METAKEY_NAMES = Object.keys(GM4_METAKEY_FUNCS);


const VM_METAKEY_FUNCS = {
  ...GF_METAKEY_FUNCS,
  'exclude-match': _binary_matches('exclude-match'),
  'inject-into': _binary_enum('inject-into', INJECTINTO_ENUM),
};
const VM_METAKEY_NAMES = Object.keys(VM_METAKEY_FUNCS);

const ALL_METAKEY_FUNCS = {
  ...TM_METAKEY_FUNCS,
  ...GM3_METAKEY_FUNCS,
  ...VM_METAKEY_FUNCS,
};
const ALL_METAKEY_NAMES = [...new Set(Object.keys(ALL_METAKEY_FUNCS))];


const isValidMetakeyName = (keyname, { manager = 'ALL' } = {}) => {
  switch (manager) {
  case 'ALL':
    return ALL_METAKEY_NAMES.includes(keyname);
  case 'TM':
    return TM_METAKEY_NAMES.includes(keyname);
  case 'GM3':
    return GM3_METAKEY_NAMES.includes(keyname);
  case 'GM4':
    return GM4_METAKEY_NAMES.includes(keyname);
  case 'VM':
    return VM_METAKEY_NAMES.includes(keyname);
  default:
    return false;
  }
};

const getMetakeyDataByManager = (manager) => {
  switch (manager) {
  case 'ALL':
    return {
      keynames: ALL_METAKEY_NAMES,
      keyfuncs: ALL_METAKEY_FUNCS,
    };
  case 'TM':
    return {
      keynames: TM_METAKEY_NAMES,
      keyfuncs: TM_METAKEY_FUNCS,
    };
  case 'GM3':
    return {
      keynames: GM3_METAKEY_NAMES,
      keyfuncs: GM3_METAKEY_FUNCS,
    };
  case 'GM4':
    return {
      keynames: GM4_METAKEY_NAMES,
      keyfuncs: GM4_METAKEY_FUNCS,
    };
  case 'VM':
    return {
      keynames: VM_METAKEY_NAMES,
      keyfuncs: VM_METAKEY_FUNCS,
    };
  default:
    return {
      keynames: [],
      keyfuncs: {},
    };
  }
};

const SIMPLEST_META = jclone(DEFAULT_METAS);

const DEFAULT_ORDER = [
  'name',
  'description',
  'namespace',
  '...',
  'grant',
];

const loadFile = (filename = './metablock.json') => {
  const p = debug('options:loadFile');
  const keys = {};
  p('cwd', process.cwd());

  if (!filename) {
    Object.assign(keys, SIMPLEST_META);
  } else if (fs.existsSync(filename)) {
    const pathInfo = path.parse(filename);
    p('pathInfo', pathInfo);

    switch (pathInfo.ext) {
    case '.json': {
      Object.assign(keys, SIMPLEST_META, JSON.parse(fs.readFileSync(filename)));
      break;
    }

    case '.js': {
      if (!path.isAbsolute(filename)) {
        pathInfo.dir = path.join(process.cwd(), pathInfo.dir);
      }
      const loaded = require(path.format(pathInfo));
      if (loaded.default) {
        Object.assign(keys, SIMPLEST_META, loaded.default);
      } else if (Object.keys(loaded).length) {
        Object.assign(keys, SIMPLEST_META, loaded);
      } else {
        throw new Error(`Can't find any key export from ${pathInfo.base}.`);
      }
      break;
    }

    case '.yml':
    case '.yaml': {
      Object.assign(keys, SIMPLEST_META, YAML.load(fs.readFileSync(filename), { filename }));
      break;
    }

    default:
      throw new UnsupportedFormat(`We don't support ${pathInfo.ext} now.`);
    }
  } else {
    throw new FileNotFound(`${filename} not found.`);
  }

  p('keys', keys);
  return keys;
};

const getScriptManager = (sm) => {
  const manager = (sm || 'all')
    .toString().toLowerCase().trim();

  switch (manager) {
  case 'tm':
  case 'tampermonkey': {
    return 'TM';
  }
  case 'gm3':
  case 'greasemonkey3': {
    return 'GM3';
  }
  case 'gm':
  case 'gm4':
  case 'greasemonkey':
  case 'greasemonkey4': {
    return 'GM4';
  }
  case 'vm':
  case 'violentmonkey': {
    return 'VM';
  }
  case 'all':
  case 'compatible': {
    return 'ALL';
  }
  default:
    throw new UnknownScriptManager(`Unknown script manager: ${manager}`);
  }
};


const getValidator = (vtor) => {
  const validator = (vtor || 'warn')
    .toString().toLowerCase().trim();
  const VALID_VALIDATORS = new Set(['off', 'warn', 'error']);
  if (VALID_VALIDATORS.has(validator)) {
    return validator;
  } else {
    return 'warn';
  }
};

const getValidOrder = (order = []) => {
  const _order = jclone(order);

  const i = _order.indexOf('...');
  if (i >= 0) {
    _order.splice(i, 1, ...DEFAULT_ORDER);
  } else {
    _order.push(...DEFAULT_ORDER);
  }

  const orderSet = new Set(_order);
  const cloned = [...orderSet];
  for (const key of cloned) {
    if (key !== '...' && !isValidMetakeyName(key)) {
      orderSet.delete(key);
    }
  }
  return [...orderSet];
};

const getSpecialIndexWithOrder = (order) => (key) => {
  // [ a,  b,  c, '...', d, e]
  // [-3, -2, -1,     0, 1, 2]
  const i = order.indexOf('...');
  const ki = order.indexOf(key);
  return (ki >= 0) ? ki - i : 0;
};

const sortbyOrder = (metakeys, order) => {
  const mkeys = jclone(metakeys);
  const getSpecialIndex = getSpecialIndexWithOrder(order);
  const mkEntries = Object.entries(mkeys).sort((a, b) => {
    return getSpecialIndex(a[0]) - getSpecialIndex(b[0]);
  });

  return mkEntries.reduce((collect, [k, v]) => {
    collect[k] = v;
    return collect;
  }, {});
};

const parseOptions = (options) => {
  debug('plugin:parseOptions::raw options')(options);

  const conf = {
    metakeys: loadFile(options.file),
    manager: getScriptManager(options.manager),
    validator: getValidator(options.validator),
  };

  // options.override
  const override = jclone(isObject(options.override) ? options.override : '{}');

  if (override) {
    Object.assign(conf.metakeys, override);
  }

  // remove invalid keys
  conf.metakeys = Object.keys(conf.metakeys).reduce((collect, key) => {
    if (isValidMetakeyName(key)) {
      collect[key] = conf.metakeys[key];
    }
    return collect;
  }, {});

  // order metakeys
  const order = getValidOrder(options.order);
  debug('plugin:parseOptions::order')(order);
  conf.metakeys = sortbyOrder(conf.metakeys, order);

  return conf;
};

const transformAll = (conf) => {
  const entries = [];
  for (const [metakey, metavalue] of Object.entries(conf.metakeys)) {
    const info = getMetaEntry([metakey, metavalue], conf);
    if (info) {
      entries.push(...info);
    }
  }
  return entries;
};

const renderAll = (entries) => {
  const counter = {
    name: 0,
    desc: 0,
    other: 0,
  };

  for (const entry of entries) {
    const first = entry[0];
    if (/^name(:.*)?$/.test(first)) {
      counter.name = Math.max(counter.name, first.length);
    } else if (/^description(:.*)?$/.test(first)) {
      counter.desc = Math.max(counter.desc, first.length);
    } else {
      counter.other = Math.max(counter.other, first.length);
    }
  }

  const _name = counter.name === 'name'.length;
  const _desc = counter.desc === 'description'.length;
  if (_name && _desc) {
    counter.name
    = counter.desc
    = counter.other
    = Math.max(counter.name, counter.desc, counter.other);
  } else if (_name) {
    counter.name
    = counter.other
    = Math.max(counter.name, counter.other);
  } else if (_desc) {
    counter.desc
    = counter.other
    = Math.max(counter.desc, counter.other);
  }

  const lines = [];
  lines.push('// ==UserScript==');
  for (const entry of entries) {
    const first = entry[0];
    if (/^name(:.*)?$/.test(first)) {
      lines.push(`// @${first.padEnd(counter.name, ' ')} ${entry[1]}`);
    } else if (/^description(:.*)?$/.test(first)) {
      lines.push(`// @${first.padEnd(counter.desc, ' ')} ${entry[1]}`);
    } else {
      lines.push(`// @${first.padEnd(counter.other, ' ')} ${entry.slice(1).join(' ')}`);
    }
  }
  lines.push('// ==/UserScript==');

  return lines.map((l) => l.trim()).join('\n');
};

function metablock(options = {}) {
  const conf = parseOptions(options);
  debug('plugin:top::conf')(conf);

  const entries = transformAll(conf);
  debug('plugin:top::entries')(entries);

  const final = renderAll(entries);
  debug('plugin:top::final')(final);

  return {
    renderChunk(code, renderedChunk, outputOptions) {
      const magicString = new MagicString(code);
      magicString.prepend(final + '\n').trimEnd('\\n');
      const result = { code: magicString.toString() };
      if (outputOptions.sourcemap !== false) {
        result.map = magicString.generateMap({ hires: true });
      }
      return result;
    },
  };
}

export { metablock as default };
