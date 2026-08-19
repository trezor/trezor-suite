# Desktop boot blocks the first render on Bluetooth start-up, and serialises the storage preload with the main-process handshake

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. Two defects in the same eight-to-fifteen lines of `MainDesktop.init`, so one PR: the desktop renderer awaits the whole Bluetooth bring-up — which spawns a child process in the main process and queries the OS adapter — before it renders anything but a `LoadingScreen`, and it awaits the IndexedDB preload and the main-process handshake one after the other although neither consumes the other's result.

## Where

[`packages/suite-desktop-ui/src/MainDesktop.tsx:128`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L128) — `await store.dispatch(initBluetoothThunk())`, three lines above `root.render(<MainDesktop />)` at [`:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L131). Until that await resolves the user is looking at `LoadingScreen`, and the Bluetooth panel it initialises is not — and cannot be — on screen. The thunk's two awaits are [`initBluetoothThunk.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L37) (`bluetoothIpc.init`) and [`:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L56) (`bluetoothIpc.getInfo`); everything after them — listener registration at [`:131-178`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L131) and the 3-second device race at [`:184-204`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L184) — is already non-blocking. The file carries a `// TODO should it really be here instead of initAction.ts?` at [`:127`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L127).

[`packages/suite-desktop-ui/src/MainDesktop.tsx:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L67) and [`:68`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L68) — `preloadStore()` reads every persisted record from IndexedDB ([`preloadStore.ts:63-97`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L63)) and `desktopApi.handshake()` is one Electron IPC round trip returning a CLI-derived state patch. Their results meet for the first time on [`:70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L70), where `initStore` merges the patch onto the preloaded state ([`store.ts:190-201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/store.ts#L190)). Nothing in the main-process handshake handler reads IndexedDB, and nothing in `preloadStore` reads the patch.

## Before

```ts
const preloadAction = await preloadStore();
const { statePatch } = await desktopApi.handshake();

const { store, services } = createSuiteDesktopCompositionRoot(preloadAction, statePatch);
```

and, further down the same function:

```ts
    // establish ipc connection with TrezorConnect living in main process
    await TrezorConnect.initIpcProxy();

    // init bluetooth module
    // TODO should it really be here instead of initAction.ts?
    await store.dispatch(initBluetoothThunk());

    // finally render whole app
    root.render(
        <ServicesProvider services={services}>
            <ReduxProvider store={store}>
                <MainDesktop />
            </ReduxProvider>
        </ServicesProvider>,
    );
```

## After

```ts
const [preloadAction, { statePatch }] = await Promise.all([preloadStore(), desktopApi.handshake()]);

const { store, services } = createSuiteDesktopCompositionRoot(preloadAction, statePatch);
```

```ts
    // establish ipc connection with TrezorConnect living in main process
    await TrezorConnect.initIpcProxy();

    // finally render whole app
    root.render(
        <ServicesProvider services={services}>
            <ReduxProvider store={store}>
                <MainDesktop />
            </ReduxProvider>
        </ServicesProvider>,
    );

    // TODO should it really be here instead of initAction.ts?
    // Bluetooth starts the trezor-bluetooth process and queries the OS adapter, and nothing on the
    // first screen depends on it. The timeout keeps it prompt for a user who booted to pair.
    requestIdleCallback(() => store.dispatch(initBluetoothThunk()), { timeout: 2000 });
```

## Why it matters

**The Bluetooth await.** This runs on every desktop start, for every user, whether or not they own a Bluetooth Trezor. `bluetoothIpc.init` is an IPC call whose main-process handler first does `await lazyBluetooth.getOrInit()` ([`bluetooth.ts:83-84`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bluetooth.ts#L83)), and that lazy factory ([`:43-59`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bluetooth.ts#L43)) picks a free port, **spawns the bundled `trezor-bluetooth` binary as a child process**, and waits for it to serve. `BluetoothProcess` is constructed with `autoRestart: 0`, so `BaseProcess.start()` takes the branch that polls `http://localhost:<port>/` with `setInterval(..., 200)` until the service answers ([`BaseProcess.ts:175-183`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/processes/BaseProcess.ts#L175)). That loop has no timeout and no attempt cap. It ends when the service answers, or when the child emits `close` and the sibling handler rejects — **a process that starts but never serves leaves the poll running forever, and the app never renders at all.** A websocket to that process is opened next, whose own default message timeout is 20 s ([`websocket-client/src/client.ts:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/websocket-client/src/client.ts#L20)).

For a user who has ever paired a device, `knownDevices.length > 0` and `init` does more: `set_state`, then `start_scan`, and if the scan returns nothing it sleeps a hard-coded second ([`bluetooth-ipc-main.ts:115-118`](https://github.com/trezor/trezor-suite/blob/develop/packages/transport-bluetooth/src/client/bluetooth-ipc-main.ts#L115)). Their Trezor is not in range on most starts, so that second is charged to the boot path on most starts. Then the second await, `getInfo` ([`bluetooth-ipc-main.ts:127-136`](https://github.com/trezor/trezor-suite/blob/develop/packages/transport-bluetooth/src/client/bluetooth-ipc-main.ts#L127)), connects the websocket if `init` did not and asks the daemon for adapter state — the actual OS Bluetooth query. On a machine with the adapter off, or with no adapter at all, the daemon answers `disabled` or errors and the app proceeds; the process spawn was paid anyway.

None of this is proportional to user data — it is proportional to how quickly a child process comes up and how quickly the OS Bluetooth stack answers, both of which the app does not control and neither of which it bounds. After the fix the app renders as soon as the TrezorConnect IPC proxy is up, and Bluetooth initialises in idle time with a 2 s ceiling. The user with a paired device sees their Bluetooth Trezor offered a beat later than today; the user without one sees the app sooner and notices nothing else.

**The serialisation.** Boot pays `preloadStore()` **plus** `desktopApi.handshake()` where it could pay the larger of the two. The preload grows with persisted data (it reads `txs` for every account of every remembered wallet, [`preloadStore.ts:75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L75)); the handshake is a fixed IPC round trip. `Promise.all` is the whole fix.

No figure in this document is measured.

## Notes

- **The ordering hazard, and the reason a reviewer may reject the Bluetooth half as written.** The BluetoothTransport is added to TrezorConnect's transport list at the moment the renderer calls `TrezorConnect.init`: the main process evaluates `getTransportsParam` ([`trezor-connect.ts:155`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L155)), which returns a Bluetooth transport only if `lazyBluetooth.get()` is already non-null ([`bluetooth.ts:64-76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/bluetooth.ts#L64), read at [`trezor-connect.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L92)). Today's `await` at `:128` is what guarantees that, because `getOrInit` is only ever reached through `bluetoothIpc.init` and `initBluetoothThunk` is its only call site in the repo. Defer the thunk past `root.render` and it races `connectInitThunk` ([`initAction.ts:85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L85), dispatched from the `Preloader` mount effect) — and if connect wins, Suite runs the entire session with no Bluetooth transport, because nothing calls `updateConnectSettings` with a `transports` field afterwards. **So this PR must also make the main process own that dependency** — the `init` branch at `trezor-connect.ts:155` is already inside an `async` handler and can `await lazyBluetooth.getOrInit()` before building the list — or the Bluetooth half must be split out and land after that change. Without it this is a functional regression for Bluetooth users dressed as a perf win.
- Deferring does **not** widen the window in which early adapter/device events are missed. The renderer's listeners are registered at [`initBluetoothThunk.ts:131-178`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L131), after both awaits, and the main-process emitter only starts producing events once `connectApi()` runs — which happens inside those same two calls. So the gap between `start_scan` and listener registration exists today and moves, rather than lengthens, under this change. Confirm with a real paired device before merging; the `BluetoothIpc` emitter buffers nothing.
- A Bluetooth _failure_ already does not block boot and will not start to: `createThunk` is Redux Toolkit's `createAsyncThunk` ([`createThunk.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-utils/src/createThunk.ts#L51)), so `store.dispatch(initBluetoothThunk())` resolves with a rejected action rather than throwing at the call site. A Bluetooth _hang_ is what blocks boot. The failure toast at [`initBluetoothThunk.ts:44-53`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L44) arguably works better after this change than before it — today it is raised before the tree mounts and has nowhere to render.
- `requestIdleCallback` is used bare here, with no shared helper, because this file only ever executes in the Electron renderer ([`index.tsx:5-9`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/index.tsx#L5)), i.e. Chromium, where both `requestIdleCallback` and `scheduler.yield` are always present and the Safari fallback inside the shared `runWhenIdle` helper (`packages/utils/src/runWhenIdle.ts`, introduced by whichever of these issues lands first) would be dead code. Using the helper anyway — `runWhenIdle(() => store.dispatch(initBluetoothThunk()), { timeout: 2000 })` — is equally correct and is what the web-facing documents in this set do; pick whichever the reviewer prefers for consistency.
- No `cancelIdleCallback`, deliberately. `init` is the app bootstrap and has no unmount; a renderer reload tears down the whole JS context, so there is no surviving store for a late callback to dispatch into. The component-level documents in this set do need the cancel path; this one does not.
- Why 2000 ms: the deferral has to stay invisible to someone who opened Suite specifically to connect over Bluetooth. Auto-connect already waits up to 3 s of its own _after_ init before it starts attempting known devices ([`initBluetoothThunk.ts:184-204`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/bluetooth/initBluetoothThunk.ts#L184)), so a 2 s idle ceiling sits inside a budget the flow already tolerates. That is reasoning, not measurement — a reviewer who wants 1000 should say so.
- The `Promise.all` half is independent and safe to land on its own. It also _improves_ hang detection: the main process treats the `handshake/client` invoke as the renderer's liveness signal with a 30 s budget ([`handshake-and-hang-detect.ts:10`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/handshake-and-hang-detect.ts#L10) and [`:60`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/handshake-and-hang-detect.ts#L60)), and today the IndexedDB read is charged against that budget, so a very large or blocked database can raise a spurious "The application seems to be hanging..." dialog. Concurrency takes the preload out of it.
- The DB-error path should be unaffected but is worth checking by hand. `preloadStore` resolves early with `STORAGE.ERROR` when the database is blocked or blocking ([`preloadStore.ts:10-25`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L10)), and `initStore` only merges `statePatch` when a preloaded state exists ([`store.ts:194-201`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/store.ts#L194)), so `Promise.all` cannot change which one wins — but the `db-error` screen ([`Preloader.tsx:96-97`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L96)) is exercised only with two app instances open, so verify it manually.
- **Neither hunk has been compiled.** Types read as sound: `Promise.all` over the array literal infers the tuple `[PreloadStoreAction, HandshakeInit]`, and `HandshakeInit` is `{ statePatch?: Record<string, any> }` ([`messages.ts:51-53`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-api/src/messages.ts#L51)), so the destructuring holds; `requestIdleCallback` comes from `lib.dom`, which the package gets by default since `tsconfig.base.json` sets no `lib`.
- `packages/suite-desktop-ui` is `private: true` — app code, nothing published, no `.d.ts` surface moves. It also has no test files at all; this path is covered only by desktop e2e. The regression the first bullet describes would show up as "the app boots but Bluetooth devices are never offered", which no current test asserts — if the ordering change lands, add an e2e assertion that the transport list contains Bluetooth after boot.
- Deliberately not changed: `preloadStore` still reads every row eagerly, `txs` included — that is the subject of `p1-04`/`p1-05` and it is what makes the `Promise.all` worth anything. And the shape of `bluetoothIpc.init` itself stays as it is; the in-repo TODO at [`bluetooth-ipc-main.ts:101-102`](https://github.com/trezor/trezor-suite/blob/develop/packages/transport-bluetooth/src/client/bluetooth-ipc-main.ts#L101) already argues that the thunk's call "should only check that ipc channel is established, nothing more", which would shrink this await instead of moving it. That is the better long-term fix, in a different package, and it does not conflict with this one.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
