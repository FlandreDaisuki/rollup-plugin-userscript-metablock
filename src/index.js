import { loadFile, getScriptManager, getValidator, getValidOrder, sortbyOrder } from './options';
import { isValidMetakeyName, getMetaEntry } from './meta';
import debug from 'debug';
import { jclone, isObject } from './utils';
import MagicString from 'magic-string';

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

export default function metablock(options = {}) {
  const conf = parseOptions(options);
  debug('plugin:top::conf')(conf);

  const entries = transformAll(conf);
  debug('plugin:top::entries')(entries);

  const final = renderAll(entries);
  debug('plugin:top::final')(final);

  return {
    renderChunk(code) {
      const magicString = new MagicString(code);
      magicString.prepend(final + '\n').trimEnd('\\n');
      const result = { code: magicString.toString() };
      if (options.sourcemap !== false) {
        result.map = magicString.generateMap({ hires: true });
      }
      return result;
    },
  };
}
