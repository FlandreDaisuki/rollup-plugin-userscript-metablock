# rollup-plugin-userscript-metablock

Transform json file to userscript metablock and append on.

Metakeys documents:
- [Tampermonkey](https://tampermonkey.net/documentation.php)
- [Greasemonkey](https://wiki.greasespot.net/Metadata_Block)
- [GreasyFork](https://greasyfork.org/help/meta-keys)

## Installation

```
npm install --save-dev rollup-plugin-userscript-metablock
```

## Usage

```javascript
// rollup.config.js
import metablock from 'rollup-plugin-userscript-metablock';

export default {
  input: 'main.js',
  output: {
    file: 'bundle.user.js',
    format: 'es'
  },
  plugins: [metablock({
    // file : string | null(default)
    file: 'metablock.json',

    // You can also use `meta` to pass it directly rather taht provide a file, and it has higher priority that `file`.
    meta: {},

    // order: string[]
    // default: ['name', 'description', 'namespace', '...', 'grant']
    // ignore unknown metakey or multiple '...'
    order: ['name', 'description', 'namespace', '...', 'grant'],

    // version override: string | null(default)
    // override file `version` metakey
    version: null
  })]
};
```

```javascript
// metablock.json
{
  // If name / description use key-value form, default is required or throw an error

  // name : string | { default: string , [lang: string]: string}
  "name": "Hello World",

  // description : string | { default: string , [lang: string]: string}
  "description": {
    "default": "The example metablock",
    "en": "The example metablock",
    "zh-TW": "範例程式"
  },

  // namespace : string
  "namespace": "https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock",

  // version : string
  // Recommend: https://developer.mozilla.org/docs/Toolkit_version_format
  "version": "1.0.0",

  // include : string | string[]
  // exclude : string | string[]
  // If no include/match is provided and manager set 'compatible', set '@include *' explicitly
  "include": "*://*.example.com/*",
  "exclude": [
    "*://*.example*/api*",
    "*://*.example*/user*"
  ],

  // match : url-pattern | url-pattern[]
  // Match Pattern: https://developer.chrome.com/extensions/match_patterns
  // If match has any invalid url-pattern, throw an error
  "match": "https://*.example.net/*",

  // icon : string
  "icon": "https://static.example.net/favicon.ico",

  // require : string | string[]
  "require": ["https://static.example.net/jquery.min.js"],

  // resource, compatible, ... other trinary metakey : { [name : string] : string }
  "resource": {
    "css": "https://static.example.net/main.css",
    "banner": "https://static.example.net/banner.png"
  },

  // run-at: 'document-start' | 'document-idle' | 'document-end' | 'context-menu'
  // default: 'document-end'
  "run-at": "document-start",

  // noframes, ... other unary metakey: boolean
  "noframes": true,

  // grant: null | string | string[]
  // if no set or set null, generate `@grant none` explicitly
  "grant": [
    "GM_setValue",
    "GM_getValue"
  ],

  // GreasyFork support metakeys
  // https://greasyfork.org/help/meta-keys

  // license : string
  "license": "MIT",

  // supportURL : string
  "supportURL": "https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock",

  // compatible : {['firefox' | 'chrome' | 'opera' | 'safari']: string}
  // incompatible : {['firefox' | 'chrome' | 'opera' | 'safari']: string}
  "compatible": {
    "firefox": ">=57",
  }
}
```

## Todo

- [ ] validate version string
- [ ] validate url

## License

MIT
