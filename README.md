# High-performance Bitcoin HD Wallet

[![Build Status](https://travis-ci.org/trezor/hd-wallet.svg?branch=master)](https://travis-ci.org/trezor/hd-wallet) [![gitter](https://badges.gitter.im/trezor/community.svg)](https://gitter.im/trezor/community)

For now, mostly a PoC.  Uses
[bitcore-node](https://github.com/bitpay/bitcore-node)
for transaction lookup and
[trezor-crypto](https://github.com/trezor/trezor-crypto)
for address derivation, compiled through emscripten and run in a web worker.
Supports persisting discovered state and doing partial update later on.
Should out-perform all wallets available today that do client-side chain
discovery.

## Example usage

Example is in `example/index.js`; it is compiled in makefile to `gh-pages` directory by `make example`.

Built version is in `gh-pages` branch.

You can also try it yourself here - http://trezor.github.io/hd-wallet/example.html (note that xpubs are preloaded there, but some simple GUI for inputing the XPUBs could be probably done).

## License

GPLv3, (C) 2016 Karel Bilek, Jan Pochyla
