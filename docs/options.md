# Options of metablock

- [Options of metablock](#options-of-metablock)
  - [file](#file)
  - [override](#override)
  - [order](#order)
  - [validator](#validator)
  - [manager](#manager)

## file

The path of your metablock file.

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` ||
| default | `'./metablock.json'` |support following<br>`.json`<br>`.js, .cjs, .mjs`<br>`.yml, .yaml` |
| exception | `FileNotFound` | if path can't found |
| exception | `UnsupportedFormat` | if file extension isn't supported |
| exception | ??? | if parser throw exception |

## override

Override metakeys to all priority.

You can consider this will work as below:

```js
Object.assign({}, simplestMata, fromFileMeta, overrideMeta);
```

| attr | value | description |
|:-:|:-:|:-:|
| type | `Object`|contains valid metakey-metavalue |
| default | `null` ||

## order

Put metas by your wanted order.

This options will ignore invalid or duplicated `MetaKey`s.
The multilingual metakeys(`name:xx-YY`, `description:xx-YY`) are also ignored.

| attr | value | description |
|:-:|:-:|:-:|
| type | `String[]`| contains valid metakeys |
| default | `['name', 'description', 'namespace', '...', 'grant']` ||

## validator

Validate meta key and value.
If unknown value set, automatically set `'warn'`.

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` ||
| - | `'off'` | as quiet as possible for reading metablock file |
| - | `'warn'` | print warning when metablock has bad key-value |
| - | `'error'` | stop immediately and throw when metablock has bad key-value |
| default | `'warn'` ||

## manager

Hint the validator what manager you want to run your userscript.

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` ||
| - | `'tampermonkey'` | alias: `'tm'` |
| - | `'greasemonkey3'` | alias: `'gm3'` |
| - | `'greasemonkey4'` | alias: `'gm4'`, `'greasemonkey'`, `'gm'` |
| - | `'violentmonkey'` | alias: `'vm'` |
| - | `'compatible'` | alias: `'all'` |
| default | `'compatible'` ||
| exception | `UnknownScriptManager` | if the script manager doesn't support metakeys in your metablock |
