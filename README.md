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
    // Metablock file path
    file: 'my-metablock.json', // Default: 'metablock.json'

    // Change order from file
    // * 'name' can include 'name:lang'
    // * 'description' can include 'description:lang'
    // * '...' as a special key means others
    // * ignore unknown or duplicate key
    order: ['...'], // Default: ['name', 'description', 'namespace', '...', 'grant']

    // Override file 'version' key, from file if null
    version: require('./package.json').version, // Default: null

    // Auto extend monkey api if 'grant' key set implicit
    // * 'tampermonkey': 'setValue' -> 'GM_setValue'
    // * 'greasemonkey4': 'setValue' -> 'GM.setValue'
    // * 'both': 'setValue' -> 'GM_setValue' & 'GM.setValue'
    monkey: 'both', // Default: 'tampermonkey'

    // Validators can throw error to lint your metablock file
    // * you can set false or null to validators to disable all
    validators: {
      // you should have "namespace" in file
      "namespace-require": true, // Default: true

      // you should have "include" or "match" in file
      "include-require": true, // Default: true

      // you should have corresponding "name" and "description" in file
      "name-description": true, // Default: true

      // check valid url-pattern for "match"
      "valid-url-pattern": true,  // Default: true
    },
  })]
};
```

## Metablock file
### General
|key|validator|type|note|
|:-:|:--:|:--:|:--:|
|name|name-description|String|**This key is required**|
|└||{default: String,<br/>[lang]: String}|default is required if Object|
|description|name-description|String||
|└||{default: String,<br/>[lang]: String}|default is required if Object|
|namespace||String||
|version||String|Recommend: [Mozilla toolkit format](https://developer.mozilla.org/docs/Toolkit_version_format)|
|include|include-require|url String with wildcard||
|├||regexp String|Detail: [Include and exclude rules](https://wiki.greasespot.net/Include_and_exclude_rules)<br/>String because it's not familar js Regex and Regex string form |
|└||Array of above||
|exclude||url String with wildcard||
|├||regexp String||
|└||Array of above||
|match|include-require|match pattern|Detail: [match patterns](https://developer.chrome.com/extensions/match_patterns)|
|icon||resource url String|
|require||resource url String|
|└||Array of above||
|resource||{[resource name]: resource url String}|Trinary meta form
|run-at||"document-start" /<br/>"document-idle" /<br/>"document-end" /<br/>"document-body" /<br/>"context-menu"|only tempermonkey support last 2
|noframes||Boolean|Unary meta form|
|grant||explicit API String|with `GM_` or `GM.`|
|├||implicit API String|without `GM_` or `GM.`|
|└||Array of above||

### Greasy Fork Support
|key|validator|type|note|
|:-:|:--:|:--:|:--:|
|license||String||
|supportURL||url String||
|compatible||{[browser]: String}|Greasy Fork only support<br/>`firefox`, `chrome`, `opera`, `safari`|
|incompatible||{[browser]: String}|Greasy Fork only support<br/>`firefox`, `chrome`, `opera`, `safari`|

### Misc

1. If no grant, use `@grant none` explicitly
   - Greasemonkey treat no set as `@grant none`. [Ref](https://wiki.greasespot.net/@grant)
   - Tampermonkey treat no set as grant you use but some need declare explicitly. [Ref](https://tampermonkey.net/documentation.php#_grant)
   - Both can use info (`GM_info` / `GM.info`) without grant
   - **Idea:** Maybe add a todo that inspect code to auto generate grant
2. If no include or match and set validator: `include-require` to false
   - Greasemonkey treat no set to `@include *`. [Ref](https://wiki.greasespot.net/Include_and_exclude_rules)
   - Tampermonkey treat no set to match nothing. (I've test in tampermonkey 4.5.5619 on Firefox and Chrome)
3. If no namespace and set validator: `namespace-require` to false
   - Because name + namespace is a script id, it will overwrite your script if both name is the same and both namespace no set.
   - **Idea:** Maybe auto generate this script name as the namespace if no set.

### Simplest Example

```javascript
// metablock.json
{
  "name": "Hello World",
  "description": "Say Hello",
  "namespace": "https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock",
  "include":"*"
}
```

### Complicated Example

```javascript
// metablock.json
{
  "name": "Hello World",
  "description": {
    "default": "The example metablock",
    "en": "The example metablock",
    "zh-TW": "範例程式"
  },
  "namespace": "https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock",
  "version": "1.0.0",
  "include": "*://*.example.com/*",
  "exclude": [
    "*://*.example*/api*",
    "*://*.example*/user*"
  ],
  "match": "https://*.example.net/*",
  "icon": "https://static.example.net/favicon.ico",
  "require": ["https://static.example.net/jquery.min.js"],
  "resource": {
    "css": "https://static.example.net/main.css",
    "banner": "https://static.example.net/banner.png"
  },
  "run-at": "document-start",
  "noframes": true,
  "grant": [
    "setValue",
    "getValue",
    "GM_download"
  ],

  "license": "MIT",
  "supportURL": "https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock",
  "compatible": {
    "firefox": ">=57",
  }
}
```

## License

MIT
