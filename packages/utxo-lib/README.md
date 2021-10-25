# Trezor UTXO library (@trezor/utxo-lib)
[![NPM](https://img.shields.io/npm/v/@trezor/utxo-lib.svg)](https://www.npmjs.org/package/@trezor/utxo-lib)

Javascript Bitcoin and Bitcoin-like altcoins library for node.js and browsers.

This library is a fork of the `bitcoinjs-lib` and it is profiled to work with `Trezor` environment.

Not all the modules/methods from the upstream are present here (like ecpair, psbt...) since we didn't use them for now, however they might be easily added in the future.

*You probably don't want to use this package directly. Try one of the alternatives instead:*

- [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
- [@bitgo/utxo-lib](https://github.com/BitGo/BitGoJS/tree/master/modules/utxo-lib)
- [bcoin](https://github.com/indutny/bcoin)
- [bitcore](https://github.com/bitpay/bitcore)
- [cryptocoin](https://github.com/cryptocoinjs/cryptocoin)


## History timeline
This is fifth and hopefully ultimate attempt to fork and maintain `bitcoinjs-lib`.

1. https://www.npmjs.com/package/bitcoinjs-lib-zcash
1. https://github.com/trezor/bitcoinjs-trezor
1. https://github.com/BitGo/bitgo-utxo-lib
1. https://github.com/trezor/trezor-utxo-lib

## Main differences
Differences are explicitly described in each file.

- `Transaction` class is extended by each custom `altcoin` implementation.
- `Transaction` class is parsing amounts as strings.
- `address` module uses different encoding for `Decred` and handles `Bitcoin Cash` addresses.
- added `coinselect` and `compose` modules (origin source: https://github.com/trezor/hd-wallet/tree/master/src/build-tx)
- removed unused modules: `block`, `classify`, `ecpair`, `psbt`.
