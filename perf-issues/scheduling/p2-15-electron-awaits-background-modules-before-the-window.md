# The Electron main process awaits all four background modules — the bridge utility-process fork included — before it creates the `BrowserWindow`, so there is no window at all until they finish

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. This is not a long task and not a loop; it is one `await` on the wrong side of window creation. `init()` waits for `loadBackgroundModules(...)` to resolve before it does anything else, and `createMainWindow(...)` is the last statement of `init()`, so until the bridge has forked its utility process and the local HTTP receiver has bound its port there is no `BrowserWindow`, no `loadIndex`, no renderer and therefore not even a loading screen — the dock/taskbar icon bounces against a blank desktop.

## Where

[`packages/suite-desktop-core/src/app.ts:201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L201) — `const backgroundModulesResponse = await loadBackgroundModules(undefined);`, sixteen lines after `await app.whenReady()` at [`:185`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L185) and 252 lines above the only statement that puts a window on screen, [`:453`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L453). Its single consumer is [`:294`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L294), where the resolved value is spread into the `handshake/load-modules` reply — verified by grep, there is no other reference to `backgroundModulesResponse` in the repo.

The background set is four modules, [`modules/index.ts:84`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L84):

```ts
const MODULES_BACKGROUND: ModuleBackground[] = [bridge, trezorConnect, httpReceiverModule, tray];
```

`loadModules` is a `Promise.all` over their `onLoad`s ([`modules/index.ts:127`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L127)–[`:132`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L132)), and each `onLoad` is _called_ synchronously as that `map` runs. That is the whole basis for the split below: dropping the `await` does not delay anything an `onLoad` does before its first `await` — only the awaited tails move.

**Must precede the window — and still does, unchanged by this fix.** Everything here runs in the same tick whether or not the promise is awaited:

- The `TrezorConnect` ipc-proxy handler is registered in the module _body_, at [`modules/trezor-connect.ts:199`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L199), i.e. at `initBackgroundModules(...)` time ([`app.ts:191`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L191)) — before `loadModules` is called at all. Its `onLoad` is a documented no-op, [`:201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L201)–[`:203`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L203) (`// TODO: doing nothing for now.`).
- `tray.onLoad` is synchronous — `() => { renderTray(); }`, [`modules/tray.ts:162`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/tray.ts#L162)–[`:164`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/tray.ts#L164). Awaiting it costs one microtask.
- `httpReceiverModule.onLoad` registers `server/request-address` ([`modules/http-receiver.ts:80`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L80)), `connect-popup/enabled` ([`:101`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L101)), `connect-popup/set-enabled` ([`:106`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L106)), calls `initConnectPopupResponseHandler()` ([`:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L115)) and `exposeConnectWs(...)` ([`:118`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L118)) — all of it above its first `await`.
- `bridge.onLoad` installs the 30-second bridge watchdog interval ([`modules/bridge.ts:136`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L136)–[`:158`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L158)) above its first `await`.

**Can follow the window — the awaited tails, and the only thing this fix defers.**

- `await receiver.start()`, [`modules/http-receiver.ts:123`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L123) — binding the local HTTP server. Its `{ url }` is the entire background payload the renderer receives ([`modules/index.ts:205`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L205)–[`:208`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L208)), and it is still joined before the reply.
- `await bridge.status()`, [`modules/bridge.ts:160`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L160) — a `fetch` to `http://127.0.0.1:21328/` ([`:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L51)). When no external bridge answers, this is followed by `scheduleAction(() => loadBridge({ store }), { timeout: 3000 })` at [`:166`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L166), which runs `TrezordNodeProcess.start()` → `ThreadProxy.run()` → `utilityProcess.fork()`, a wait for the `'spawn'` event, and a `request('start')` that brings up the USB backend ([`modules/bridge.ts:29`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L29)–[`:32`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L32), [`libs/thread-proxy.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/thread-proxy.ts#L51)–[`:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/thread-proxy.ts#L56)). `timeout` in `scheduleAction` is the per-attempt ceiling ([`packages/utils/src/scheduleAction.ts:6`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/scheduleAction.ts#L6)), so this term is a process fork plus a USB start, capped at 3 s.

Nothing between [`:201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L201) and [`:453`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L453) reads the resolved value: the daemon branch ([`:204`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L204)–[`:233`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L233)), the `winBounds` computation ([`:242`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L242)–[`:250`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L250)) and every `ipcMain.handle` registration read only `store`, `app` and `mainWindowProxy`.

## Before

[`packages/suite-desktop-core/src/app.ts:185`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L185)

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

[`packages/suite-desktop-core/src/app.ts:289`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L289)

```ts
// create handler for handshake/load-modules
const loadModulesResponse = (clientData: HandshakeClient) =>
    loadModules(clientData)
        .then(modulesResponse => ({
            success: true as const,
            payload: { ...modulesResponse, ...backgroundModulesResponse },
        }))
        .catch(err => ({
            success: false as const,
            error: err.message,
        }));
```

## After

`app.ts:199`–`:201` — keep the promise instead of the value:

```ts
// todo:
// @ts-expect-error ClientHanshake is no longer any. But I can't make loadmodules inner the same type since it called sooner
const backgroundModulesPromise = loadBackgroundModules(undefined);
// Nothing awaits this until the renderer asks for handshake/load-modules, so a rejection in
// between would be reported as unhandled. It is still delivered to loadModulesResponse below.
backgroundModulesPromise.catch(() => {});
```

`app.ts:289`–`:299` — move the single `await` to the only consumer:

```ts
// create handler for handshake/load-modules
const loadModulesResponse = (clientData: HandshakeClient) =>
    Promise.all([loadModules(clientData), backgroundModulesPromise])
        .then(([modulesResponse, backgroundModulesResponse]) => ({
            success: true as const,
            payload: { ...modulesResponse, ...backgroundModulesResponse },
        }))
        .catch(err => ({
            success: false as const,
            error: err.message,
        }));
```

No scheduling primitive is involved and no shared helper is needed — this is pure re-ordering inside an already-`async` function.

## Why it matters

The user has just double-clicked the app icon. Between `app.whenReady()` and the `BrowserWindow` there is currently a `fetch` to a loopback port, and — on the ordinary case where no external bridge is installed — an Electron `utilityProcess.fork()` plus a USB backend start with a 3-second ceiling. `n` is bounded and small (four modules), so this is not an n-growth defect; it is a wall-clock defect on the one path where the app has nothing on screen to show for the wait. Electron gives no free feedback here: the window is what carries the themed `backgroundColor` ([`app.ts:93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L93)) and `loadIndex` is only reached through the `mainWindowProxy.on('init')` handler ([`app.ts:413`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L413), `loadIndex` at [`handshake-and-hang-detect.ts:73`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/handshake-and-hang-detect.ts#L73)), so before line 453 there is nothing to paint into.

The win is not only perceptual. The renderer's own boot prelude is serialised behind this today and would overlap it after the change — `root.render(<LoadingScreen />)` ([`packages/suite-desktop-ui/src/MainDesktop.tsx:65`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L65)), the IndexedDB `preloadStore()` ([`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L67)), `desktopApi.handshake()` ([`:68`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L68)) and `loadTorModule()` with its Tor bootstrap screen ([`:88`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L88)–[`:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L105)) all run before the renderer reaches `desktopApi.loadModules(...)` at [`:107`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L107). That call is the join point, and it stays the join point: the renderer still cannot observe a half-loaded module set.

After the fix the window, the themed background and the loading screen appear as soon as Electron is ready, and the bridge fork runs alongside the storage preload instead of in front of it.

## Notes

- **The After hunk has not been compiled.** It is written against the surrounding types by reading. The `@ts-expect-error` on the line above is preserved and still applies — the argument mismatch it suppresses is on the call, not on the `await`.
- **Honest sizing: this changes time-to-window, not necessarily time-to-dashboard.** `loadModulesResponse` still waits for the same promise, so if the bridge fork is genuinely the long pole it remains the long pole for the _dashboard_. What is recovered for the total is only the overlap with the renderer prelude listed above. A reviewer who thinks that overlap is small is right to say the ranking is "the user sees a window instead of nothing", not "the app starts faster by X". P2 is the honest slot.
- **Behaviour change on the failure path, and it needs sign-off.** `loadModulesInner` rethrows on a failed module (`modules/index.ts:155`). Today that rejects `init()`, which is called with no `.catch` at [`app.ts:456`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L456) — so a background-module failure is _already_ an unhandled rejection today, and additionally leaves the app with no window, ever. After the change the window exists and the renderer renders `<ErrorScreen error={loadModules.error} />` ([`MainDesktop.tsx:114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L114)). That is better, but it is a different observable outcome. In practice the path is largely defensive: `bridge.onLoad` swallows its own start error ([`modules/bridge.ts:168`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bridge.ts#L168)) and `httpReceiver.onLoad` returns `{ url: null }` rather than throwing on a bind failure ([`modules/http-receiver.ts:135`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/http-receiver.ts#L135)).
- **Why the sentinel `.catch`.** Node reports a rejection as unhandled at the end of the turn in which it happens if nothing is attached; the window between `loadBackgroundModules(...)` and the renderer's first `handshake/load-modules` is exactly such a gap. Attaching the no-op marks the original promise handled while leaving the rejection intact for the `Promise.all`. If a reviewer prefers not to have a bare empty catch in this file, the alternative is `.catch(err => logger.error('modules', ...))`, which is strictly more informative and costs a line.
- **Daemon mode is unaffected but worth reading twice.** `daemon = hasSwitch('bridge-daemon') || wasOpenedAtLogin` ([`app.ts:205`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L205)) parks on `await waitForFullStart.promise` ([`:228`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L228)) and never creates a window until a second instance or a deeplink arrives. The bridge start is _kicked off_ at the same wall-clock moment either way, so "required in both UI and daemon mode" still holds; only the wait moves. The one visible difference is that `app.dock?.hide()` ([`:209`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L209)) now runs before the bridge is up rather than after — i.e. the dock icon disappears sooner, which is the intended behaviour anyway.
- **Progress events start reaching the window.** `loadModulesInner` sends `handshake/event` progress per loaded module ([`modules/index.ts:136`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L136)) through `mainWindowProxy.getInstance()?`. Today those four are dropped because no window exists; after the change some will land. Nothing in `packages/suite`, `packages/suite-desktop-ui` or `suite/` subscribes to `handshake/event` — it exists only in the API type and the channel allowlist ([`packages/suite-desktop-api/src/api.ts:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-api/src/api.ts#L89), [`validation.ts:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-api/src/validation.ts#L43)) — so there is no visible effect today. If a progress UI is ever wired up, background progress (`total` 4) would interleave with foreground progress, whose `total` is however many of the 29 entries in `MODULES` return an `onLoad` ([`modules/index.ts:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L50)–[`:82`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/index.ts#L82)), and the bar would jump. Worth a comment in that future PR, not a blocker for this one.
- **Tests.** There is no unit coverage of `app.ts` — `packages/suite-desktop-core` has tests only for `libs/*` and `modules/mcp-server`. The real coverage is Playwright: [`suite/e2e/tests/bridge-tor/spawn-bridge.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/bridge-tor/spawn-bridge.test.ts) and [`spawn-bridge-daemon.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/bridge-tor/spawn-bridge-daemon.test.ts). Both should still pass: `waitForAppToBeInitialized` waits for `@welcome-layout/body` / `@dashboard/graph` ([`suite/e2e/support/bridge.ts:29`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/bridge.ts#L29)), which the renderer only paints after `loadModules` resolves — i.e. after the join. **But the latent hazard is real:** `launchSuite` resolves on `electronApp.firstWindow()` ([`suite/e2e/support/electron.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/electron.ts#L116)), which will now fire much earlier, and `expectBridgeToBeRunning` is a single un-retried GET ([`suite/e2e/support/bridge.ts:10`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/bridge.ts#L10)). Any future test that asserts bridge status straight after `launchSuite` without going through `waitForAppToBeInitialized` will flake. Run both files on all three platforms before merging rather than reasoning about it.
- **What was deliberately not changed.** The `// Load bridge module first, it is required in both UI and daemon mode` comment at [`app.ts:187`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L187) still describes what happens — loading starts first — so it stays. The `// Create main window last, so all listeners are set up` invariant at [`:452`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/app.ts#L452) is preserved: every `ipcMain.handle` is still registered above line 453. The four modules are not reordered and none is moved out of the background set — the split argued above is between the synchronous and asynchronous halves of the same `onLoad`s, not between modules.
- **Platform and packaging.** Desktop only. `@trezor/suite-desktop-core` is `"private": true`, so there is no published-API impact.
- **Where a reviewer should push back.** Whether the httpReceiver's `receiver.start()` really has no consumer before the handshake. The reasoning here is that its only externally visible product is `urls.httpReceiver` in the load-modules payload, and the three IPC handlers that touch the receiver are registered synchronously and only invoked on user action (trading redirects, OAuth). If a maintainer knows of a path that hits `server/request-address` during boot, that assumption needs re-checking before this lands.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
