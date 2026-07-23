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

- The `coin` parameter now accepts only the lowercase coin **shortcut** (the `CoinSymbol` set); network **names** and **labels** are no longer accepted, and the `coin` type is narrowed from `string` to `CoinSymbol`, so a non-shortcut value now fails at compile time as well as at runtime. Resolution is uniform across all coin families (previously Bitcoin matched name/shortcut/label, misc matched name/shortcut, and EVM matched shortcut only). Migration — use the shortcut everywhere:
    - `getAddress({ coin: 'Bitcoin', … })` → `getAddress({ coin: 'btc', … })`
    - `getAccountInfo({ coin: 'Bitcoin Cash', … })` → `getAccountInfo({ coin: 'bch', … })`
    - `composeTransaction({ coin: 'cardano', … })` → `composeTransaction({ coin: 'ada', … })`

    A former name/label passed to a path-taking method (`getAddress`, `getPublicKey`, …) now derives the network from `path`, exactly as it does when `coin` is omitted; methods without a path fallback (`getAccountInfo`, `selectAccount`, `verifyMessage`, `composeTransaction`, `signTransaction`, `signMessage`, `getOwnershipId`, `getOwnershipProof`, and the `blockchain*` family) throw `Method_UnknownCoin`. The complete list of accepted shortcuts is the [`CoinSymbol`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/types/coinInfo.ts) type.

- `getAccountDescriptor` has been removed. The per-coin `*GetPublicKey` methods (`getPublicKey`, `ethereumGetPublicKey`, `cardanoGetPublicKey`, `solanaGetPublicKey`, `tezosGetPublicKey`) now return the same fields after the response-shape unification, so the dedicated descriptor entry point is no longer needed. Consumers that previously called `getAccountDescriptor` should call the appropriate `*GetPublicKey` for the target coin. Field mapping from the old `getAccountDescriptor` payload:
    - `payload.descriptor` → Bitcoin: `result.descriptor` on `getPublicKey`. Non-Bitcoin coins did not return a descriptor; use `result.displayablePublicKey` for the canonical user-facing form.
    - `payload.path` (serialized string) → `result.serializedPath` on every `*GetPublicKey`.
    - For a generic, per-coin agnostic consumer that just needs the canonical user-facing public-key string, read the new `result.displayablePublicKey` field.
- `getAccountInfo` no longer performs on-device account discovery. Calling it without `path` or `descriptor` previously triggered a device-driven account-selection popup; it now throws `Method_InvalidParameter` (`path or descriptor is required`). One of `path` (derive the descriptor on the device, then query the backend) or `descriptor` (backend-only query) is now required. Consumers that relied on the discovery flow should use `discoverAccounts` instead.
- `TransportInfo.outdated` has been removed. The legacy standalone `trezord-go` Bridge (port `21325`) is no longer supported by the bundled `BridgeTransport`; detection of an outdated Bridge moved out of `@trezor/connect` and into consumer apps.
- `BridgeTransport` factory no longer instantiates a second dual-port instance for the legacy `21325` port. Consumers pointing `BridgeTransport` at a custom port via the `transports` option are unaffected.
- The per-call `useCardanoDerivation` common parameter has been removed. Cardano session derivation (`derive_cardano`) is now driven by an application-level `enabledNetworks` declaration: pass `enabledNetworks: [{ coin: 'ada' }]` to `TrezorConnect.init({ ... })` (or, for in-process Core hosts, `TrezorConnect.updateConnectSettings({ enabledNetworks: [...] })`). Migration: declare your networks via `enabledNetworks` at init and drop `useCardanoDerivation` from individual calls.
- `enabledNetworks` (declared via `TrezorConnect.init` / `updateConnectSettings`) is honored only by the in-process `@trezor/connect` package. The thin packages (`@trezor/connect-web`, `@trezor/connect-mobile`, `@trezor/connect-webextension`) do not forward `enabledNetworks` to the host Core; on those, Cardano availability follows the host (Trezor Suite) wallet's own enabled coins.
- `TrezorConnect.disableWebUSB()` has been removed. It was a thin WebUSB-specific wrapper over the generic transport-reconfiguration path (`SET_TRANSPORTS` → `resetTransports` → `deviceList.init`). Use `TrezorConnect.updateConnectSettings({ transports })` instead, supplying a filtered transports list. Example: `TrezorConnect.updateConnectSettings({ transports: current.filter(t => t.name !== 'WebUsbTransport') })` (entries stay fully constructed `Transport` instances; `.name` is the instance discriminator). The new flow is live — no app reload is required. As part of this cleanup, the now-unused `TRANSPORT.DISABLE_WEBUSB` constant has been removed from `@trezor/transport-common` and the matching `TransportDisableWebUSB` event type from `@trezor/connect-common`.
- **`@trezor/connect` and every package in its dependency closure now ship ESM only.** Several transitive dependencies (`@noble/curves`, `@noble/hashes`, `@scure/base`, `@scure/bip39`, `@solana/kit`, `@solana-program/*`, `viem`, `node-fetch@3+`) are already ESM-only, so a CJS consumer of `@trezor/connect` cannot statically import them in any case. To keep the build pipeline consistent, the entire connect ecosystem follows suit: `@trezor/connect`, `@trezor/connect-web`, `@trezor/connect-webextension`, `@trezor/connect-mobile`, `@trezor/connect-common`, `@trezor/connect-data`, `@trezor/connect-plugin-ethereum`, `@trezor/connect-plugin-stellar`, `@trezor/blockchain-link`, `@trezor/blockchain-link-utils`, `@trezor/blockchain-link-types`, `@trezor/utxo-lib`, `@trezor/device-authenticity`, `@trezor/address-validator`, `@trezor/utils`, `@trezor/transport`, `@trezor/protobuf`, `@trezor/protocol`, `@trezor/schema-utils`, `@trezor/crypto-utils`, `@trezor/device-utils`, `@trezor/env-utils`, `@trezor/type-utils`, `@trezor/websocket-client`. Migration:
    - ESM consumer: replace `const TrezorConnect = require('@trezor/connect').default` with `import TrezorConnect from '@trezor/connect'`. Set `"type": "module"` in your `package.json` or use the `.mjs` extension.
    - CJS consumer that cannot migrate: use a dynamic import — `const TrezorConnect = (await import('@trezor/connect')).default;` — or stay on v9.
- All `*GetPublicKey` methods now return a `displayablePublicKey: string` field — the canonical user-facing representation per coin (`xpubSegwit ?? xpub` for Bitcoin, i.e. ypub/zpub for SegWit and `tr(...)` descriptor for Taproot; xpub for Ethereum/Cardano; base58 for Solana; base58check `edpk…` for Tezos). Generic consumers can display any public-key response without per-coin branching. The shared `PublicKey` base stays minimal (only `displayablePublicKey` is added); per-coin extras remain on per-coin response types.
- `cardanoGetPublicKey` now exposes the Cardano extended public key via the explicit `xpub: string` field.
- The API surface is now split into two tiers created by dedicated factories: `TrezorConnectPublicAPI` (exposed by the thin packages `@trezor/connect-web`, `@trezor/connect-webextension`, `@trezor/connect-mobile`) and `TrezorConnectPrivilegedAPI` (exposed by `@trezor/connect`, used by Trezor Suite). Consequences for consumers of the thin packages in version 10:
    - Device-management methods (`applyFlags`, `applySettings`, `authenticateDevice`, `backupDevice`, `bleUnpair`, `changeLanguage`, `changePin`, `changeWipeCode`, `getFirmwareHash`, `getNonce`, `getSettings`, `loadDevice`, `pingDevice`, `recoveryDevice`, `resetDevice`, `setBrightness`, `setBusy`, `telemetryGet`, `thpGetCredentials`, `thpRemoveCredentials`, `wipeDevice`) are no longer part of the public API. Device management is the domain of Trezor Suite, not of 3rd-party integrations.
    - The event API (`on`, `off`, `removeAllListeners`) and `uiResponse` / `updateConnectSettings` are no longer exposed. Events were already non-functional in version 10 thin packages (the host Core does not forward them), and `uiResponse` / `updateConnectSettings` returned or threw a `Method_InvalidPackage` error; all these members are now removed entirely, so calling them throws `TypeError: ... is not a function`.
    - Exposed `TrezorConnect` objects are now class instances with callable methods attached by the factories, so enumerating or monkeypatching methods via `Object.keys(TrezorConnect)` is no longer possible.
- The exported `TrezorConnect` type has been replaced by the two tier types `TrezorConnectPublicAPI` and `TrezorConnectPrivilegedAPI`. The name `TrezorConnectCore` now denotes the minimal `init`/`call`/`cancel`/`dispose` interface implemented by every Connect implementation; the group of members it used to denote (`on`/`off`/`removeAllListeners`/`uiResponse`/`updateConnectSettings`) is now called `TrezorConnectInternal`.
- The API schemas (`TrezorConnectCallable`, `TrezorConnectBitcoin`, `TrezorConnectManagement`, …) are no longer exported as runtime values from the package roots; the corresponding names remain available as types.
- The `factory` function and its `ConnectFactoryDependencies` / `InitType` types have been replaced by `factoryPublic` / `factoryPrivileged`.
- The `WEBEXTENSION.CHANNEL_HANDSHAKE_CONFIRM` constant and the corresponding handshake event of the `@trezor/connect-webextension` proxy have been removed; readiness is handled by the message channel handshake itself.

Breaking changes:

- `cardanoGetPublicKey`: the `publicKey` field is now the raw 32-byte public key in hex (consistent with other coins). The Cardano extended public key previously returned in `publicKey` is now exposed via the new explicit `xpub` field. Update consumers to read `xpub` (or `displayablePublicKey`) for the extended key.
- `ConnectSettings.transports` no longer accepts string identifiers (`'BridgeTransport'`, `'WebUsbTransport'`, `'NodeUsbTransport'`, `'UdpTransport'`) or transport classes. Entries must be fully constructed `Transport` instances (pure dependency injection) — the caller owns construction params (`id`, `logger`, `sessionsBackgroundUrl`, …) and `@trezor/connect` never instantiates transports itself. The implicit `BridgeTransport` fallback inside `TransportList` has been removed; per-environment defaults are now constructed at connect's own entry point (`[BridgeTransport, WebUsbTransport]` on web, `[BridgeTransport]` on node) when callers pass no transports. This lets non-Node bundlers stop pulling Node-only transports (`usb`/`dgram`). Migration:
    - **Node** consumers: `init({ transports: ['BridgeTransport'] })` → `import { BridgeTransport } from '@trezor/transport-common'; init({ transports: [new BridgeTransport({ id: 'my-app' })] })`.
    - **Web / React Native** consumers: `BridgeTransport` lives in the environment-agnostic `@trezor/transport-common` package (it talks to the Bridge over HTTP and never imports Node-only modules), so it is safe for any bundler: `import { BridgeTransport } from '@trezor/transport-common'; init({ transports: [new BridgeTransport({ id: 'my-app' })] })`. The `@trezor/transport` barrel is Node-only — it re-exports `NodeUsbTransport`/`UdpTransport`, which statically import `usb`/`dgram` and break non-Node bundlers, so do not import from it in non-Node bundles. For WebUSB use `import { WebUsbTransport } from '@trezor/transport-web'` (separate, browser-only package).
    - Same change applies to `updateConnectSettings({ transports })`.

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
