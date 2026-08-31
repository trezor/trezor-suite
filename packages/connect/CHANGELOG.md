> **Upgrading from Connect 9?**
>
> - [Migration guide: Connect 9 → 10](https://connect.trezor.io/10.0.0-beta.1/guides/migrating-to-connect-10) — what you need to change in your code, as a checklist.
> - [New Connect flow in Trezor Suite](https://connect.trezor.io/10.0.0-beta.1/guides/new-connect-flow-in-trezor-suite) — how the Suite-hosted flow works and why.

|             Package              | Stable |    Canary     |
| :------------------------------: | :----: | :-----------: |
|       npm @trezor/connect        |   -    | 10.0.0-beta.1 |
|     npm @trezor/connect-web      |   -    | 10.0.0-beta.1 |
| npm @trezor/connect-webextension |   -    | 10.0.0-beta.1 |
|    npm @trezor/connect-mobile    |   -    | 10.0.0-beta.1 |

|     Deployment     | Stable |    Canary     |
| :----------------: | :----: | :-----------: |
| connect.trezor.io/ |   -    | 10.0.0-beta.1 |

Connect 10 has no stable release yet — use [connect.trezor.io/10.0.0-beta.1](https://connect.trezor.io/10.0.0-beta.1/) to access the beta version of Connect Explorer. Once Connect 10 is released, the persistent link [connect.trezor.io/10](https://connect.trezor.io/10/) will point to the latest stable version.

# 10.0.0-beta.1

Connect 10 moves the Connect core out of the self-hosted iframe + popup and into **Trezor Suite**, which now hosts the core and renders every approval, PIN, passphrase and confirmation screen. Your app stays a thin client calling the same `TrezorConnect` methods — nothing to install, and it works whether or not Suite desktop is running. Alongside the move, the SDK gains a privacy-friendly account picker (`selectAccount`), granular per-coin permissions, and much smaller ESM-only client packages.

## Highlights

### 1. New Connect flow, powered by Trezor Suite

The legacy web popup/iframe integration has been **removed** and replaced by a flow that runs inside Trezor Suite. Connect is now a thin client that routes each call to Suite; Suite owns the core and the entire user-facing experience. It works on both desktop and web:

- **Desktop** — when Trezor Suite (desktop) is running, Connect talks to it automatically over a local (loopback) WebSocket connection — no popup window, no iframe. Suite identifies the calling application (name, origin, icon) in a single permission-approval prompt, then handles the request against the currently active, already-unlocked device.
- **Web** — when Suite desktop is not running, Connect opens Suite Web as the approval surface (production: `https://suite.trezor.io/web/connect-popup`), giving the same flow with nothing to install. This is a first-class path, not a degraded mode; in the default `'auto'` mode Connect prefers desktop and switches back to it automatically as soon as it becomes available.
- **Mobile** — `@trezor/connect-mobile` routes calls to the Trezor Suite mobile app via a deep link.

We strongly recommend keeping the default **`coreMode: 'auto'`**: users who have Trezor Suite desktop installed get the fastest, most convenient experience (a direct local connection), while everyone else falls back to Suite Web seamlessly. You can pin `coreMode` to `'suite-desktop'` or `'suite-web'` if you have a specific reason to.

The web flow relies on a bootstrap iframe + popup to exchange messages with Suite Web, so integrator pages must ship the right headers for that channel to work: a Content-Security-Policy that permits embedding the Suite Web origin (`frame-src`/`child-src` for `https://suite.trezor.io`), and a `Cross-Origin-Opener-Policy` that does not sever the popup's `window.opener` (avoid `same-origin` on the hosting page — use `same-origin-allow-popups` or `unsafe-none`). Missing or over-strict headers surface as a handshake timeout when the popup opens.

Because the active device is chosen and unlocked **in Suite**, users no longer pick a device or re-enter a passphrase per request as they did in the old popup — passphrase handling is centralized in Suite's device management (see the [passphrases & hidden wallets guide](https://trezor.io/guides/backups-recovery/advanced-wallets/passphrases-and-hidden-wallets) and the [New Connect flow in Trezor Suite guide](https://connect.trezor.io/10.0.0-beta.1/guides/new-connect-flow-in-trezor-suite)).

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

### New coins & method improvements

- **Tron** support (`tronGetAddress`, `tronSignTransaction`), backed by the new `@trezor/network-tron` package.
- `solanaSignTransaction` accepts a `chunkify` flag that renders addresses on the device in 4-character chunks, matching `solanaGetAddress` and other coins' sign flows (requires firmware with chunked-address support in the Solana `SignTx` flow).
- `ethereumSignTypedData` now computes the required hashes internally for T1B1 firmware, so callers no longer need `@trezor/connect-plugin-ethereum` to pre-compute them — passing only `data` works on all models (caller-provided hashes still take precedence).
- The `*GetPublicKey` methods (`getPublicKey`, `ethereumGetPublicKey`, `cardanoGetPublicKey`, …) now share a **unified response shape** across coins, including a canonical `displayablePublicKey` string that any consumer can render without per-coin branching. This unification is also why the dedicated `getAccountDescriptor` method could be removed (see Breaking changes).

## Breaking changes

The [migration guide](https://connect.trezor.io/10.0.0-beta.1/guides/migrating-to-connect-10) turns the changes below into a step-by-step checklist with before/after code.

### Integration & packaging

- **Legacy iframe + popup integration removed.** `core-in-popup` and iframe-with-popup modes no longer exist; use the Suite-based flow above. `connect-iframe` has been removed.
- **`manifest.appName` is now required** (see Highlights).
- **ESM-only.** `@trezor/connect` and its dependency closure now ship ESM only. ESM consumers just `import TrezorConnect from '@trezor/connect'`; a CJS consumer that cannot migrate can use a dynamic `import()` or stay on v9.
- **Public vs privileged API split.** The client packages now expose a public API (`TrezorConnectPublicAPI`) while `@trezor/connect` exposes the full privileged one (`TrezorConnectPrivilegedAPI`) used by Suite. The public tier drops everything that is Suite's responsibility — device-management methods (`applyFlags`, `applySettings`, `authenticateDevice`, `backupDevice`, `bleUnpair`, `changeLanguage`, `changePin`, `changeWipeCode`, `getFirmwareHash`, `getNonce`, `getSettings`, `loadDevice`, `pingDevice`, `recoveryDevice`, `resetDevice`, `setBrightness`, `setBusy`, `telemetryGet`, `thpGetCredentials`, `thpRemoveCredentials`, `wipeDevice`) are no longer callable from third-party integrations. Public `TrezorConnect` objects are now class instances, so `Object.keys(...)` enumeration and monkeypatching no longer work.
- **Thin packages lost their event/settings API.** `on`/`off`/`removeAllListeners`, `uiResponse` and `updateConnectSettings` are removed from the public tier (they were already non-functional in v10, since the host Core does not forward them); calling them now throws `TypeError`.
- **Type/factory renames.** The exported `TrezorConnect` type is replaced by `TrezorConnectPublicAPI` / `TrezorConnectPrivilegedAPI`, and the `factory` function by `factoryPublic` / `factoryPrivileged`. The API-schema values (`TrezorConnectCallable`, `TrezorConnectBitcoin`, …) are no longer exported as runtime values — the names remain as types only.

### UI events

These affect hosts that run their own Core (`@trezor/connect`) and listen for UI messages; thin-client integrations no longer receive UI events directly (see the event/settings API removal above).

- **`UI_REQUEST` split into `UI_EVENTS` and `UI_REQUESTS`.** The single `UI_REQUEST` constant object that held every UI message type has been split into two groups on distinct channels:
    - `UI_EVENTS` — fire-and-forget notifications emitted on the `UI_EVENT` channel; no `uiResponse` is expected. Wire values are namespaced as `ui-event_*`.
    - `UI_REQUESTS` — prompts that require a `TrezorConnect.uiResponse()` reply, emitted on the new `UI_REQUEST` channel. Wire values keep the `ui-request_*` form.

    `UI_REQUEST` is now the request **channel** string (`'UI_REQUEST'`), no longer the map of message types — read message types from `UI_EVENTS` / `UI_REQUESTS` instead. A host that subscribes by channel must listen on **both** `UI_EVENT` and `UI_REQUEST`.

- **Message-type renames:**

    | Old                                       | New                                   |
    | ----------------------------------------- | ------------------------------------- |
    | `UI_REQUEST.SELECT_ACCOUNT`               | `UI_REQUESTS.REQUEST_ACCOUNT`         |
    | `UI_REQUEST.SELECT_FEE`                   | `UI_REQUESTS.REQUEST_FEE`             |
    | `UI_REQUEST.REQUEST_THP_PAIRING`          | `UI_REQUESTS.REQUEST_THP_PAIRING_TAG` |
    | `UI_REQUEST.REQUEST_BUTTON`               | `UI_EVENTS.BUTTON_REQUEST`            |
    | `UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE` | `UI_EVENTS.PASSPHRASE_ON_DEVICE`      |
    | `UI_REQUEST.TRANSPORT`                    | `UI_EVENTS.NO_TRANSPORT`              |
    | `UI_REQUEST.INITIALIZE`                   | `UI_EVENTS.DEVICE_NOT_INITIALIZED`    |
    | `UI_REQUEST.BOOTLOADER`                   | `UI_EVENTS.DEVICE_IN_BOOTLOADER`      |
    | `UI_REQUEST.NOT_IN_BOOTLOADER`            | `UI_EVENTS.DEVICE_NOT_IN_BOOTLOADER`  |
    | `UI_REQUEST.SEEDLESS`                     | `UI_EVENTS.DEVICE_SEEDLESS`           |

    The remaining types keep their key names but move into the matching group (e.g. `UI_REQUEST.REQUEST_PIN` → `UI_REQUESTS.REQUEST_PIN`, `UI_REQUEST.DEVICE_NEEDS_BACKUP` → `UI_EVENTS.DEVICE_NEEDS_BACKUP`).

- **`UI_EVENTS` wire values changed.** Every `UI_EVENTS` string value is re-namespaced from `ui-*` to `ui-event_*` (e.g. `ui-no_transport` → `ui-event_no_transport`, `ui-device_bootloader_mode` → `ui-event_device_in_bootloader`). Reference the exported constants instead of hardcoding the strings.

- **Device-carrying events are now wrapped.** UI events that carry a device (`DEVICE_NEEDS_BACKUP`, `FIRMWARE_OUTDATED`, and the device-mode / firmware-exception types) use a `{ device }` payload object instead of a bare `Device`; read `event.payload.device`.

### Methods & parameters

- **`coin` accepts the coin shortcut only** (the `CoinSymbol` set — e.g. `btc`, `bch`, `ada`), narrowed from `string`. Network **names** and **labels** (e.g. `'Bitcoin'`, `'Bitcoin Cash'`) are no longer accepted and now fail both at compile time and at runtime. The shortcut itself is still matched case-insensitively at runtime, so `coin: 'BTC'` works — but the `CoinSymbol` type lists the canonical lowercase forms, so TypeScript users should pass lowercase to type-check. Resolution is uniform across all coin families. Migrate names/labels to the shortcut: `'Bitcoin' → 'btc'`, `'Bitcoin Cash' → 'bch'`, `'cardano' → 'ada'`, etc. Path-taking methods (`getAddress`, `getPublicKey`, …) derive the network from `path` when given a former name/label; methods without a path fallback (`getAccountInfo`, `selectAccount`, `verifyMessage`, `composeTransaction`, `signTransaction`, `signMessage`, `getOwnershipId`, `getOwnershipProof`, the `blockchain*` family) throw `Method_UnknownCoin`. Full list: [supported coins](https://connect.trezor.io/10.0.0-beta.1/details/coins).
- **`getPublicKey` is restricted to bitcoin-like coins.** In v9, a non-bitcoin `coin` (e.g. `'eth'`) silently fell back to Bitcoin and returned a btc xpub. Now the network must resolve to a bitcoin-like coin — from `coin`, or failing that from the derivation `path` — otherwise the call throws `Method_UnknownCoin`. Use the per-coin methods (`ethereumGetPublicKey`, `cardanoGetPublicKey`, …) for other networks.
- **`getAccountDescriptor` removed.** The per-coin `*GetPublicKey` methods now return the same fields. Field mapping: `payload.descriptor` → Bitcoin `result.descriptor` (non-Bitcoin coins: use `result.displayablePublicKey`); `payload.path` → `result.serializedPath` on every `*GetPublicKey`; generic consumers should read `result.displayablePublicKey`.
- **`getAccountInfo` no longer performs on-device discovery.** Calling it without `path` or `descriptor` now throws `Method_InvalidParameter` (`path or descriptor is required`) instead of opening a device-driven selection popup. Provide `path` (derive on device, then query backend) or `descriptor` (backend-only). For the old discovery behavior, use `discoverAccounts` — or `selectAccount` for user-facing selection.
- **`cardanoGetPublicKey`:** `publicKey` is now the raw 32-byte key in hex (consistent with other coins); the Cardano extended public key moved to the new explicit `xpub` field (also available via `displayablePublicKey`).
- **`useCardanoDerivation` removed.** Cardano session derivation is now driven by an app-level `enabledNetworks` declaration passed to `TrezorConnect.init({ enabledNetworks: [{ coin: 'ada' }] })` (or `updateConnectSettings` for in-process Core hosts). Note: `enabledNetworks` is honored only by the in-process `@trezor/connect`; on the thin packages, Cardano availability follows the host Suite wallet's enabled coins.

### Transports

These mostly affect apps that run their own Connect core (`@trezor/connect`); most integrations use the client packages and can skip this.

- **Transports must be passed as instances.** `transports` no longer accepts string identifiers (`'BridgeTransport'`, …) or classes — pass fully constructed `Transport` instances, e.g. `import { BridgeTransport } from '@trezor/transport-common'; init({ transports: [new BridgeTransport({ id: 'my-app' })] })`. For WebUSB use `@trezor/transport-web`; avoid the Node-only `@trezor/transport` barrel in web/React Native bundles.
- **`disableWebUSB()` removed** — use `updateConnectSettings({ transports })` with a filtered list instead.
- **Legacy `trezord-go` Bridge (port `21325`) is no longer supported** and `TransportInfo.outdated` is removed; detecting an outdated Bridge is now the consumer app's job.

## Removed & deprecated

- **Removed coin support.** Coins that no current device supports have been dropped from the coin definitions. [Supported coins](https://connect.trezor.io/10.0.0-beta.1/details/coins) is the current list — if your integration names a coin that is not on it, remove that support.
- **`@trezor/connect-plugin-ethereum` deprecated.** Its logic is inlined into `@trezor/connect`. Drop the direct dependency and remove manual `transformTypedData` calls. The 10.x plugin is a stub that throws a deprecation error pointing at the migration.

## Previous versions

Changelogs for Connect 9 and earlier are available at [connect.trezor.io/9](https://connect.trezor.io/9/).
