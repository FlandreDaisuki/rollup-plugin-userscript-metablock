import debug from 'debug';
import semver from 'semver';
import { UnknownMetaKeyToScriptManager, InvalidMetaValue } from './errors.js';
import { isString, isObject, isMatchPattern, print as p, isIPv4, isGlobURI, isUrl } from './utils.js';

export const DEFAULT_META = {
  name: 'New Script',
  namespace: 'npmjs.com/rollup-plugin-userscript-metablock',
  grant: 'none',
};

export const getMetaEntry = ([metaKey, metaValue], { validator, manager }) => {
  debug('meta:getMetaEntry::[metaKey, metaValue]')([metaKey, metaValue]);
  const { keyNames, keyFunctions } = getMetaKeyDataByManager(manager);

  const mk = metaKey.trim();

  let mv = metaValue;
  if (isString(metaValue)) {
    mv = metaValue.trim();
  } else if (Array.isArray(metaValue) && metaValue.length && metaValue.every(isString)) {
    mv = metaValue.map((v) => v.trim());
  } else if (isObject(metaValue)) {
    mv = Object.entries(metaValue)
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

  if (!keyNames.includes(mk)) {
    if (validator === 'warn') { p.warn(`The script manager doesn't support metaKey: ${mk}`); }
    if (validator === 'error') {
      throw new UnknownMetaKeyToScriptManager(`The script manager doesn't support metaKey: ${mk}`);
    }
    return null;
  }

  const result = keyFunctions[mk](mv, validator, manager);
  const defMeta = DEFAULT_META[mk];
  return defMeta ? result || [[mk, defMeta]] : result;
};

const _validator_tmpl = (vtor, msg) => {
  if (vtor === 'warn') { p.warn(msg); }
  if (vtor === 'error') { throw new InvalidMetaValue(msg); }
};

export const _multilingual = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return [[keyName, val]];
  } else if (isObject(val)) {
    if (!val.default) {
      _validator_tmpl(vtor, `${keyName}.default is required`);
      return null;
    }

    return Object.entries(val).map(([lang, text]) => [`${keyName}${lang === 'default' ? '' : ':' + lang}`, text]);
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue is an invalid type`);
    return null;
  }
};

export const _binary_string = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return [[keyName, val]];
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be string type`);
    return null;
  }
};

const DEFAULT_RESTRICTION = {
  message: (keyName) => `${keyName}'s metaValue should pass its restriction`,
  apply: () => true,
};
export const _binary_strings = (keyName, restriction = DEFAULT_RESTRICTION) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (!restriction.apply(val)) {
      _validator_tmpl(vtor, restriction.message(keyName));
    }
    return _binary_string(keyName)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = [];
    for (const item of val) {
      const metaKeyFunc = _binary_string(keyName)(item, vtor);
      if (!restriction.apply(item)) {
        _validator_tmpl(vtor, restriction.message(keyName));
      }
      if (metaKeyFunc) {
        goods.push(metaKeyFunc);
      }
    }
    return goods.length ? goods.flat() : null;
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be string or string[] type`);
    return null;
  }
};

export const _binary_uri = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (!isUrl(val)) {
      _validator_tmpl(vtor, `${keyName}'s metaValue should be a valid URI`);
    }
    return [[keyName, val]];
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be string type`);
    return null;
  }
};

export const _binary_uris = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return _binary_uri(keyName)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      return prev.concat(_binary_uri(keyName)(curr, vtor));
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be string or string[] type`);
    return null;
  }
};

export const _binary_glob_uri = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (isGlobURI(val)) {
      return [[keyName, val]];
    } else {
      return _binary_uri(keyName)(val, vtor);
    }
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be glob uri string type`);
    return null;
  }
};

export const _binary_glob_uris = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    return _binary_glob_uri(keyName)(val, vtor);
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      return prev.concat(_binary_glob_uri(keyName)(curr, vtor));
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be glob uri string or glob uri string[] type`);
    return null;
  }
};

export const _binary_enum = (keyName, enumSet) => (val, vtor) => {
  if (val === undefined) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be undefined`);
    return null;
  }
  const _set = new Set(enumSet);
  if (_set.has(val)) {
    return [[keyName, val]];
  } else {
    const setStr = [..._set].join(', ');
    _validator_tmpl(vtor, `${keyName}'s metaValue should be one of [${setStr}]`);

    const first = [..._set][0];
    p.warn('Set default value:', first);
    return [[keyName, first]];
  }
};

export const _ternary_uri = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isObject(val)) {
    const entries = Object.entries(val);
    for (const [rName, uri] of entries) {
      if (!isUrl(String(uri))) {
        _validator_tmpl(vtor, `${keyName}.${rName} metaValue should be a valid URI`);
      }
    }
    return entries.map((entry) => [keyName, ...entry.map(String)]);
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be object type`);
    return null;
  }
};

export const _binary_version = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (semver.valid(val)) {
    return [[keyName, semver.clean(val)]];
  }

  const coerce = semver.coerce(val);
  if (semver.valid(coerce)) {
    _validator_tmpl(vtor, `${keyName} can be transform to ${coerce}`);
    return [[keyName, coerce.version]];
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue is invalid`);
    return null;
  }
};

export const _unary = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }
  return val ? [[keyName]] : null;
};

export const _binary_matches = (keyName) => (val, vtor) => {
  if (!val) {
    _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
    return null;
  }

  if (isString(val)) {
    if (!isMatchPattern(val)) {
      _validator_tmpl(vtor, `${keyName}'s metaValue should be a valid match pattern string`);
    }
    return [[keyName, val]];
  } else if (Array.isArray(val)) {
    const goods = val.reduce((prev, curr) => {
      if (isString(curr)) {
        if (!isMatchPattern(curr)) {
          _validator_tmpl(vtor, `${keyName}'s metaValue should be a valid match pattern string`);
        }
        return prev.concat([[keyName, curr]]);
      }
      return prev;
    }, []).filter(Boolean);
    return goods.length ? goods : null;
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be match pattern string or match pattern string[] type`);
    return null;
  }
};

/* eslint-disable-next-line no-unused-vars */
export const _binary_grant = (val, vtor, sm) => {
  const keyName = 'grant';
  if (!val) {
    return [[keyName, 'none']];
  } else if (isString(val)) {
    // TODO: script manager dependency
    return [[keyName, val]];
  } else if (Array.isArray(val) && val.length && val.every(isString)) {
    // TODO: script manager dependency
    return val.map((v) => [keyName, v]);
  } else {
    _validator_tmpl(vtor, `${keyName}'s metaValue should be ${keyName} string or ${keyName} string[] type`);
    return null;
  }
};

export const RUN_AT_ENUM = Object.freeze(/** @type {const} */ ([
  'document-end',
  'document-start',
  'document-idle',
  'document-body',
  'context-menu',
]));
export const INJECT_INTO_ENUM = Object.freeze(/** @type {const} */ ([
  'page',
  'content',
  'auto',
]));
export const SANDBOX_ENUM = Object.freeze(/** @type {const} */ ([
  'raw',
  'JavaScript',
  'DOM',
]));
export const ANTIFEATURE_ENUM = Object.freeze(/** @type {const} */ ([
  'ads',
  'tracking',
  'miner',
]));

export const BASIC_META_KEY_FUNCS = {
  name: _multilingual('name'),
  description: _multilingual('description'),
  namespace: _binary_string('namespace'),
  match: _binary_matches('match'),
  include: _binary_glob_uris('include'),
  exclude: _binary_glob_uris('exclude'),
  icon: _binary_uri('icon'),
  require: _binary_uris('require'),
  'run-at': _binary_enum('run-at', RUN_AT_ENUM),
  resource: _ternary_uri('resource'),
  version: _binary_version('version'),
  noframes: _unary('noframes'),
  grant: _binary_grant,
  antifeature: _binary_strings('antifeature', {
    message: (keyName) => `${keyName}'s metaValue should be one of [${ANTIFEATURE_ENUM.join(', ')}]`,
    apply: (v) => ANTIFEATURE_ENUM.includes(v),
  }),
};
export const BASIC_META_KEY_NAMES = Object.keys(BASIC_META_KEY_FUNCS);


export const GF_META_KEY_FUNCS = {
  ...BASIC_META_KEY_FUNCS,
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
export const GF_META_KEY_NAMES = Object.keys(GF_META_KEY_FUNCS);


export const TM_META_KEY_FUNCS = {
  ...GF_META_KEY_FUNCS,
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
    const keyName = 'connect';
    const isValidConnect = (v) => isIPv4(v) || isUrl(v) || /[\w-]+(\.[\w-]+)+/.test(v) || v === '*' || v === 'localhost';
    if (!val) {
      _validator_tmpl(vtor, `${keyName}'s metaValue can't be falsy`);
      return null;
    }

    if (isString(val)) {
      if (!isValidConnect(val)) {
        _validator_tmpl(vtor, `${keyName}'s metaValue should be a valid connect string`);
      }
      return [[keyName, val]];
    } else if (Array.isArray(val) && val.length && val.every(isString)) {
      const goods = val.reduce((prev, curr) => {
        if (isString(curr)) {
          if (!isValidConnect(curr)) {
            _validator_tmpl(vtor, `${keyName}'s metaValue should be a valid connect string`);
          }
          return prev.concat([[keyName, curr]]);
        }
        return prev;
      }, []).filter(Boolean);
      return goods.length ? goods : null;
    } else {
      _validator_tmpl(vtor, `${keyName}'s metaValue should be ${keyName} string or ${keyName} string[] type`);
      return null;
    }
  },
  nocompat: (val, vtor) => {
    const keyName = 'nocompat';
    if (!val) {
      return null;
    }
    if (/chrome/i.test(val)) {
      return [[keyName, 'Chrome']];
    }
    _validator_tmpl(vtor, `${keyName}'s metaValue should be 'chrome'`);
    return null;
  },
  sandbox: _binary_enum('sandbox', SANDBOX_ENUM),
  unwrap: _unary('unwrap'),
};
export const TM_META_KEY_NAMES = Object.keys(TM_META_KEY_FUNCS);


export const GM3_META_KEY_FUNCS = {
  ...GF_META_KEY_FUNCS,
  author: _binary_string('author'),
  installURL: _binary_uri('installURL'),
  downloadURL: _binary_uri('downloadURL'),
  homepageURL: _binary_uri('homepageURL'),
  updateURL: _binary_uri('updateURL'),
};
export const GM3_META_KEY_NAMES = Object.keys(GM3_META_KEY_FUNCS);


export const GM4_META_KEY_FUNCS = { ...GF_META_KEY_FUNCS };
export const GM4_META_KEY_NAMES = Object.keys(GM4_META_KEY_FUNCS);


export const VM_META_KEY_FUNCS = {
  ...GF_META_KEY_FUNCS,
  'exclude-match': _binary_matches('exclude-match'),
  'inject-into': _binary_enum('inject-into', INJECT_INTO_ENUM),
  unwrap: _unary('unwrap'),
};
export const VM_META_KEY_NAMES = Object.keys(VM_META_KEY_FUNCS);

export const ALL_META_KEY_FUNCS = {
  ...TM_META_KEY_FUNCS,
  ...GM3_META_KEY_FUNCS,
  ...VM_META_KEY_FUNCS,
};
export const ALL_META_KEY_NAMES = [...new Set(Object.keys(ALL_META_KEY_FUNCS))];


export const isValidMetaKeyName = (keyName, { manager = 'ALL' } = {}) => {
  switch (manager) {
  case 'ALL':
    return ALL_META_KEY_NAMES.includes(keyName);
  case 'TM':
    return TM_META_KEY_NAMES.includes(keyName);
  case 'GM3':
    return GM3_META_KEY_NAMES.includes(keyName);
  case 'GM4':
    return GM4_META_KEY_NAMES.includes(keyName);
  case 'VM':
    return VM_META_KEY_NAMES.includes(keyName);
  default:
    return false;
  }
};

export const getMetaKeyDataByManager = (manager) => {
  switch (manager) {
  case 'ALL':
    return {
      keyNames: ALL_META_KEY_NAMES,
      keyFunctions: ALL_META_KEY_FUNCS,
    };
  case 'TM':
    return {
      keyNames: TM_META_KEY_NAMES,
      keyFunctions: TM_META_KEY_FUNCS,
    };
  case 'GM3':
    return {
      keyNames: GM3_META_KEY_NAMES,
      keyFunctions: GM3_META_KEY_FUNCS,
    };
  case 'GM4':
    return {
      keyNames: GM4_META_KEY_NAMES,
      keyFunctions: GM4_META_KEY_FUNCS,
    };
  case 'VM':
    return {
      keyNames: VM_META_KEY_NAMES,
      keyFunctions: VM_META_KEY_FUNCS,
    };
  default:
    return {
      keyNames: [],
      keyFunctions: {},
    };
  }
};
