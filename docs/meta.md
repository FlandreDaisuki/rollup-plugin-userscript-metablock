# Supported Metakeys & Metavalues

- [Supported Metakeys \& Metavalues](#supported-metakeys--metavalues)
  - [Basic Matas](#basic-matas)
    - [name](#name)
    - [description](#description)
    - [namespace](#namespace)
    - [match](#match)
    - [include](#include)
    - [exclude](#exclude)
    - [icon](#icon)
    - [require](#require)
    - [run-at](#run-at)
    - [resource](#resource)
    - [version](#version)
    - [noframes](#noframes)
    - [grant](#grant)
    - [antifeature](#antifeature)
    - [sandbox](#sandbox)

## Basic Matas

Every script manager support.

### name

| attr | value | description |
|:-:|:-:|:-:|
| type | `String`| nonempty string |
| example | `My First Script` |  |
| type | `Object`| **default is required** in Object type |
| `Object.key` | `String` | lang(:local) or `'default'` |
| `Object.value` | `String` |  |
| example | [name-object-example](#name-object-example) |  |
| default | `'New Script'` ||
|exception| `InvalidMetaValue` | empty string in `String` type |
|exception| `InvalidMetaValue` | no **default** in `Object` type |

#### name-object-example

```js
{
  default: 'My First Script',
  'en': 'My First Script',
  'zh-TW': '我的第一個腳本'
}
```

### description

similar to [name](#name)

### namespace

| attr | value | description |
|:-:|:-:|:-:|
| type | `String`| nonempty string |
| example | `https://example.com` |  |
| default | `'npmjs.com/rollup-plugin-userscript-metablock'` ||
|exception| `InvalidMetaValue` | non `String` type |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

### match

**MatchPattern**: https://developer.chrome.com/extensions/match_patterns

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **MatchPattern** |
| example | `'https://*.example.com/'` ||
| type | `String[]` | every string is valid **MatchPattern** |
| example | [match-array-example](#match-array-example) |  |
|exception| `InvalidMetaValue` | invalid **MatchPattern** in `String` type |
|exception| `InvalidMetaValue` | include invalid **MatchPattern** in `String[]` type |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

#### match-array-example

```js
[
  'https://*.example.com/',
  '*://*/*'
]
```

### include

**GlobURI**: uri with glob `*` or RegExp string without escape

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **GlobURI** |
| example | `'https://*'` | uri with glob `*` |
| example | `'/^https?://.*$/'` | RegExp string without escape |
| type | `String[]` | every string is valid **GlobURI** |
| example | [include-array-example](#include-array-example) |  |
|exception| `InvalidMetaValue` | invalid **GlobURI** in `String` type |
|exception| `InvalidMetaValue` | include invalid **GlobURI** in `String[]` type |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

#### include-array-example

```js
[
  'https://www.example*',
  '/^https?://.*$/',
  '*'
]
```

### exclude

similar to [include](#include)

### icon

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **URI** |
| example | `'https://icon.com/favicon.ico'` ||
|exception| `InvalidMetaValue` | invalid **URI** in `String` type |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

### require

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **URI** |
| example | `'https://code.jquery.com/jquery.js'` |  |
| type | `String[]` | every string is valid **URI** |
| example | [require-array-example](#require-array-example) |  |
|exception| `InvalidMetaValue` | invalid **URI** in `String` type |
|exception| `InvalidMetaValue` | include invalid **URI** in `String[]` type |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

#### require-array-example

```js
[
  'https://code.jquery.com/jquery.js',
  'https://code.jquery.com/jquery-ui.js'
]
```

### run-at

**RUNAT-ENUM**:

- `'document-end'`
- `'document-start'`
- `'document-idle'`
- `'document-body'` (only tm support)
- `'context-menu'` (only tm support, only chrome)

If value is not valid **RUNAT-ENUM**, set to default value.

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **RUNAT-ENUM** |
| default | `'document-end'` ||
| example | `'document-start'` ||
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

### resource

| attr | value | description |
|:-:|:-:|:-:|
| type | `Object`||
| `Object.key` | `String` |  |
| `Object.value` | `String` | valid **URI** |
| example | [resource-object-example](#resource-object-example) ||
|exception| `InvalidMetaValue` | non `Object` type |
|exception| `InvalidMetaValue` | some `Object.value` is invalid **URI** |
|exception| `InvalidMetaValue` | falsy |

#### resource-object-example

```js
{
  css: 'https://example.com/example.css',
  csvdata: 'https://example.com/data.csv'
}
```

### version

**SemVer**: https://semver.org/

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **SemVer** |
| example | `'1.0.0'` ||
|exception| `InvalidMetaValue` | need guess **SemVer** from yours |
|exception| `InvalidMetaValue` | empty string |
|exception| `InvalidMetaValue` | falsy |

### noframes

| attr | value | description |
|:-:|:-:|:-:|
| type | `any` | non falsy |
| example | `true` ||
|exception| `InvalidMetaValue` | falsy |

### grant

> **work in progress**
>
> now any value just view as `String`

**API**:

- [Tampermonkey](https://tampermonkey.net/documentation.php)
- [Greasemonkey](https://wiki.greasespot.net/Greasemonkey_Manual:API)
- [Violentmonkey](https://violentmonkey.github.io/api/gm/)

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **API** by _manager_ |
| example | `'GM_getValue'` ||
| default | `'none'` | always explicit `'none'` |
| type | `String[]` | every string is valid **API** by _manager_ |
| example | [grant-array-example](#grant-array-example) |  |
|exception| `InvalidMetaValue` | invalid **API** by _manager_ in `String` type |
|exception| `InvalidMetaValue` | include invalid **API** by _manager_ in `String[]` type |

#### grant-array-example

```js
[
  'GM_getValue',
  'GM_setValue',
  'unsafeWindow'
]
```

### antifeature

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **ANTIFEATURE-ENUM** |
| example | `'ads'` ||
| type | `String[]` ||
| example | [antifeature-array-example](#antifeature-array-example) |  |
|exception| `InvalidMetaValue` | invalid **API** by _manager_ in `String` type |
|exception| `InvalidMetaValue` | include invalid **API** by _manager_ in `String[]` type |

**SANDBOX-ENUM**:

- `'ads'`
- `'tracking'`
- `'miner'`

#### antifeature-array-example

```js
[
  'ads',
  'miner'
]
```

### sandbox

(only tm support)

| attr | value | description |
|:-:|:-:|:-:|
| type | `String` | valid **SANDBOX-ENUM** |
| example | `'raw'` ||
|exception| `InvalidMetaValue` | invalid **API** by _manager_ in `String` type |

**SANDBOX-ENUM**:

- `'raw'`
- `'JavaScript'`
- `'DOM'`
