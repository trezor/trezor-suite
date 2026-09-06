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
        protocolParams?: Partial<CardanoProtocolParams>;
        debug?: boolean;
        forceLargestFirstSelection?: boolean;
    },
);
```

## Protocol parameters

Every protocol parameter the transaction builder needs is an **input**, not a constant:

```typescript
import { DEFAULT_CARDANO_PROTOCOL_PARAMS } from '@trezor/network-cardano-coin-selection/src/protocolParams';
```

`options.protocolParams` is merged over `DEFAULT_CARDANO_PROTOCOL_PARAMS`, so a caller may override
any subset. The defaults track current Cardano mainnet values and are the documented fallback for
callers that have no live source.

`getProtocolParamsDrift` compares values obtained from a live source against the compiled-in
defaults and reports the ones that disagree, so a protocol-parameter update does not pass unnoticed.

The `src/protocolParams` module is deliberately cheap to import — in particular it does not touch
the serialization lib — so packages that only need the values can read them without pulling in
~4.4 MB of WASM.

## Main differences from upstream

- **Protocol parameters are an input.** Upstream hardcoded `min_fee_b`, `key_deposit`,
  `pool_deposit`, `coins_per_utxo_byte`, `max_value_size` and `max_tx_size` inside `getTxBuilder`
  and `calculateRequiredDeposit`, exposing only `min_fee_a` through `options.feeParams.a`. That
  option is replaced by `options.protocolParams`, and `getTxBuilder` by `createTxContext`, which
  derives both the transaction builder and the min-UTxO data cost from the resolved parameters.
- **No WASM at module scope.** Upstream's constants module called into the serialization lib while
  being imported (`NetworkInfo.*()` for the protocol magics and network ids, plus a never-freed
  `DataCost`), so merely importing a type dragged in the WASM module. Protocol magics and network
  ids are plain literals now, and the data cost is derived per call.
- Tests are colocated with their sources, per the monorepo convention.
- Narrowing added where `noUncheckedIndexedAccess` (enabled repo-wide, not upstream) exposed
  unchecked index access, and a few no-op statements removed to satisfy the shared lint config.
