# Path

-   `path` - `string | Array<number>` in [BIP44](https://github.com/trezor/trezor-firmware/blob/main/docs/misc/coins-bip44-paths.md#bip-44-derivation-paths) path scheme or `Array` of hardended numbers.

## Examples

Bitcoin account 1 using BIP44 derivation path

```javascript
"m/49'/0/'0'";
```

Bitcoin account 1 using hardended path

```javascript
[(49 | 0x80000000) >>> 0, 0 | (0x80000000 >>> 0), (0 | 0x80000000) >>> 0];
```

Bitcoin first address address of account 1 using BIP44 derivation path

```javascript
"m/49'/0/'0'/0/0";
```

Bitcoin first address address of account 1 using hardended path

```javascript
[(49 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 0, 0];
```

[See more examples](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples)
