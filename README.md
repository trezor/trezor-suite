# High-performance Bitcoin HD Wallet

For now, mostly a PoC.  Uses
[bitcore-node](https://github.com/bitpay/bitcore-node)
for transaction lookup and
[trezor-crypto(https://github.com/trezor/trezor-crypto)
for address derivation, compiled through emscripten and run in a web worker.
Supports persisting discovered state and doing partial update later on.
Should out-perform all wallets available today that do client-side chain
discovery.

## Usage

Set `BITCORE_URL` and `XPUB` constants in `lib/index.js` and run
`make build server`.

**Note**: Currently uses custom modifications of `bitcore-node`, hopefully the
changes will land in upstream soon.
