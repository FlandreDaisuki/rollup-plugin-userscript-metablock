# rollup-plugin-userscript-metablock

[![npm version](https://badge.fury.io/js/rollup-plugin-userscript-metablock.svg)](https://www.npmjs.com/package/rollup-plugin-userscript-metablock)

Transform json file to userscript metablock and append on.

Metakeys documents:

- [Tampermonkey](https://tampermonkey.net/documentation.php)
- [Greasemonkey](https://wiki.greasespot.net/Metadata_Block)
- [Violentmonkey](https://violentmonkey.github.io/api/metadata-block/)
- [GreasyFork](https://greasyfork.org/help/meta-keys)

## Installation

```
npm install --save-dev rollup-plugin-userscript-metablock
```

## Usage

simplest

```js
import metablock from 'rollup-plugin-userscript-metablock';

export default {
  input: 'main.js',
  output: {
    file: 'bundle.user.js',
    format: 'esm'
  },
  plugins: [metablock()],
};
```

common

```js
import metablock from 'rollup-plugin-userscript-metablock';

const pkg = require('package.json');

export default {
  input: 'main.js',
  output: {
    file: 'bundle.user.js',
    format: 'esm'
  },
  plugins: [metablock({
    file: './meta.json',
    override: {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      homepage: pkg.homepage,
      author: pkg.author,
      license: pkg.license,
    }
  })],
};
```

You can find the options detail [here](./docs/options.md), and meta details [here](./docs/meta.md).

### Other

1. If no grant, use `@grant none` explicitly
   - Greasemonkey treat no set as `@grant none`. [Ref](https://wiki.greasespot.net/@grant)
   - Tampermonkey treat no set as grant you use but some need declare explicitly. [Ref](https://tampermonkey.net/documentation.php#_grant)
   - Both can use info (`GM_info` / `GM.info`) without grant
   - **Idea:** Maybe add a todo that inspect code to auto generate grant

## License

MIT
