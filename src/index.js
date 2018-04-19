import {existsSync, readFileSync} from 'fs';
import {extname} from 'path';

function isEmptyArray(arr) {
	return Array.isArray(arr) && arr.length === 0;
}

function isValid(metaValue) {
	return metaValue &&
		!isEmptyArray(metaValue) &&
		!isEmptyArray(Object.keys(metaValue));
}

function validateMatchPattern(urlPattern) {
	// eslint-disable-next-line no-useless-escape
	const pattern = /(\*|https?|file|ftp):\/\/(\*|\*\.[^\/\*]*|[^\/\*]*)\/(.*)/;

	return pattern.test(urlPattern);
}

function toMetaBlockString(key, value, padOffset = 0) {
	if (value) {
		return `// @${key.padEnd(padOffset)} ${value}`.trim();
	} else {
		return `// @${key}`;
	}
}

function processMetaValue(value) {
	if (typeof value === 'object') {
		if (Array.isArray(value)) {
			return value.reduce((acc, val) => acc.concat(val), []);
		} else {
			// key-value Object
			return Object.entries(value).reduce((acc, val) => {
				acc.push(val.join(' '));
				return acc;
			}, []);
		}
	} else if (typeof value === 'string') {
		return [value];
	} else if (value) {
		// not falsy
		return [''];
	} else {
		// unknown
		return [];
	}
}

export default function(options = {}) {
	const opt = Object.assign({
		file: null,
		// script manager : 'tampermonkey' | 'greasemonkey3' | 'greasemonkey4' | 'compatible'(default)
		manager: 'compatible',
		order: ['name', 'description', 'namespace', '...', 'grant'],
		version: null
	}, options);

	const meta = {
		name: 'New Userscript',
		namespace: 'FlandreDaisuki/rollup-plugin-userscript-metablock'
	};

	if (opt.file) {
		if (!existsSync(opt.file)) {
			throw new Error(`Metablock file not found: ${opt.file}`);
		}

		let json;
		switch (extname(opt.file)) {
		case '.json':
			json = JSON.parse(readFileSync(opt.file, 'utf8'));
			break;
		case '.js':
			json = require(opt.file);
			break;
		}

		Object.assign(meta, json);
	}

	if (opt.version) {
		meta.version = opt.version;
	}

	// always grant
	if(!isValid(meta.grant)) {
		meta.grant = 'none';
	}

	if (meta.match) {
		if(Array.isArray(meta.match)) {
			for (const urlPattern of meta.match) {
				if(!validateMatchPattern(urlPattern)) {
					throw new Error(`Invalid match pattern: ${urlPattern}.`);
				}
			}
		} else {
			if(!validateMatchPattern(meta.match)) {
				throw new Error(`Invalid match pattern: ${meta.match}.`);
			}
		}
	}

	// if no include rule, greasemonkey assume `@include *` but tampermonkey don't.
	if (!isValid(meta.include) && !isValid(meta.match) && opt.manager === 'compatible') {
		meta.include = '*';
	}

	// process key-value form name / description
	for (const [metaKey, metaValue] of Object.entries(meta)) {
		if ((metaKey === 'name' || metaKey === 'description') && typeof metaValue === 'object') {
			if(!metaValue.default) {
				throw new Error(`The key-value ${metaKey} need to provide default attribute.`);
			}

			delete meta[metaKey];

			for (const [lang, str] of Object.entries(metaValue)) {
				if (lang === 'default') {
					meta[metaKey] = str;
				} else {
					meta[`${metaKey}:${lang}`] = str;
				}
			}
		}
	}

	Set.prototype.difference = function(setB) {
		for (const elem of setB) {
			this.delete(elem);
		}
	};

	// reorder metakeys
	const metaKeySet = new Set(Object.keys(meta));
	const [pre, post] = [[], []];
	let isToPre = true;
	for (const oKey of opt.order) {
		if (oKey === '...') {
			isToPre = false;
		} else {
			const keyIncludeOKey = [...metaKeySet].filter(k => k.includes(oKey));
			keyIncludeOKey.sort();
			if (isToPre) {
				pre.push(...keyIncludeOKey);
			} else {
				post.push(...keyIncludeOKey);
			}
			metaKeySet.difference(keyIncludeOKey);
		}
	}

	const orderedMetaKeys = [...pre, ...metaKeySet, ...post];
	const orderedMeta = {};
	for (const omkey of orderedMetaKeys) {
		orderedMeta[omkey] = meta[omkey];
	}

	delete Set.prototype.difference;

	// process all metakeys
	const metaOutputList = [];
	const maxMetaKeyLength = Object.keys(orderedMeta).reduce((prev, val) => Math.max(prev, val.length), 0);

	for (const [metaKey, metaValue] of Object.entries(orderedMeta)) {
		for (const processed of processMetaValue(metaValue)) {
			metaOutputList.push(toMetaBlockString(metaKey, processed, maxMetaKeyLength));
		}
	}

	metaOutputList.unshift('// ==UserScript==');
	metaOutputList.push('// ==/UserScript==');
	const metaOutputString = `${metaOutputList.join('\n')}\n\n`;

	return {
		name: 'rollup-plugin-userscript-metablock',
		transformBundle(source) {
			return metaOutputString + source;
		}
	};
}
