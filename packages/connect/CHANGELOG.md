> **Upgrading from Connect 9?**
>
> - [Migration guide: Connect 9 → 10](https://connect.trezor.io/10/guides/migrating-to-connect-10) — what you need to change in your code, as a checklist.
> - [New Connect flow in Trezor Suite](https://connect.trezor.io/10/guides/new-connect-flow-in-trezor-suite) — how the Suite-hosted flow works and why.

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

Connect 10 moves the Connect core out of the self-hosted iframe + popup and into **Trezor Suite**, which now hosts the core and renders every approval, PIN, passphrase and confirmation screen. Your app stays a thin client calling the same `TrezorConnect` methods — nothing to install, and it works whether or not Suite desktop is running. Alongside the move, the SDK gains a privacy-friendly account picker (`selectAccount`), granular per-coin permissions, and much smaller ESM-only client packages.

**Upgrading from v9?** The [migration guide](https://connect.trezor.io/10/guides/migrating-to-connect-10) is the checklist of what changes in your code. For the architecture behind the move, see [New Connect flow in Trezor Suite](https://connect.trezor.io/10/guides/new-connect-flow-in-trezor-suite).

## What's new

- **Suite-hosted flow.** The legacy web popup/iframe is removed; Connect routes each call to Trezor Suite, which owns the core and the whole user experience. Works on desktop (direct local WebSocket, no popup), web (`suite.trezor.io`, nothing to install), and mobile (deep link to Suite Lite). Keep the default `coreMode: 'auto'`. → [architecture guide](https://connect.trezor.io/10/guides/new-connect-flow-in-trezor-suite)
- **`selectAccount`** — a private, friendlier way to ask the user to choose one or more accounts, replacing the "call `getAccountInfo` with no path" pattern. For UTXO coins you can export just an address without ever revealing the xpub.
- **Granular, per-coin permissions.** Methods request narrow, non-overlapping scopes (`read_address`, `read_xpub`, `sign`, `sign_message`) scoped per coin, and Suite groups them by coin in the approval prompt — an app only gets what it uses.
- **Much lighter clients.** `@trezor/connect-web`, `-webextension` and `-mobile` no longer bundle the core's transports, crypto and coin logic, so installs and bundles shrink dramatically. Coin-family code is now split into on-demand `@trezor/network-*` packages (renamed from `@trezor/coins-*`).
- **Tron** support (`tronGetAddress`, `tronSignTransaction`), via `@trezor/network-tron`.
- **`ethereumSignTypedData`** computes the required T1B1 hashes internally — passing only `data` now works on all models, no `@trezor/connect-plugin-ethereum` needed.
- **`solanaSignTransaction`** accepts `chunkify` to render addresses in 4-character chunks on device.
- **Unified `*GetPublicKey` response** with a canonical `displayablePublicKey` any consumer can render without per-coin branching.

## Breaking changes

Each item links to the step in the [migration guide](https://connect.trezor.io/10/guides/migrating-to-connect-10) with the before/after detail. Tags mark who a change hits.

### Integration & packaging

- `[all]` Legacy `core-in-popup` and iframe-with-popup modes are gone; `connect-iframe` is removed. → [migration guide](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-1-required-for-every-integration)
- `[all]` `manifest.appName` is now required. → [Step 1](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-1-required-for-every-integration)
- `[all]` ESM-only. Use `import TrezorConnect from '@trezor/connect'`; CJS consumers use a dynamic `import()` or stay on v9. → [Step 1](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-1-required-for-every-integration)
- `[all]` Public vs privileged API split: client packages expose `TrezorConnectPublicAPI`, `@trezor/connect` exposes `TrezorConnectPrivilegedAPI`. Device-management methods are no longer callable from third-party integrations, and `TrezorConnect` objects are now class instances (no `Object.keys` enumeration or monkeypatching). → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)
- `[all]` `on` / `off` / `removeAllListeners`, `uiResponse` and `updateConnectSettings` are removed from the public tier and throw `TypeError`. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)
- `[all]` Renames: the `TrezorConnect` type → `TrezorConnectPublicAPI` / `TrezorConnectPrivilegedAPI`; `factory` → `factoryPublic` / `factoryPrivileged`; API-schema values (`TrezorConnectCallable`, …) remain as types only. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)

### Methods & parameters

- `[all]` `coin` accepts the coin shortcut only (e.g. `btc`, `bch`, `ada`); names and labels (`'Bitcoin'`) are rejected. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)
- `[all]` `getAccountDescriptor` removed — use the per-coin `*GetPublicKey`. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)
- `[all]` `getAccountInfo` without `path` or `descriptor` throws `Method_InvalidParameter`; use `discoverAccounts` or `selectAccount` for the old discovery behaviour. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)
- `[Cardano]` `cardanoGetPublicKey`: `publicKey` is now the raw 32-byte hex key; read the new `xpub` (or `displayablePublicKey`) for the extended key. → [Cardano](https://connect.trezor.io/10/guides/migrating-to-connect-10#cardano)
- `[Cardano]` `useCardanoDerivation` removed — declare `init({ enabledNetworks: [{ coin: 'ada' }] })` instead. → [Cardano](https://connect.trezor.io/10/guides/migrating-to-connect-10#cardano)

### Transports

- `[core hosts]` Pass `transports` as constructed `Transport` instances; string identifiers and classes are no longer accepted. Use `@trezor/transport-web` for WebUSB. → [Step 5](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-5-only-if-you-host-connect-core-trezorconnect)
- `[core hosts]` `disableWebUSB()` removed — use `updateConnectSettings({ transports })` with a filtered list. → [Step 5](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-5-only-if-you-host-connect-core-trezorconnect)
- `[core hosts]` Legacy `trezord-go` Bridge (port `21325`) is no longer supported and `TransportInfo.outdated` is removed. → [Step 5](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-5-only-if-you-host-connect-core-trezorconnect)

### Removed

- `[all]` Removed coin support: EOS, NEM.
- `[all]` `@trezor/connect-plugin-ethereum` deprecated; its logic is inlined into `@trezor/connect`. Drop the dependency and remove `transformTypedData` calls — the 10.x plugin is a stub that throws. → [Step 2](https://connect.trezor.io/10/guides/migrating-to-connect-10#step-2-only-if-you-use-these-apis)

---

Full commit history for this release: [packages/connect on GitHub](https://github.com/trezor/trezor-suite/commits/develop/packages/connect).
