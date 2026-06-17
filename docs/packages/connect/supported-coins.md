# Supported coins

## Ownership

The coin definitions live in `@trezor/connect-data` and are owned there. The files are:

- `packages/connect-data/files/coins.json` — Bitcoin-like and miscellaneous coins.
- `packages/connect-data/files/coins-eth.json` — Ethereum networks.

These files are the source of truth. They are committed to this repository and edited directly here; there is no generation step and no automatic sync from an upstream source.

> Historically these files were regenerated from the [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/main/common/defs) definitions via the `trezor-common` submodule and a `cointool.py` pipeline. That sync has been retired — `@trezor/connect-data` now owns the definitions outright, so edit the JSON files directly instead of regenerating them. Upstream coin-definition changes are no longer pulled in automatically; if a relevant upstream change lands, port it by hand into the JSON files.

## Editing the definitions

1. Edit the relevant file directly: `packages/connect-data/files/coins.json` for Bitcoin-like and miscellaneous coins, or `packages/connect-data/files/coins-eth.json` for Ethereum networks.
2. Keep the existing field shape — the in-memory schema is hand-maintained in `packages/connect-common/src/types/coinInfo.ts`, and the parser in `packages/connect/src/data/coinInfo.ts` reads the files as-is.
3. Run `yarn prettier --write packages/connect-data/files/coins.json packages/connect-data/files/coins-eth.json` to keep the formatting consistent.
4. Make sure the corresponding [connect support](https://github.com/trezor/trezor-firmware/blob/main/common/defs/support.json) expectations still hold for any coin you add or change.

> Warning: the retired pipeline used to drop any coin whose `support` map was `false` for every device model. Nothing filters those out anymore, so a coin present in the JSON is parsed by `packages/connect/src/data/coinInfo.ts` and surfaces in `getAllNetworks()` regardless of its `support` values. When adding a coin, make sure its `support` map reflects reality — a coin unsupported on all models should not be added.

> Note: the `submodules/trezor-common` submodule is still required for other purposes (e2e test vectors and `yarn update-models`) and is unaffected by coin-definition edits.
