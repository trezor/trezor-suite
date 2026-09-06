# @trezor/network-cardano-coin-selection

Minimal implementation of Cardano coin selection algorithms (see [CIP-2](https://cips.cardano.org/cips/cip2/)).
Under the hood it leverages the Cardano Serialization Lib via a WASM module.

This library is a fork of [`@fivebinaries/coin-selection`](https://github.com/fivebinaries/coin-selection)
(version `3.0.0`, Apache-2.0), vendored into the monorepo. The upstream package was, in its own
words, "developed solely for Trezor Suite", but it has had no release since December 2024 and only
compiled output ever shipped to npm — so protocol-critical constants baked into it could not be
changed without an upstream publish. Vendoring makes the code buildable, testable and fixable
in-tree.

_You probably don't want to use this package directly._ Suite consumes it through
[`@trezor/network-cardano`](../network-cardano), which owns the lazy-loading boundary for the WASM
module. It lives under `networks/cardano/` because that is where [the networks
guide](../../README.md) puts a network's third-party code, and it is an optional package with a
custom suffix: nothing outside this directory may import it.

## Features

- **Final tx plan**: compose a transaction plan for given inputs (Shelley UTxOs only), certificates
  (stake registration/deregistration, delegation and vote delegation) and withdrawals.
- **Draft tx plan**: return basic information about a potential transaction (size, fee) even for
  incomplete inputs (no recipient address or amount).
- **Set max**: calculate the maximum amount of an asset that can be included in an output.

## Usage

```typescript
const txPlan = coinSelection(
    {
        utxos: Utxo[];
        outputs: UserOutput[];
        changeAddress: string;
        certificates: Certificate[];
        withdrawals: Withdrawal[];
        accountPubKey: string;
        ttl?: number;
    },
    {
        feeParams?: { a: string };
        debug?: boolean;
        forceLargestFirstSelection?: boolean;
    },
);
```

## Main differences from upstream

- Tests are colocated with their sources, per the monorepo convention.
- Narrowing added where `noUncheckedIndexedAccess` (enabled repo-wide, not upstream) exposed
  unchecked index access, and a handful of no-op statements removed to satisfy the shared lint
  config. Behaviour is unchanged — the full upstream test suite passes as-is.
