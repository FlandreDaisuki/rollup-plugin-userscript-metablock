import fs from 'fs';
import path from 'path';
import debug from 'debug';
import YAML from 'js-yaml';
import { jclone } from './utils';
import { isValidMetakeyName, DEFAULT_METAS } from './meta';
import { FileNotFound, UnsupportedFormat, UnknownScriptManager } from './errors';


export const SIMPLEST_META = jclone(DEFAULT_METAS);

export const DEFAULT_ORDER = [
  'name',
  'description',
  'namespace',
  '...',
  'grant',
];

export const loadFile = (filename = './metablock.json') => {
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
      pathInfo.dir = process.cwd();
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
      Object.assign(keys, SIMPLEST_META, YAML.safeLoad(fs.readFileSync(filename), { filename }));
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

export const getScriptManager = (sm) => {
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


export const getValidator = (vtor) => {
  const validator = (vtor || 'warn')
    .toString().toLowerCase().trim();
  const VALID_VALIDATORS = new Set(['off', 'warn', 'error']);
  if (VALID_VALIDATORS.has(validator)) {
    return validator;
  } else {
    return 'warn';
  }
};

export const getValidOrder = (order) => {
  const orderSet = new Set(order);
  const cloned = [...orderSet];
  for (const key of cloned) {
    if (key !== '...' && !isValidMetakeyName(key)) {
      orderSet.delete(key);
    }
  }
  return [...orderSet];
};

export const getSpecialIndexWithOrder = (order) => (key) => {
  // [ a,  b,  c, '...', d, e]
  // [-3, -2, -1,     0, 1, 2]
  const i = order.indexOf('...');
  const ki = order.indexOf(key);
  return (ki >= 0) ? ki - i : 0;
};

export const sortbyOrder = (metakeys, order) => {
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
