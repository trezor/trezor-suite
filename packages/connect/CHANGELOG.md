> **Upgrading from Connect 9?**
>
> - [Migration guide: Connect 9 → 10](https://connect.trezor.io/10.0.0/guides/migrating-to-connect-10) — what you need to change in your code, as a checklist.
> - [New Connect flow in Trezor Suite](https://connect.trezor.io/10.0.0/guides/new-connect-flow-in-trezor-suite) — how the Suite-hosted flow works and why.

|             Package              | Stable | Canary |
| :------------------------------: | :----: | :----: |
|       npm @trezor/connect        | 10.0.0 |   -    |
|     npm @trezor/connect-web      | 10.0.0 |   -    |
| npm @trezor/connect-webextension | 10.0.0 |   -    |
|    npm @trezor/connect-mobile    | 10.0.0 |   -    |

|     Deployment     | Stable | Canary |
| :----------------: | :----: | :----: |
| connect.trezor.io/ | 10.0.0 |   -    |

Use the persistent link [connect.trezor.io/10](https://connect.trezor.io/10/) to access the latest stable version of Connect Explorer.

# 10.0.0

This core ships in `@trezor/connect` 10.0.0 for Node, in Trezor Suite 26.9.2 for web and desktop, and in Trezor Suite Lite 26.8.1 for mobile.

Connect 10 moves the Connect core out of the self-hosted iframe + popup and into **Trezor Suite**, which now hosts the core and renders every approval, PIN, passphrase and confirmation screen. Your app stays a thin client calling the same `TrezorConnect` methods — nothing to install, and it works whether or not Suite desktop is running. Alongside the move, the SDK gains a privacy-friendly account picker (`selectAccount`), granular per-coin permissions, and much smaller ESM-only client packages.

## Highlights

### 1. New Connect flow, powered by Trezor Suite

The legacy web popup/iframe integration has been **removed** and replaced by a flow that runs inside Trezor Suite. Connect is now a thin client that routes each call to Suite; Suite owns the core and the entire user-facing experience. It works on both desktop and web:

- **Desktop** — when Trezor Suite (desktop) is running, Connect talks to it automatically over a local (loopback) WebSocket connection — no popup window, no iframe. Suite identifies the calling application (name, origin, icon) in a single permission-approval prompt, then handles the request against the currently active, already-unlocked device.
- **Web** — when Suite desktop is not running, Connect opens Suite Web as the approval surface (production: `https://suite.trezor.io/web/connect-popup`), giving the same flow with nothing to install. This is a first-class path, not a degraded mode; in the default `'auto'` mode Connect prefers desktop and switches back to it automatically as soon as it becomes available.
- **Mobile** — `@trezor/connect-mobile` routes calls to the Trezor Suite mobile app via a deep link.

We strongly recommend keeping the default **`coreMode: 'auto'`**: users who have Trezor Suite desktop installed get the fastest, most convenient experience (a direct local connection), while everyone else falls back to Suite Web seamlessly. You can pin `coreMode` to `'suite-desktop'` or `'suite-web'` if you have a specific reason to.

The web flow relies on a bootstrap iframe + popup to exchange messages with Suite Web, so integrator pages must ship the right headers for that channel to work: a Content-Security-Policy that permits embedding the Suite Web origin (`frame-src`/`child-src` for `https://suite.trezor.io`), and a `Cross-Origin-Opener-Policy` that does not sever the popup's `window.opener` (avoid `same-origin` on the hosting page — use `same-origin-allow-popups` or `unsafe-none`). Missing or over-strict headers surface as a handshake timeout when the popup opens.

Because the active device is chosen and unlocked **in Suite**, users no longer pick a device or re-enter a passphrase per request as they did in the old popup — passphrase handling is centralized in Suite's device management (see the [passphrases & hidden wallets guide](https://trezor.io/guides/backups-recovery/advanced-wallets/passphrases-and-hidden-wallets) and the [New Connect flow in Trezor Suite guide](https://connect.trezor.io/10.0.0/guides/new-connect-flow-in-trezor-suite)).

**Required manifest change:** `manifest.appName` is now **required**, and an optional `manifest.appIcon` (URL, sized for a 64px circle) is shown in Suite's permission prompt.

```javascript
TrezorConnect.init({
    manifest: {
        email: 'developer@xyz.com',
        appName: 'Your Application',
        appUrl: 'https://your.application.com',
        appIcon: 'https://your.application.com/icon-64.png',
    },
});
```

### 2. `selectAccount` — private, friendlier account selection

New method for asking the user to choose one or more accounts, replacing the old "call `getAccountInfo` with no path to trigger on-device discovery" pattern. The picker, derivation and on-device verification run entirely inside Suite.

- **More private:** for UTXO coins you can request only what you need. `addressSelection: 'firstFresh' | 'manual'` exports a single **address** (with an optional SLIP-0019 `mac` to later re-prove device ownership) and never reveals the account xpub — requiring only the narrow `read_address` permission. The full-account/watch-only flow (`addressSelection: 'fullAccount'`, the default) shares the xpub and requires `read_xpub`. Account-based networks (EVM, Solana, …) always return an individual address.
- **Better UX:** `selectionType` supports `'single'` (default), `'multi'`, or bounded multi-select (`{ minCount, maxCount }`); `accountType` filters/tabs the allowed derivation types (including custom `bip43Path` templates); `requireOnDeviceVerification` (default `true`) controls device confirmation.
- Always returns an array of `{ symbol, path, address? | xpub?, accountType?, mac? }`, even for a single selection.

### 3. Granular, per-coin permissions

Permissions are no longer coarse read/write grants. Each method requires narrow scopes (such as `read_address`, `read_xpub`, `sign`, `sign_message`), scoped to a specific coin where relevant, and Suite groups them by coin in the approval prompt. Scopes are intentionally non-overlapping — e.g. granting `read_address` does **not** also grant `read_xpub` — so an app only ever gets access to what it actually uses.

### 4. Much lighter client packages

Because the Connect core now lives in Trezor Suite, the packages that third-party apps install (`@trezor/connect-web`, `-webextension`, `-mobile`) are thin clients that just route calls to Suite. They no longer bundle the core's heavy dependencies (transports, crypto, coin logic), so installs and bundles are dramatically smaller. As part of this, coin-family code has been reorganized into per-network packages (the former `@trezor/coins-*` are renamed to `@trezor/network-*`) that load their heavier dependencies on demand.

## New & improved

- **Tron** support (`tronGetAddress`, `tronSignTransaction`), backed by the new `@trezor/network-tron` package.
- **`sendTransaction`** — new Bitcoin method that composes, signs and (optionally, `push`) broadcasts a transaction in one call. This is the replacement for `composeTransaction`'s old signing overload (see Breaking). (919967d6a43)
- **`composePsbt`** — new device-less method that composes a Bitcoin transaction from PSBT data plus account addresses/UTXOs, returning a precomposed result with `version` and `locktime` (no permissions required). (019eada6052)
- **`solanaSignMessage`** — new method to sign Solana off-chain messages (OCMS v1): plain text plus optional signer public keys, with the device serializing the envelope. (1611924b04b)
- **EIP-7702 signing.** `ethereumSignTransaction` now signs EIP-7702 set-code (type-4) transactions — pass `authorizationList` on an EIP-1559 transaction, and the parsed `authorizationList` is returned on the result. (6aeeda9b667)
- **Stellar Soroban.** `stellarSignTransaction` now supports the `InvokeHostFunction` operation (auth entries, `SorobanTransactionData` extension, full sint64 nonce precision), gated on firmware 2.12.4. (ea9b52e4402)
- **Node entry point.** `@trezor/connect` now ships a Node build (on top of `@trezor/connect-core`) that injects Bridge and NodeUSB transports by default, so a Node consumer can install only `@trezor/connect` and talk to a device over bridge or USB. Browser (`[bridge, WebUSB]`) and react-native (`[bridge]`) defaults are unchanged. (ce5690f82a7)
- **`FIRMWARE_TYPE_CHANGED`** — new UI event (payload `{ device }`) emitted during a firmware update when the installed firmware type changes. (c2e11a9572b)
- `signMessage` accepts an optional `scriptType` param that overrides the script type inferred from the derivation path (e.g. for custom purpose-45 paths). (390fdd4c819)
- `solanaSignTransaction` accepts a `chunkify` flag that renders addresses on the device in 4-character chunks, matching `solanaGetAddress` and other coins' sign flows (requires firmware with chunked-address support in the Solana `SignTx` flow).
- `getAccountInfo` and `discoverAccounts` now accept index-less **root** derivation paths (min path length 2) for single-account coin types, e.g. the Solana root path. (31fe1d9f725)
- `getAccountInfo` and `blockchainEstimateFee` accept a new optional `privatePending` param (in-flight nonces/txids) for EVM blockbook discovery. (754da40740d)
- `ethereumSignTypedData` now computes the required hashes internally for T1B1 firmware, so callers no longer need `@trezor/connect-plugin-ethereum` to pre-compute them — passing only `data` works on all models (caller-provided hashes still take precedence).
- The `*GetPublicKey` methods (`getPublicKey`, `ethereumGetPublicKey`, `cardanoGetPublicKey`, …) now share a **unified response shape** across coins, including a canonical `displayablePublicKey` string that any consumer can render without per-coin branching. This unification is also why the dedicated `getAccountDescriptor` method could be removed (see Breaking changes).
- `@trezor/connect-common` now exports `GRANTABLE_PERMISSIONS`, the canonical allowlist of upfront-grantable permission scopes for building `requestedPermissions` UIs. (5a8804c06f9)
- New `test-unsigned-nightly` value on the public `FirmwareChannel` type (a nightly/dev release channel). (fe1eb6ac0ed)

## Behavior & fixes

- **Named EVM inputs resolve to hex.** `getAccountInfo` now returns the backend-resolved hex address in `descriptor` for named EVM inputs (e.g. `.eth`), instead of echoing the name back. (de776b8cc76)
- **Pending BTC tx size.** The optimistic pending Bitcoin transaction now reports `size` in bytes (`byteLength`) instead of weight units (~4×), matching blockbook's byte-valued `size`. (2ec843049c0)
- **EVM slip44.** `getCoinInfo` now returns `slip44: 60` for every EVM network except ETC (61), rather than per-chain registry values — e.g. RHC and HYPE change from 4663/999 to 60. (8c4cbf2bf44)
- **`selectAccount` unsupported coins.** A Connect-valid but Suite-unmodeled coin (dash, dgb, xtz, testnets, …) is now rejected up front with the distinct `Method_UnsupportedCoinForHost` error instead of a generic modal. (2877a16d71d)
- **Manifest name sanitizing.** `manifest.appName` (and THP `hostName`) are sanitized — control chars stripped, whitespace runs collapsed, trimmed; a name that becomes empty is rejected. `appName` is also now strictly required at manifest parse. (c6a11d3a93b, fe8e15c7fe7)
- **Solana.** `solanaSignTransaction` no longer fails precompose for transactions using address lookup tables (467c4002c3f), and rejects unsupported v1 transactions upfront with `Method_InvalidParameter` (d24fa8a5d8c). `solanaComposeTransaction` now returns token metadata (`newAccountProgramName`, `tokenAccountInfo`) in `additionalInfo` for pre-serialized token transfers, fixing Solana token trades. (bb7502fedc8)
- **Backend reconnect back-off.** A dropped blockchain backend no longer triggers a tight reconnect loop / Solana reconnect storm — reconnect delay is clamped to 1–20s, the attempt counter resets only after a connection holds for 30s, and back-off attempts reject with `Backend_Disconnected` rather than forcing an immediate re-sync (explicit reconnects still bypass the wait). (f02219132e6, d1fc98016c3)
- **TRON.** Default fee info now exposes real `minFee=1` / `maxFee=15,000,000,000` SUN instead of the `-1`/unknown placeholders (f124fe96ceb), and TRX/tTRX block notifications are throttled together with EVM at ~12s per block event (2524bc4d2ca).
- `ethereumSignTypedData` no longer requires the `eip712-domain-only` firmware capability for `EIP712Domain`-only payloads. (d4ead6f1780)
- **BTC custom-fee fallback** now composes a single transaction at the coin's `minFee` instead of scanning fees down from the top level, changing which custom fee is offered when no standard level is affordable. (7988531569c)
- **Firmware rollout bucketing** no longer permanently excludes the ~1% of devices that hash into the top bucket, even at 100% rollout. (3debf109035)
- On THP devices, the PIN matrix is now requested **before** the passphrase entry. (b2c3d73ce4c)

## Breaking changes

The [migration guide](https://connect.trezor.io/10.0.0/guides/migrating-to-connect-10) turns the changes below into a step-by-step checklist with before/after code.

### Integration & packaging

- **Legacy iframe + popup integration removed.** `core-in-popup` and iframe-with-popup modes no longer exist; use the Suite-based flow above. `connect-iframe` has been removed.
- **`manifest.appName` is now required** (see Highlights).
- **ESM-only.** `@trezor/connect` and its dependency closure now ship ESM only. ESM consumers just `import TrezorConnect from '@trezor/connect'`; a CJS consumer that cannot migrate can use a dynamic `import()` or stay on v9.
- **Public vs privileged API split.** The client packages now expose a public API (`TrezorConnectPublicAPI`) while `@trezor/connect` exposes the full privileged one (`TrezorConnectPrivilegedAPI`) used by Suite. The public tier drops everything that is Suite's responsibility — device-management methods (`applyFlags`, `applySettings`, `authenticateDevice`, `backupDevice`, `bleUnpair`, `changeLanguage`, `changePin`, `changeWipeCode`, `getFirmwareHash`, `getNonce`, `getSettings`, `loadDevice`, `pingDevice`, `recoveryDevice`, `resetDevice`, `setBrightness`, `setBusy`, `telemetryGet`, `thpGetCredentials`, `thpRemoveCredentials`, `wipeDevice`) are no longer callable from third-party integrations. Public `TrezorConnect` objects are now class instances, so `Object.keys(...)` enumeration and monkeypatching no longer work.
- **Thin packages lost their event/settings API.** `on`/`off`/`removeAllListeners`, `uiResponse` and `updateConnectSettings` are removed from the public tier (they were already non-functional in v10, since the host Core does not forward them); calling them now throws `TypeError`.
- **Type/factory renames.** The exported `TrezorConnect` type is replaced by `TrezorConnectPublicAPI` / `TrezorConnectPrivilegedAPI`, and the `factory` function by `factoryPublic` / `factoryPrivileged`. The API-schema values (`TrezorConnectCallable`, `TrezorConnectBitcoin`, …) are no longer exported as runtime values — the names remain as types only.

### Methods & parameters

- **`coin` accepts the coin shortcut only** (the `CoinSymbol` set — e.g. `btc`, `bch`, `ada`), narrowed from `string`. Network **names** and **labels** (e.g. `'Bitcoin'`, `'Bitcoin Cash'`) are no longer accepted and now fail both at compile time and at runtime. The shortcut itself is still matched case-insensitively at runtime, so `coin: 'BTC'` works — but the `CoinSymbol` type lists the canonical lowercase forms, so TypeScript users should pass lowercase to type-check. Resolution is uniform across all coin families. Migrate names/labels to the shortcut: `'Bitcoin' → 'btc'`, `'Bitcoin Cash' → 'bch'`, `'cardano' → 'ada'`, etc. Path-taking methods (`getAddress`, `getPublicKey`, …) derive the network from `path` when given a former name/label; methods without a path fallback (`getAccountInfo`, `selectAccount`, `verifyMessage`, `composeTransaction`, `signTransaction`, `signMessage`, `getOwnershipId`, `getOwnershipProof`, the `blockchain*` family) throw `Method_UnknownCoin`. Full list: [supported coins](https://connect.trezor.io/10.0.0/details/coins).
- **`getPublicKey` is restricted to bitcoin-like coins.** In v9, a non-bitcoin `coin` (e.g. `'eth'`) silently fell back to Bitcoin and returned a btc xpub. Now the network must resolve to a bitcoin-like coin — from `coin`, or failing that from the derivation `path` — otherwise the call throws `Method_UnknownCoin`. Use the per-coin methods (`ethereumGetPublicKey`, `cardanoGetPublicKey`, …) for other networks.
- **`getAccountDescriptor` removed.** The per-coin `*GetPublicKey` methods now return the same fields. Field mapping: `payload.descriptor` → Bitcoin `result.descriptor` (non-Bitcoin coins: use `result.displayablePublicKey`); `payload.path` → `result.serializedPath` on every `*GetPublicKey`; generic consumers should read `result.displayablePublicKey`.
- **`getAccountInfo` no longer performs on-device discovery.** Calling it without `path` or `descriptor` now throws `Method_InvalidParameter` (`path or descriptor is required`) instead of opening a device-driven selection popup. Provide `path` (derive on device, then query backend) or `descriptor` (backend-only). For the old discovery behavior, use `discoverAccounts` — or `selectAccount` for user-facing selection.
- **`composeTransaction` is precompose-only.** Its signing/broadcast overload (`ComposeParams` → `SignedTransaction`, including `push`) is removed — migrate signing+push flows to the new `sendTransaction`. (919967d6a43)
- **`ethereumGetPublicKey.displayablePublicKey`** is now the hex-encoded compressed public key (byte-identical to `publicKey`, matching what firmware shows on screen) instead of the xpub. (a508e4ab6e4)
- **`cardanoGetPublicKey`:** `publicKey` is now the raw 32-byte key in hex (consistent with other coins); the Cardano extended public key moved to the new explicit `xpub` field (also available via `displayablePublicKey`).
- **`blockchainEvmRpcGetChainId`** (formerly `blockchainValidateEvmRpcUrl`) now takes only `{ url }` and returns `{ chainId }`, instead of validating a supplied chainId and returning `{ valid, actualChainId }`. (39fa982888d)
- **`useCardanoDerivation` removed.** Cardano session derivation is now driven by an app-level `enabledNetworks` declaration passed to `TrezorConnect.init({ enabledNetworks: [{ coin: 'ada' }] })` (or `updateConnectSettings` for in-process Core hosts). Note: `enabledNetworks` is honored only by the in-process `@trezor/connect`; on the thin packages, Cardano availability follows the host Suite wallet's enabled coins.
- **`KnownDevice.availableTranslations`** now maps language codes to `TranslationMetadata` objects instead of plain strings. (26f0cd334c5)

### UI events & fee selection

These mostly affect **custom-UI and host (Suite-style) integrations**.

- **`UI_EVENT` split.** The public `UI_REQUEST` constant map is split into `UI_EVENTS` (fire-and-forget notifications) and `UI_REQUESTS` (messages needing a `UI_RESPONSE`), a new `UI_REQUEST`/`UI_REQUESTS` event channel is added, and several members are renamed (e.g. `TRANSPORT`→`TRANSPORT_MISSING`, `INVALID_PIN`→`PIN_INVALID`). The event payloads were also reshaped: `requestId` was removed from `UI_EVENT` payloads (`callId` remains) and is now emitted on standalone `UI_REQUEST` payloads. Migrate `UI_REQUEST.*` references to `UI_EVENTS.*` / `UI_REQUESTS.*`. (8d5768be292, b372b090361, f26a6147e01)
- **`SELECT_FEE` event** payload now carries `feeLevels` as `FeeLevel[]` (only composable/valid levels), and the `SelectFeeLevel` type is removed from `@trezor/connect-common`. (a300e1be087)
- **`RECEIVE_FEE` response** payload is restructured: use `{ type: 'select-fee', value }` and `{ type: 'select-fee-custom', value }` (replacing `'compose-custom'` / `'send'`). (eedb2fdde5f)
- **`UPDATE_CUSTOM_FEE` UI event removed.** The `ui-update_custom_fee` member of the `UI_REQUEST` map and its `UpdateCustomFee` type are removed from `@trezor/connect-common`; custom-UI code that listened for it should drop the handler. (4f5b240fcb0)

### Transports

These mostly affect apps that run their own Connect core (`@trezor/connect`); most integrations use the client packages and can skip this.

- **Transports must be passed as instances.** `transports` no longer accepts string identifiers (`'BridgeTransport'`, …) or classes — pass fully constructed `Transport` instances, e.g. `import { BridgeTransport } from '@trezor/transport-common'; init({ transports: [new BridgeTransport({ id: 'my-app' })] })`. For WebUSB use `@trezor/transport-web`; avoid the Node-only `@trezor/transport` barrel in web/React Native bundles.
- **`disableWebUSB()` removed** — use `updateConnectSettings({ transports })` with a filtered list instead.
- **Legacy `trezord-go` Bridge (port `21325`) is no longer supported** and `TransportInfo.outdated` is removed; detecting an outdated Bridge is now the consumer app's job.

## Removed & deprecated

- **Removed coin support.** Coins that no current device supports have been dropped from the coin definitions. [Supported coins](https://connect.trezor.io/10.0.0/details/coins) is the current list — if your integration names a coin that is not on it, remove that support.
- **`@trezor/connect-plugin-ethereum` deprecated.** Its logic is inlined into `@trezor/connect`. Drop the direct dependency and remove manual `transformTypedData` calls. The 10.x plugin is a stub that throws a deprecation error pointing at the migration.

## Previous versions

Changelogs for Connect 9 and earlier are available at [connect.trezor.io/9](https://connect.trezor.io/9/).
