import { isUri } from 'valid-url';
import semver from 'semver';
import { UnknownMetakeyToScriptManager, InvalidMetaValue } from './errors';
import { isString, isObject, isMatchPattern, print as p, isIPv4 } from './utils';

export const DEFAULT_METAS = {
  name: 'New Script',
  namespace: 'npmjs.com/rollup-plugin-userscript-metablock',
  grant: 'none',
};

export const getMetaEntry = ([metakey, metavalue], { validator, manager }) => {
  const { keynames, keyfuncs } = getMetakeyDataByManager(manager);

  if (!keynames.includes(metakey)) {
    if (validator === 'warn') { p.warn(`The script manager doesn't support metakey: ${metakey}`); }
    if (validator === 'error') {
      throw new UnknownMetakeyToScriptManager(`The script manager doesn't support metakey: ${metakey}`);
    }
    return null;
  }

  return keyfuncs[metakey](metavalue, validator, manager) || [[metakey, DEFAULT_METAS[metakey]]];
};

const _validator_tmpl = (vtor, msg) => {
  if (vtor === 'warn') { p.warn(msg); }
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
    return val.reduce((prev, curr) => {
      return prev.concat(_binary_string(keyname)(curr, vtor));
    }, []).filter(Boolean);
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
    if (!isUri(val) && vtor !== 'off') {
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
    return val.reduce((prev, curr) => {
      return prev.concat(_binary_uri(keyname)(curr, vtor));
    }, []).filter(Boolean);
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
    if (val.includes('*') || (/^\/.*\/$/).test(val)) {
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
    return val.reduce((prev, curr) => {
      return prev.concat(_binary_globuri(keyname)(curr, vtor));
    }, []).filter(Boolean);
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
    p.warn('Set default value:', first);
    return [[keyname, first]];
  }
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
    return val.reduce((prev, curr) => {
      if (isString(curr)) {
        if (!isMatchPattern(curr)) {
          _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid match pattern string`);
        }
        return prev.concat([[keyname, curr]]);
      }
      return prev;
    }, []).filter(Boolean);
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be match pattern string or match pattern string[] type`);
    return null;
  }
};

const _binary_grant = (val, vtor, sm) => {
  const keyname = 'grant';
  if (!val) {
    return [[keyname, 'none']];
  } else if (isString(val)){
    // TODO: script manager dependency
    return [[keyname, val]];
  } else if (Array.isArray(val) && val.length && val.every(isString)) {
    // TODO: script manager dependency
    return val.map(v => [keyname, v]);
  } else {
    _validator_tmpl(vtor, `${keyname}'s metavalue should be ${keyname} string or ${keyname} string[] type`);
    return null;
  }
};

const RUNAT_ENUM = ['end', 'start', 'idle', 'body'].map(s => `document-${s}`).concat('context-menu');
const INJECTINTO_ENUM = ['page', 'content', 'auto'];

export const BASIC_METAKEY_FUNCS = {
  name: _multilingual('name'),
  description: _multilingual('description'),
  namespace: _binary_string('namespace'),
  match: _binary_matches('match'),
  include: _binary_globuris('include'),
  exclude: _binary_globuris('exclude'),
  icon: _binary_uri('icon'),
  require: _binary_uris('require'),
  'run-at': _binary_enum('run-at', RUNAT_ENUM),
  resource: (val, vtor) => {
    const keyname = 'resource';
    if (!val) {
      _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
      return null;
    }

    if (isObject(val)) {
      const entries = Object.entries(val);
      for (const [rname, uri] of entries) {
        if (!isUri(uri)) {
          _validator_tmpl(vtor, `${keyname}.${rname} metavalue should be a valid URI`);
        }
      }
      return entries.map(entry => [keyname, ...entry]);
    } else {
      _validator_tmpl(vtor, `${keyname}'s metavalue should be object type`);
      return null;
    }
  },
  version: (val, vtor) => {
    const keyname = 'version';
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
  },
  noframes: (val, vtor) => {
    const keyname = 'noframes';
    if (!val) {
      _validator_tmpl(vtor, `${keyname}'s metavalue can't be falsy`);
      return null;
    }
    return val ? [[keyname]] : null;
  },
  grant: _binary_grant,
};
export const BASIC_METAKEY_NAMES = Object.keys(BASIC_METAKEY_FUNCS);


export const GF_METAKEY_FUNCS = {
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
export const GF_METAKEY_NAMES = Object.keys(GF_METAKEY_FUNCS);


export const TM_METAKEY_FUNCS = {
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
    const isValidConnect = (v) => isIPv4(v) || isUri(v) || /[\w-]+(\.[\w-]+)+/.test(v) || v === '*';
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
      for (const v of val) {
        if (!isValidConnect(v)) {
          _validator_tmpl(vtor, `${keyname}'s metavalue should be a valid connect string`);
        }
      }
      return val.map(v => [keyname, v]);
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
export const TM_METAKEY_NAMES = Object.keys(TM_METAKEY_FUNCS);


export const GM3_METAKEY_FUNCS = {
  ...GF_METAKEY_FUNCS,
  author: _binary_string('author'),
  installURL: _binary_uri('installURL'),
  downloadURL: _binary_uri('downloadURL'),
  homepageURL: _binary_uri('homepageURL'),
  updateURL: _binary_uri('updateURL'),
};
export const GM3_METAKEY_NAMES = Object.keys(GM3_METAKEY_FUNCS);


export const GM4_METAKEY_FUNCS = { ...GF_METAKEY_FUNCS };
export const GM4_METAKEY_NAMES = Object.keys(GM4_METAKEY_FUNCS);


export const VM_METAKEY_FUNCS = {
  ...GF_METAKEY_FUNCS,
  'exclude-match': _binary_matches('exclude-match'),
  'inject-into': _binary_enum('inject-into', INJECTINTO_ENUM),
};
export const VM_METAKEY_NAMES = Object.keys(VM_METAKEY_FUNCS);

export const ALL_METAKEY_FUNCS = {
  ...TM_METAKEY_FUNCS,
  ...GM3_METAKEY_FUNCS,
  ...VM_METAKEY_FUNCS,
};
export const ALL_METAKEY_NAMES = [...new Set(Object.keys(ALL_METAKEY_FUNCS))];


export const isValidMetakeyName = (keyname, { manager = 'ALL' } = {}) => {
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

export const getMetakeyDataByManager = (manager) => {
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

