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

## Running regtest tests

* On debian/ubuntu-based linux, download and install this package - `https://www.dropbox.com/s/txkzsa1m2a7mp64/bitcore.deb?dl=1` - it install bitcore + bitcoin core, with regtest enabled
  * then run `sudo service stop bitcore-regtest` (so you stop the auto-started bitcore) - only necessary on systemd distros, but all of them are probably
* then run, in one terminal, `sudo su bitcore-regtest -c 'nodejs test_helpers/_node_server.js' -s /bin/bash` - that runs a server, to which the tests post messages and it runs whatever gets posted there in bash (not secure, but you run it as bitcore-regtest user, so it's fine probably)
* then you can run tests
  * `npm run unit`
  * `npm run karma-firefox`
  * `npm run karma-chrome`
  * karma tests do the same thing as unit tests, just in browser instead of node

## License

GPLv3, (C) 2016 Karel Bilek, Jan Pochyla
