# Area 10 — Desktop main/preload and connect popup, iframe, web entry points

Scanned: packages/suite-desktop-core/src/app.ts, packages/suite-desktop-core/src/preload.ts, packages/suite-desktop-core/src/handshake-and-hang-detect.ts, packages/suite-desktop-core/src/modules/** (index, bridge, trezor-connect, coinjoin, http-receiver, firmware, bluetooth, tray, menu, auto-updater, request-filter, request-interceptor, response-headers, metadata, user-data, mcp-server, bioAuthModule, event-logging/**), packages/suite-desktop-core/src/libs/** (logger, store, info, user-data, connect-ws, connect-popup-messages, http-receiver, thread, thread-proxy, create-electron-session-interceptor, loadIndex, process-icon), packages/suite-desktop-core/src/threads/**, packages/connect-web/src/** (index, connectSettings, impl/core-in-suite-desktop, impl/core-in-suite-web, popup/abstract, popup/web, popup/webextension, bootstrap/bootstrap), packages/connect-webextension/src/**, packages/connect-mobile/src/**, packages/suite-web/src/** (index, MainWeb, sentry, createSuiteWebCompositionRoot, support/**, static/**), packages/node-utils/src/findProcessFromIncomingPort.ts, suite/sentry/src/config.ts
Findings: 3

Note on scope: `packages/connect-iframe` and `packages/connect-popup` no longer exist as source packages on this branch — `git ls-files` returns nothing for either, only a stale untracked `packages/connect-iframe/build/` directory is on disk. The popup now renders inside Suite itself (`packages/suite/src/views/connect-popup/index.tsx` reached via the `suite-connect-popup` route), and the iframe/popup bootstrap lives in `packages/connect-web/src/bootstrap/`. That bootstrap was read in full and is a pure message-forwarding handshake with bounded work per message — nothing to report there. `packages/suite-desktop/src` also does not exist; the Electron preload is `packages/suite-desktop-core/src/preload.ts`, which is 34 lines of `contextBridge.exposeInMainWorld` calls and is clean.

## F10.1 — Stop awaiting background-module load before the Electron window is created in app.ts

- **Anchor:** `packages/suite-desktop-core/src/app.ts:201` (also `packages/suite-desktop-core/src/app.ts:453`, `packages/suite-desktop-core/src/modules/bridge.ts:160`, `packages/suite-desktop-core/src/modules/bridge.ts:166`)
- **Class:** startup-serialisation
- **Platform:** desktop
- **What grows:** n is bounded (4 background modules: `bridge`, `trezorConnect`, `httpReceiverModule`, `tray`), so this is not an n-growth defect — it is a wall-clock defect. The dominating term is `bridge.initBackground.onLoad`, which does `await bridge.status()` (a `fetch` to `http://127.0.0.1:21328/`) and then, when no external bridge answers, `scheduleAction(() => loadBridge({ store }), { timeout: 3000 })`. `loadBridge` → `TrezordNodeProcess.start()` → `ThreadProxy.run()` → `utilityProcess.fork()` + await `'spawn'` + `sendMessage('init')` + `request('start')`. That is a full Electron utility-process fork plus a USB backend start, i.e. a few hundred ms typically and up to the hard 3 s ceiling.
- **When it runs:** every cold start of Trezor Suite desktop, immediately after `await app.whenReady()`.
- **Blocking-what:** the user is waiting for the application window to appear at all. `createMainWindow(...)` is the _last_ statement of `init()` (line 453), so until `loadBackgroundModules` resolves there is no `BrowserWindow`, no `loadIndex`, no renderer process, and therefore no loading screen — the dock/taskbar icon bounces against a blank desktop.
- **Before:**

```ts
await app.whenReady();

// Load bridge module first, it is required in both UI and daemon mode
const interceptor = createElectronSessionInterceptor();
const mainWindowProxy = new MainWindowProxy();
const { loadModules: loadBackgroundModules, quitModules: quitBackgroundModules } =
    initBackgroundModules({
        mainWindowProxy,
        store,
        interceptor,
        mainThreadEmitter,
        cspNonce,
    });

// todo:
// @ts-expect-error ClientHanshake is no longer any. But I can't make loadmodules inner the same type since it called sooner
const backgroundModulesResponse = await loadBackgroundModules(undefined);
```

- **Proposed fix:** Do not `await` here. Keep the promise (`const backgroundModulesPromise = loadBackgroundModules(undefined)`) and move the single `await` into `loadModulesResponse` (app.ts:295-305), which is the only consumer — it spreads `backgroundModulesResponse` into the `handshake/load-modules` reply and is itself already async. The window creation at line 453, the daemon-mode branch, and the `winBounds` computation all read only from `store`/`app`, so none of them depend on the background modules. This is a pure re-ordering, not a chunk-and-yield: the call site is already inside an `async` function, so no restructuring is needed beyond hoisting the promise. Window creation then overlaps the bridge fork instead of following it.
- **Risk / ordering:** The renderer's `handshake/load-modules` reply still waits for the same promise, so the renderer cannot observe a half-loaded module set — the contract is preserved. Two things to check: (1) an unhandled rejection if `loadBackgroundModules` rejects before anything awaits it — attach a `.catch(() => {})` sentinel or keep the rejection on the stored promise and let `loadModulesResponse` surface it; (2) `initBackgroundModules` is created with `mainWindowProxy` before the window exists and its module bodies already guard with `mainWindowProxy.getInstance()?.` (tray, http-receiver, bridge all use the optional-chained getter), so an earlier window does not break them. Daemon mode (`hasSwitch('bridge-daemon')`) must keep waiting for the bridge, but that branch never creates a window anyway.
- **Confidence:** high — I read the whole of `app.ts`, `modules/index.ts` (`loadModules` is `Promise.all` over the four background modules), `modules/bridge.ts`, `libs/thread-proxy.ts` and `packages/utils/src/scheduleAction.ts`, and confirmed `createMainWindow` is the final statement of `init()`.
- **Priority:** P2 (bounded n; ranked by wall-clock cost on the app's first-paint path rather than by n, which the P1/P2/P3 rubric does not cover)

## F10.2 — Replace the synchronous `execSync` computer-name lookup on the desktop TrezorConnect.init path

- **Anchor:** `packages/suite-desktop-core/src/libs/info.ts:63` (also `packages/suite-desktop-core/src/libs/info.ts:66`, `packages/suite-desktop-core/src/modules/trezor-connect.ts:145`)
- **Class:** startup-serialisation
- **Platform:** desktop (Electron **main** process)
- **What grows:** bounded — exactly one `child_process.execSync` per `TrezorConnect.init`. The cost is not n but a synchronous fork/exec of an external binary: `scutil --get ComputerName` on macOS, `hostnamectl --pretty` on Linux. `hostnamectl` in particular round-trips to systemd over D-Bus and is routinely 50-200 ms; on a machine without systemd it pays the full spawn before throwing into the `catch`.
- **When it runs:** on every `TrezorConnect.init` IPC call from the renderer. `connectInitThunks` always passes a `thp` object (`const thp = getThpSettings();` then `thp` is spread into `TrezorConnect.init`), so the `if (settings.thp)` guard is always true on desktop. That is once per app start, plus again after every renderer reload (Ctrl+R re-runs the init chain).
- **Blocking-what:** the Electron **main process event loop**, which is the single thread that services _every_ IPC channel. While `execSync` is parked in the kernel, `handshake/client`, `handshake/load-modules`, `bridge/get-status`, `tray/get-settings`, `bio-auth/*` and every `ipc-proxy` `TrezorConnect`/`Bluetooth` call from the renderer sit unprocessed in the queue. And the renderer is simultaneously blocked on the very `TrezorConnect.init` promise this call sits inside, so it is directly on the "app is starting up, device not discovered yet" path.
- **Before:**

```ts
export const getComputerName = () => {
    try {
        let name;
        switch (process.platform) {
            case 'win32':
                name = process.env.COMPUTERNAME;
                break;
            case 'darwin':
                name = execSync('scutil --get ComputerName').toString().trim();
                break;
            case 'linux':
                name = execSync('hostnamectl --pretty').toString().trim();
                break;
        }

        return name || os.hostname();
```

- **Proposed fix:** Make `getComputerName` async and `await` it — the call site (`modules/trezor-connect.ts:145`) is already inside an `async` `onRequest` handler that awaits `getStoredFirmwares()` two lines above, so switching to `child_process.exec`/`execFile` (promisified) costs nothing structurally. Better still, resolve it once at module scope behind a lazily-initialised promise (`const computerName = getComputerNameAsync()`) kicked off at `initBackground` time and awaited at `init`, so repeated renderer reloads never re-spawn. `os.hostname()` is a pure syscall and stays the synchronous fallback. No batching or yielding is needed; the fix is simply not to block the loop.
- **Risk / ordering:** `settings.thp.hostName` must still be set before `TrezorConnect.init(settings)` on line 157, so the await has to land above that line — trivially satisfied. The value is user-visible (it becomes the THP host name the device displays when pairing), so a cached value must be invalidated on nothing less than an app restart; the OS computer name changing mid-session is acceptable to miss. Windows already takes the non-exec path (`process.env.COMPUTERNAME`) and is unaffected.
- **Confidence:** high — read `libs/info.ts` in full, the call site in `modules/trezor-connect.ts`, and confirmed in `suite-common/connect-init/src/connectInitThunks.ts:183-195` that `thp` is unconditionally present so the guard never short-circuits.
- **Priority:** P3 (bounded n) — but note it stalls the one thread that every renderer IPC round trip has to traverse.

## F10.3 — Stop re-running subprocess process-discovery and icon extraction inline on every connect-ws core call

- **Anchor:** `packages/suite-desktop-core/src/libs/connect-ws.ts:142` (also `packages/suite-desktop-core/src/libs/connect-ws.ts:238`, `packages/connect-web/src/impl/core-in-suite-desktop.ts:138`)
- **Class:** startup-serialisation
- **Platform:** desktop (Electron main process + the third-party app's thread waiting on the websocket)
- **What grows:** n is the number of TrezorConnect calls a third-party desktop application makes over one long-lived websocket session — unbounded over a session (a dApp typically issues `getFeatures`, `getPublicKey`, `getAddress`, `signTransaction`, … back to back), and the per-call work is constant but expensive: `findProcessFromIncomingPort` spawns `lsof -iTCP:<port> -n -P +c0` and then `ps -p <pid> -o comm=` (macOS) or `cat /proc/<pid>/cmdline` (Linux), i.e. two shell subprocesses; `getProcessIcon` then does `nativeImage.createThumbnailFromPath()` against the caller's `.app` bundle, which hits the disk and the OS thumbnailer.
- **When it runs:** `CoreInSuiteDesktop.call()` does `await this.handshake()` before _every_ core call (line 138), and the main process re-runs the full discovery on _every_ `POPUP.HANDSHAKE` message — `processOnPort` is a per-connection closure variable but it is unconditionally reassigned at connect-ws.ts:142 each time. `getProcessIcon` is then awaited inline at connect-ws.ts:238 while building the `connect-popup/call` payload, before the call is forwarded to the renderer.
- **Blocking-what:** the user clicked "Connect Trezor" (or equivalent) in a third-party desktop app and is waiting for Suite's approval dialog to appear. Every call pays: websocket handshake round trip → 2 subprocess spawns → icon thumbnail → only then is `connect-popup/call` sent to the renderer and the dialog rendered. The 3 s handshake timeout in `core-in-suite-desktop.ts:62` and its comment ("can take a while on slower machines due to loading process info") are an acknowledgement that this is already slow enough to fail on real hardware.
- **Before:**

```ts
            if (message.type === POPUP.HANDSHAKE) {
                const filterSelf = !process.env.PLAYWRIGHT_RUN; // ignore own process, unless testing
                processOnPort = await findProcessFromIncomingPort(port, filterSelf).catch(() => {
                    logger.error(LOG_PREFIX, 'findProcessFromIncomingPort failed');

                    return undefined;
                });
                manifest = parseManifest(message.payload.settings.manifest);
                version = parseVersion(message.payload.settings.version);
                requestedPermissions = message.payload.settings.requestedPermissions;
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
```

- **Proposed fix:** Resolve the peer process once per websocket connection, not once per handshake: on the first `POPUP.HANDSHAKE`, store the `findProcessFromIncomingPort(...)` **promise** (plus the derived `getProcessIcon` promise) in the connection closure and reuse it — the remote port identifies the socket, so the answer cannot change for the life of that connection. Then stop serialising the icon behind the dialog: send `connect-popup/call` immediately with `icon: undefined` and push the icon to the renderer as a follow-up `connect-popup/process-icon` message when the thumbnail resolves, so the approval dialog paints at once. No yield primitive is involved here — both call sites are already `async`, so this is purely hoisting the awaits off the per-call path. If the discovery must stay per-handshake for security reasons, at minimum move the `getProcessIcon` await off line 238 (it feeds a decorative avatar, not an authorisation decision).
- **Risk / ordering:** `processOnPort` is used for a security-relevant display (`warning: !!processOnPort.warning`, the "unusual binary location" badge), so caching it per connection must not let a _different_ peer reuse a previous result — keying the cache on the connection closure (as it already is) is correct, since a new peer means a new `ws` connection and a fresh closure. Deferring the icon changes what the renderer sees on first paint, so the popup component must tolerate `process.icon === undefined` and a later update; check `packages/suite/src/views/connect-popup` and the `connect-popup/call` handler before splitting the message. On Linux the code already tolerates `!processOnPort` (the AppImage/Flatpak carve-out at connect-ws.ts:166), so an absent value is an established state.
- **Confidence:** medium — the facts are verified (I read `connect-ws.ts`, `core-in-suite-desktop.ts` and `packages/node-utils/src/findProcessFromIncomingPort.ts` end to end, and the reassignment on every handshake is unambiguous). What is soft is the classification: part of the fix ("cache it per connection") sits close to the complexity skill's territory, and both awaits are non-blocking async, so no thread is _held_ — the cost is added serial latency in front of a user-visible dialog rather than a long task.
- **Priority:** P2 (per-call cost on a user-facing interaction path; n bounded per call, unbounded over a session)
