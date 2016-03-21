# High-performance Bitcoin HD Wallet

For now, mostly a PoC.  Uses
[bitcore-node](https://github.com/bitpay/bitcore-node)
for transaction lookup and
[trezor-crypto](https://github.com/trezor/trezor-crypto)
for address derivation, compiled through emscripten and run in a web worker.
Supports persisting discovered state and doing partial update later on.
Should out-perform all wallets available today that do client-side chain
discovery.

## Example usage

Don't forget to `git submodule update --recursive --init`, set `BITCORE_URL` and
`XPUB` constants in `test/index.js` and run `make example server`.

**Note**: Bitcore backend needs to have `insight-api` plugin enabled.
