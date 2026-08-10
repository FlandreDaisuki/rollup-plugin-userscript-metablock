# rollup-plugin-userscript-metablock

Transform json file to userscript metablock and append on.

Metakeys documents:

- [Tampermonkey](https://tampermonkey.net/documentation.php)
- [Greasemonkey](https://wiki.greasespot.net/Metadata_Block)
- [Violentmonkey](https://violentmonkey.github.io/api/metadata-block/)
- [GreasyFork](https://greasyfork.org/help/meta-keys)

## Installation

```sh
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
import pkg from './package.json' with { type: 'json' };

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

### JSON Schema

JSON metadata files can reference the schema shipped with this package for editor completion and validation. The file itself is the metadata object, so its top-level properties are metakeys without the leading `@`:

```json
{
  "$schema": "https://cdn.jsdelivr.net/npm/rollup-plugin-userscript-metablock@latest/userscript-metadata.schema.json",
  "name": "My userscript",
  "match": "https://example.com/*",
  "grant": "none"
}
```

The same schema is also available from [UNPKG](https://unpkg.com/rollup-plugin-userscript-metablock/userscript-metadata.schema.json). The plugin ignores the `$schema` property when it renders the metablock.

### JavaScript metadata files

The `file` option also accepts `.js`, `.mjs`, and `.cjs` modules. Use `defineMetadata` to get IDE auto-completion:

```js
// metablock.mjs
import { defineMetadata } from 'rollup-plugin-userscript-metablock';

export default defineMetadata({
  name: 'My userscript',
  grant: 'none',
});
```

```js
// metablock.cjs
const { defineMetadata } = require('rollup-plugin-userscript-metablock');

module.exports = defineMetadata({
  name: 'My userscript',
  grant: 'none',
});
```

### Rolldown

This plugin also works with Rolldown. See the complete [Rolldown example](./examples/Rolldown).

### Other

1. If no grant, use `@grant none` explicitly
   - Greasemonkey treat no set as `@grant none`. [Ref](https://wiki.greasespot.net/@grant)
   - Tampermonkey treat no set as grant you use but some need declare explicitly. [Ref](https://tampermonkey.net/documentation.php#_grant)
   - Both can use info (`GM_info` / `GM.info`) without grant
   - **Idea:** Maybe add a todo that inspect code to auto generate grant

## License

MIT
