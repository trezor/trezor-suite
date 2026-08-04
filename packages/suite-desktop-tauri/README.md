# @trezor/suite-desktop-tauri

A [Tauri](https://tauri.app) (v2) desktop shell for Trezor Suite — a replacement for the Electron
shell (`@trezor/suite-desktop` + `@trezor/suite-desktop-core`). It runs the **same** Suite frontend
(`@trezor/suite-desktop-ui`, desktop mode) inside the OS-native webview (WKWebView on macOS,
WebView2 on Windows, WebKitGTK on Linux) instead of Chromium/Electron.

Only the shell changes — all other packages (`packages/`, `suite-common/`, `suite/`) are untouched.

## Architecture

| Concern             | Electron shell                                                             | Tauri shell                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Native runtime      | Node.js main process                                                       | Rust (`src-tauri`)                                                                                                             |
| `window.desktopApi` | preload + `ipcMain` handlers                                               | WebView init script (`preload/tauri-preload.js`) → Rust `desktop_invoke`/`desktop_send` commands                               |
| Trezor Connect      | `@trezor/connect` in Node main, ipc-proxy'd to renderer                    | `@trezor/connect` **browser build** in the webview, talking to the in-process bridge (`127.0.0.1:21328`) — same as the web app |
| Frontend build      | `suite-build` project `desktop` (alias `@trezor/connect`→connect-electron) | `suite-build` project `tauri` (no connect alias; `SUITE_TYPE=desktop`)                                                         |
| Entry               | `suite-desktop-ui/src/index.tsx` → `MainDesktop.tsx`                       | `suite-desktop-ui/src/indexTauri.tsx` → `MainTauri.tsx`                                                                        |

`MainTauri` is `MainDesktop` without `TrezorConnect.initIpcProxy()` (there is no Node main to proxy
to) and without Electron-native Bluetooth init. Connect initialises lazily in the webview.

> **No Node.js runtime is bundled.** Both native sidecars that Electron ran in Node — the Trezor
> Bridge and the Bluetooth host — are reimplemented in Rust and compiled into the app binary. The
> distributed `.app` is ~52 MB (vs ~144 MB when a Node runtime was side-loaded for the bridge, and
> ~274 MB before the frontend/binary size fixes); its only bundled binaries are the `tor` daemon and
> the native `trezor-bluetooth` BLE server.

### WebView compatibility notes

- `import 'core-js/actual'` is required (WKWebView lacks newer JS features Electron's Chromium ships,
  e.g. `DisposableStack`).

## Develop

```bash
# 1. serve the Tauri (desktop-mode) frontend on http://localhost:8000
yarn workspace @trezor/suite-build run dev:tauri

# 2. run the native Tauri window (loads devUrl :8000, recompiles Rust on change)
cd packages/suite-desktop-tauri && npx @tauri-apps/cli@2 dev
```

Requires the Rust toolchain ≥ 1.85 (edition 2024). Device communication needs the Trezor Bridge /
trezor-user-env on `127.0.0.1:21325`.

## Status

Boots the desktop-mode Suite through a Tauri-backed `desktopApi`
(handshake → load-modules → render), connects to a device via Bridge, reaches the dashboard.

### Feature parity with the Electron shell

Every Electron `suite-desktop-core` module has been reimplemented natively in Rust
(`src/*.rs`). The desktopApi surface (`@trezor/suite-desktop-api`, 55 methods) is fully wired.

| Electron module                                 | Tauri implementation                             | Notes                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| handshake / load-modules                        | `lib.rs` `desktop_invoke`                        | userDir, binDir, httpReceiver url, `desktopUpdate`                                                                                                                                                                                                         |
| **store** (electron-store)                      | `store.rs`                                       | JSON in `<appData>/store.json`, same keys + defaults, shallow-merge                                                                                                                                                                                        |
| **auto-updater** + update-checker               | `updater.rs`                                     | real `data.trezor.io/.../latest` feed, `latest*.yml` parse, semver compare, streamed download w/ progress, **sha512 + detached OpenPGP verify** (same `app-key.asc`), install=open+exit                                                                    |
| Early Access (EAP)                              | `updater.rs`                                     | `allowPrerelease` → canary feed; persisted; event echo                                                                                                                                                                                                     |
| **Tor** + TorProcess                            | `tor.rs` + `tor_proxy.rs`                        | bundled `tor` binary (same LFS bins), bootstrap-progress events, status, external-Tor mode, settings; proxy via webview recreate + a **loopback-bypassing SOCKS forwarder** (Bridge stays direct, everything else over Tor)                                |
| **http-receiver** (oauth/trading)               | `http_receiver.rs`                               | axum on `:21335`: `/status`, `/oauth`→focus+event, `/buy-post`, `/{buy,sell,exchange}-redirect`→focus; route activation + referer allowlists; `/connect-ws` upgrade                                                                                        |
| **connect-popup + connect-ws**                  | `connect_ws.rs`                                  | tokio/axum ws bridging dApp ↔ webview connect Core                                                                                                                                                                                                         |
| **metadata** local files                        | `lib.rs`                                         | real fs in `<appData>/metadata`, ENOENT on miss                                                                                                                                                                                                            |
| **bundled bridge** (Trezor Bridge)              | `bridge.rs` + `bridge_server/`                   | **native Rust** trezord reimplementation on `:21328` (USB I/O via vendored libusb, no Node)                                                                                                                                                                |
| **window-controls**                             | `window.rs`                                      | focus/hide/restart/reload, is-visible/-fullscreen, macOS close→hide, persisted `winBounds`                                                                                                                                                                 |
| **theme** (nativeTheme)                         | `window.rs`                                      | `theme/change` persist+apply, `theme/system-change` on OS change                                                                                                                                                                                           |
| **tray**                                        | `tray.rs`                                        | shown on `showOnTray`, bridge status/toggle, launch, hide-icon, quit                                                                                                                                                                                       |
| **auto-start**                                  | `auto_start.rs`                                  | Linux XDG `.desktop` (same as Electron), macOS LaunchAgent, Windows Run key; popup-ack/response                                                                                                                                                            |
| **safeStorage**                                 | `safe_storage.rs`                                | OS keychain (`keyring`) key + AES-256-GCM; same hex Result shape                                                                                                                                                                                           |
| **bioAuthModule** (Touch ID)                    | `macos.rs`                                       | LocalAuthentication is-available/validate, 24h/5-min-blur lock semantics, events                                                                                                                                                                           |
| **custom-protocols** (deep links)               | `lib.rs` + deep-link plugin                      | all `uriSchemes.json` schemes → `protocol/open`, single-instance forward                                                                                                                                                                                   |
| **power-monitor**                               | `macos.rs`                                       | NSWorkspace will-sleep → `power-monitor/suspend`                                                                                                                                                                                                           |
| **system-settings**                             | `lib.rs`                                         | `system/open-settings` bluetooth (macOS/Linux)                                                                                                                                                                                                             |
| **external-links**                              | `external_links.rs` + preload                    | http(s) → default browser; navigation guard in `window.rs`                                                                                                                                                                                                 |
| **user-data**                                   | `user_data.rs`                                   | open/clear in `<appData>`, path-traversal guarded                                                                                                                                                                                                          |
| **menu** + shortcuts                            | `menu.rs`                                        | File/Edit/View/Window/Help, reload/zoom/find/guide accelerators                                                                                                                                                                                            |
| **event-logging** + logger                      | `lib.rs` + tauri-plugin-log                      | file log in the OS log dir; `logger/config` sets level at runtime                                                                                                                                                                                          |
| dev-tools                                       | `menu.rs`                                        | devtools toggle (debug builds)                                                                                                                                                                                                                             |
| **firmware** store                              | frontend (web build)                             | connect browser build persists firmware via the same `user-data` path                                                                                                                                                                                      |
| request-filter / response-headers / interceptor | `window.rs` nav guard + CSP in `tauri.conf.json` | see parity deltas                                                                                                                                                                                                                                          |
| MCP server                                      | `lib.rs` (settings surface)                      | settings persisted; the local MCP HTTP server itself is a follow-up (see deltas)                                                                                                                                                                           |
| **bluetooth (BLE)**                             | `bluetooth.rs` + `bluetooth_host.rs`             | **native Rust** BLE host: spawns the same `trezor-bluetooth` server + reimplements `BluetoothIpc` in Rust; renderer reaches it over `window.ipcProxy` (preload → `ws://127.0.0.1:21329`), the same `@trezor/ipc-proxy` wire protocol as Electron (no Node) |

### Parity deltas (intentional / follow-up)

- **External-link Tor warning dialog**: Electron shows a native confirm dialog before opening a
  link in the browser while Tor is on; the Tauri build opens it directly (no native modal API used).
- **MCP server**: the settings channels (`mcp/*`) are implemented and persisted, but the local MCP
  HTTP server process (`suite-desktop-core/src/modules/mcp-server.ts`) is not yet ported — it drives
  connect through the same connect-ws path that already works, so it is a mechanical follow-up.
- **coinjoin middleware**: Electron runs a `CoinjoinProcess` + node thread-proxy backend. The
  coinjoin binaries are bundled (`suite-data/files/bin/coinjoin`), but the node thread-proxy host is
  not yet ported; coinjoin is disabled in this shell for now.
- **bluetooth (BLE)**: implemented (see the parity table). The BLE stack — spawning the
  `trezor-bluetooth` native server and driving the stateful `BluetoothIpc` — is **reimplemented in
  Rust** (`bluetooth_host.rs`), reached from the webview over the same `@trezor/ipc-proxy` wire
  protocol via `window.ipcProxy`. Verified end-to-end (host spawn → `window.ipcProxy` connect →
  `initBluetoothThunk` → native server spawn); actual device pairing needs a BLE-capable Trezor
  (Safe 5/7) + the OS Bluetooth entitlement, identical to Electron.
- **udev/install**: declared in the desktopApi interface but has no handler in Electron either
  (dead channel) — matched as a no-op.
- **crash-recover / request-interceptor**: WKWebView/WebKitGTK expose no render-process-gone or
  per-request interception hooks equivalent to Electron's; the navigation guard covers top-level
  navigations.

### e2e (Chromium harness, JS `desktopApi` mirror)

| Area                       | @desktopOnly e2e                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| boot / handshake           | ✅                                                                                                       |
| auto-updater + EAP         | ✅ `eap-modal` green                                                                                     |
| metadata local files       | ✅ `metadata` migration green                                                                            |
| application logging        | ✅ `application-log` green                                                                               |
| connect-popup / connect-ws | ✅ **10/10** `trezor-connect/*` green (incl. silent-mode focus)                                          |
| offline mode               | ⚠️ banner + onboarding proven; blocked by an emulator `emulator-input-pin` incompatibility               |
| bundled bridge             | verified live with a **physical Trezor Model T**                                                         |
| Tor                        | verified live: bundled tor bootstraps, proxy applied, forwarder routes external over Tor + Bridge direct |

### Bundled bridge (native Rust)

Like the Electron app, the Tauri shell carries its own Trezor Bridge — no separately-installed
Bridge required. Electron runs `@trezor/transport-bridge`'s `TrezordNode` in a Node worker thread.
**Tauri ships no Node runtime**: `src/bridge_server/` is a from-scratch **Rust reimplementation of
trezord** that runs in-process (a tokio/axum task), and `src/bridge.rs` is a thin wrapper that starts
it on launch (unless an external Bridge already holds `:21328`), exposes `bridge/get-status` +
`bridge/toggle` (+ `bridge/status` events). The frontend's `BridgeTransport` connects to `:21328`
(transport-common `DEFAULT_PORT`), so a physical device plugged into USB is served by the app's own
bridge.

`bridge_server/` implements the full trezord HTTP surface and wire protocol natively:

- **`server.rs`** — axum on `:21328`: `/`, `/enumerate`, `/listen`, `/acquire`, `/release`,
  `/call`, `/read`, `/post`, `/configure`, with the same origin gate and JSON shapes.
- **`transport.rs`** — USB enumeration via `nusb`, device I/O via **`rusb`/libusb** (vendored,
  statically linked — the same C library node-usb and trezord use; nusb's async interrupt-OUT
  transfers never complete on macOS). Interrupt endpoints 0x01/0x81, 64-byte reports, device reset
  on re-acquire and close mirroring the JS `UsbApi` (reset interrupts pending reads). Live-verified
  with a physical Trezor Model T end-to-end (enumerate → acquire → handshake → GetFeatures →
  release, repeated sessions). A UDP transport (emulator, `TREZOR_BRIDGE_UDP=1`) shares the same
  path for testing.
- **`protocol.rs`** — protocol v1 framing (`3f 23 23` magic + type + len), the `bridge` HTTP body
  format, and USB report chunking.
- **`thp.rs`** — protocol v2 (THP, Trezor Safe) **transport framing only**: channel routing, the
  sync/ack-bit state machine, CRC32, ACK handshake. No crypto — AES-GCM keys never reach the bridge
  (identical to how Electron's `TrezordNode` treats THP), so this is a faithful, safe port.
- **`sessions.rs`** — the session/lock state machine (acquire/release, per-device FIFO lock,
  descriptor-change broadcast for `/listen`).

Covered by 11 Rust unit/integration tests (incl. a full mock-device
enumerate→acquire→call→release), and verified live: a built `.app` serves `:21328`, and a physical
Trezor plugged into USB reaches the dashboard through the app's own bridge — no external Bridge, no
Node.

### Bundled Bluetooth (BLE, native Rust)

The Electron app runs the BLE stack in its Node main process: it spawns the `trezor-bluetooth`
native server binary and drives it through the stateful `BluetoothIpc` client, exposing that to the
renderer over `@trezor/ipc-proxy` (`window.ipcProxy`). Tauri has no Node main, so the **same stack
is reimplemented in Rust** (`src/bluetooth_host.rs`), spawned by `src/bluetooth.rs`. It hosts an
`ipcMain`-shaped server over a WebSocket (`ws://127.0.0.1:21329`) speaking the exact `@trezor/ipc-proxy`
wire protocol, and a WS client (`BleApi`) to the `trezor-bluetooth` server (`ws://127.0.0.1:21327`).
The Tauri preload's `window.ipcProxy` is a matching `createIpcProxyApi` over the `:21329` socket — so
the shared frontend's `initBluetoothThunk` and the `@trezor/transport-bluetooth` browser build work
**unchanged**.

`scripts/assemble-bluetooth.sh` stages a single resource: the git-lfs `trezor-bluetooth` binary
(`<app>/Resources/bluetooth/`) — there is no Node host bundle any more. Verified end-to-end (Rust
host spawn → `window.ipcProxy` connect → `init`/`getInfo` → native server spawn + listener
registration); real device pairing needs a BLE-capable Trezor (Safe 5/7) + the OS Bluetooth
entitlement, the same requirement as Electron.

The ipc-proxy WebSocket is authenticated: the Rust shell generates a per-launch token, passes it to
the host and the preload (`bluetooth_token` command); the host rejects any connection without it.
This restores the Electron trust boundary (where the ipc-proxy channel is only reachable from the
app's own renderer) — a bare loopback WS would otherwise let any local process drive the BLE stack.

`trezor-connect/silentMode.test.ts` was made target-aware: it spies on `app/focus` via the Electron
main process on the desktop target and via `window.__appFocusCalls` (set by the injected
`window.desktopApi`) on the Tauri target — so the same test now passes on both.

### Known limitations

- The bundled-bridge **e2e tests** (`bridge-tor/spawn-bridge*.test.ts`) `_electron.launch()` and
  drive the native window, so they cannot run against the Chromium Tauri target — they need the
  native tauri-driver path (Linux/Windows). The feature itself is implemented and was verified live
  (see above).
- The native connect-ws server is protocol-complete but, on macOS, is only smoke-verified (boot) —
  full native drive needs tauri-driver.

## E2E

The existing Playwright suite (`suite/e2e`) has a `PlaywrightTarget.Tauri` target. On macOS the
native WKWebView cannot be driven by WebDriver (`tauri-driver` is Linux/Windows only), so the target
drives the **same** desktop-mode frontend in Chromium with a JS `window.desktopApi` mirror
(`suite/e2e/support/tauriDesktopApi.ts`, kept in sync with `src/lib.rs`). The real native window is
covered by a boot smoke check (`scripts/smoke.sh`).

```bash
# serve the tauri frontend + run e2e (Node 24 required for the e2e evolu ESM deps)
yarn workspace @trezor/suite-build run dev:tauri            # serves :8000
yarn workspace @trezor/suite-e2e run test:e2e:tauri        # all Tauri-target projects
```
