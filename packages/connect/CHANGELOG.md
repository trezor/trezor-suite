|             Package              | Stable |     Canary     |
| :------------------------------: | :----: | :------------: |
|       npm @trezor/connect        |   -    | 10.0.0-alpha.1 |
|     npm @trezor/connect-web      |   -    | 10.0.0-alpha.1 |
| npm @trezor/connect-webextension |   -    | 10.0.0-alpha.1 |
|    npm @trezor/connect-mobile    |   -    | 10.0.0-alpha.1 |

|     Deployment     | Stable |     Canary     |
| :----------------: | :----: | :------------: |
| connect.trezor.io/ |   -    | 10.0.0-alpha.1 |

Use the persistent link [connect.trezor.io/10](https://connect.trezor.io/10/) to access the latest stable version of Connect Explorer.

# 10.0.0-alpha.1

First beta release of version 10.
This version removes support for legacy iframe and popup integration methods and replaces them with new Suite-based integration.

Features:

- `solanaSignTransaction` now accepts a `chunkify` flag that renders addresses in the transaction confirmation on the device in chunks of 4 characters, matching the existing behavior of `solanaGetAddress` and the sign flows of other coins. Requires firmware with chunked-address support in the Solana `SignTx` flow.
- Tron support (`tronGetAddress`, `tronSignTransaction`)
- `ethereumSignTypedData` now computes `domain_separator_hash` / `message_hash` internally for T1B1 firmware. Callers no longer need to pre-compute hashes via `@trezor/connect-plugin-ethereum`; passing only `data` works for all supported Trezor models. Caller-provided hashes still take precedence for backwards compatibility. Implementation is powered by `viem` and lives in the lazy-loaded ethereum chunk, so non-Ethereum consumers do not pay any bundle cost.

Breaking changes:

- `getAccountDescriptor` has been removed. The per-coin `*GetPublicKey` methods (`getPublicKey`, `ethereumGetPublicKey`, `cardanoGetPublicKey`, `solanaGetPublicKey`, `tezosGetPublicKey`) now return the same fields after the response-shape unification, so the dedicated descriptor entry point is no longer needed. Consumers that previously called `getAccountDescriptor` should call the appropriate `*GetPublicKey` for the target coin. Field mapping from the old `getAccountDescriptor` payload:
    - `payload.descriptor` → Bitcoin: `result.descriptor` on `getPublicKey`. Non-Bitcoin coins did not return a descriptor; use `result.displayablePublicKey` for the canonical user-facing form.
    - `payload.path` (serialized string) → `result.serializedPath` on every `*GetPublicKey`.
    - For a generic, per-coin agnostic consumer that just needs the canonical user-facing public-key string, read the new `result.displayablePublicKey` field.
- `TransportInfo.outdated` has been removed. The legacy standalone `trezord-go` Bridge (port `21325`) is no longer supported by the bundled `BridgeTransport`; detection of an outdated Bridge moved out of `@trezor/connect` and into consumer apps.
- `BridgeTransport` factory no longer instantiates a second dual-port instance for the legacy `21325` port. Consumers pointing `BridgeTransport` at a custom port via the `transports` option are unaffected.
- `TrezorConnect.disableWebUSB()` has been removed. It was a thin WebUSB-specific wrapper over the generic transport-reconfiguration path (`SET_TRANSPORTS` → `resetTransports` → `deviceList.init`). Use `TrezorConnect.updateConnectSettings({ transports })` instead, supplying a filtered transports list. Example: `TrezorConnect.updateConnectSettings({ transports: current.filter(t => t.type !== 'WebUsbTransport').map(t => t.type) })`. The new flow is live — no app reload is required. As part of this cleanup, the now-unused `TRANSPORT.DISABLE_WEBUSB` constant has been removed from `@trezor/transport-common` and the matching `TransportDisableWebUSB` event type from `@trezor/connect-common`.
- The per-call `useCardanoDerivation` common parameter has been removed. Cardano session derivation (`derive_cardano`) is now driven by an application-level `enabledNetworks` declaration: pass `enabledNetworks: [{ coin: 'ada' }]` to `TrezorConnect.init({ ... })` (or, for in-process Core hosts, `TrezorConnect.updateConnectSettings({ enabledNetworks: [...] })`). Migration: declare your networks via `enabledNetworks` at init and drop `useCardanoDerivation` from individual calls.
- `enabledNetworks` (declared via `TrezorConnect.init` / `updateConnectSettings`) is honored only by the in-process `@trezor/connect` package. The thin packages (`@trezor/connect-web`, `@trezor/connect-mobile`, `@trezor/connect-webextension`) do not forward `enabledNetworks` to the host Core; on those, Cardano availability follows the host (Trezor Suite) wallet's own enabled coins.
- **`@trezor/connect` and every package in its dependency closure now ship ESM only.** Several transitive dependencies (`@noble/curves`, `@noble/hashes`, `@scure/base`, `@scure/bip39`, `@solana/kit`, `@solana-program/*`, `viem`, `node-fetch@3+`) are already ESM-only, so a CJS consumer of `@trezor/connect` cannot statically import them in any case. To keep the build pipeline consistent, the entire connect ecosystem follows suit: `@trezor/connect`, `@trezor/connect-web`, `@trezor/connect-webextension`, `@trezor/connect-mobile`, `@trezor/connect-common`, `@trezor/connect-data`, `@trezor/connect-plugin-ethereum`, `@trezor/connect-plugin-stellar`, `@trezor/blockchain-link`, `@trezor/blockchain-link-utils`, `@trezor/blockchain-link-types`, `@trezor/utxo-lib`, `@trezor/device-authenticity`, `@trezor/address-validator`, `@trezor/utils`, `@trezor/transport`, `@trezor/protobuf`, `@trezor/protocol`, `@trezor/schema-utils`, `@trezor/crypto-utils`, `@trezor/device-utils`, `@trezor/env-utils`, `@trezor/type-utils`, `@trezor/websocket-client`. Migration:
    - ESM consumer: replace `const TrezorConnect = require('@trezor/connect').default` with `import TrezorConnect from '@trezor/connect'`. Set `"type": "module"` in your `package.json` or use the `.mjs` extension.
    - CJS consumer that cannot migrate: use a dynamic import — `const TrezorConnect = (await import('@trezor/connect')).default;` — or stay on v9.
- All `*GetPublicKey` methods now return a `displayablePublicKey: string` field — the canonical user-facing representation per coin (`xpubSegwit ?? xpub` for Bitcoin, i.e. ypub/zpub for SegWit and `tr(...)` descriptor for Taproot; xpub for Ethereum/Cardano; base58 for Solana; base58check `edpk…` for Tezos). Generic consumers can display any public-key response without per-coin branching. The shared `PublicKey` base stays minimal (only `displayablePublicKey` is added); per-coin extras remain on per-coin response types.
- `cardanoGetPublicKey` now exposes the Cardano extended public key via the explicit `xpub: string` field.

Breaking changes:

- `cardanoGetPublicKey`: the `publicKey` field is now the raw 32-byte public key in hex (consistent with other coins). The Cardano extended public key previously returned in `publicKey` is now exposed via the new explicit `xpub` field. Update consumers to read `xpub` (or `displayablePublicKey`) for the extended key.

Deprecations:

- Remove connect-iframe and connect-popup integration
- Remove EOS support
- Remove NEM support
- `@trezor/connect-plugin-ethereum` is deprecated. Its logic was inlined into `@trezor/connect`. When upgrading to Connect 10, drop your direct dependency on the plugin and remove manual `transformTypedData` calls. The 10.x release of the plugin is a stub that throws a deprecation error pointing at the migration.

Commits:

- chore: remove connect-iframe (372d11f819)
- feat(connect): tronSignTransaction (57eec2f1a2)
- feat(connect): tronGetAddress (f5a2bfb6cb)
- chore(suite-native): remove deprecated node-libs-browser (5ff326e491)
- test(connect): don't set up emu repeatedly if not necessary (55b93ac8e7)
- chore: bump webpack-related deps (3f73273dba)
- chore(connect): remove unsupported fixture (5acfbb81d5)
- feat(connect): core-in-popup and iframe with popup modes are now removed (a902e2d3cb)
- fix: use AccountDescriptor as branded type (47f2cc48d5)
- feat(connect): remove EOS support (16da7214cc)
- feat(connect): validation for sign message size for T1B1 (d1fb78727e)
- feat(connect): remove NEM support (b9e7b55832)
- refactor(connect): use CoreInModule directly (e9a5c47c7d)
- refactor(connect): flatten TrezorConnectDynamic with CoreInModule (a8038c6a70)
- chore(connect): move web module into main package (815158241a)
- chore(connect): remove unsuppoted fixtures from txcache in tests (e5214e5706)
- chore: bump prettier (3e33cbeee4)
- ci(connect): expand npm install check to cover both ESM & CJS (c15485ed96)
- chore(npm): start publishing source maps (36f6e9692d)
- fix(connect): change THP phase after successful ThpEndResponse (66b6b03416)
- chore(connect): move thp staticKey from ThpSettings to DeviceThpCredentials (6aa0bc6a06)
- chore(device-authenticity): extract prepareDeviceAuthenticityData (2e061e4cc2)
- chore(connect, blockchain-link): validate custom RPCs chainIds (8977871032)
- feat(suite): implement evm-rpc worker into suite (cdf207e01f)
