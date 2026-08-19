# Connect starts no transport until the remote firmware-releases fetch resolves, so a plugged-in Trezor is not detected until data.trezor.io answers

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. `Core.init` awaits a remote config download, a JWS verification and — in the common case where the remote config is newer than the bundled one — a second wave of twelve release-JSON downloads, all before `new DeviceList()` exists. Nothing on that path is needed to talk to a device: the bundled config is already the accepted answer whenever the network fails. This document does **not** propose an idle callback (see the last note); it proposes deleting the await.

## Where

[`packages/connect/src/core/index.ts:982`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L982) — `await firmwareReleaseStore.init(settings.firmwareChannel, false, initializeFirmwareConfig)`. Everything that makes a device reachable comes after it: `await loadProtobufModules()` at [`:992`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L992), `new DeviceList(...)` at [`:994`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L994), `initDeviceList(...)` at [`:997`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L997), `this.deviceList.init({ transports, ... })` at [`:1010`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L1010) and, when `transportReconnect` is false, `await this.deviceList.pendingConnection()` at [`:1018`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L1018).

What the await actually covers, in order:

1. [`firmwareReleaseStore.init`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareReleaseStore.ts#L30) calls [`getFirmwareReleaseConfig`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L153), which GETs `https://data.trezor.io/firmware/config/releases.v1.json` under an `AbortController` armed with `REQUEST_TIMEOUT_MS: 5000` ([`firmwareReleaseConfigUtils.ts:78`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L78), [`:103-108`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L103)), then ES256-verifies and JSON-parses the payload. **This stage is bounded and does have a bundled fallback** — every failure lands in the bare `catch` at [`:170`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L170) and returns `firmwareReleaseConfigAssets`, the `releases.v1.json` compiled into `@trezor/connect-data`.
2. It then awaits [`initializeFirmwareConfig`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L284). If, and only if, the remote `sequence` beat the bundled one ([`firmwareReleaseConfigUtils.ts:163`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L163)), `isRemote` is true and it calls [`createRemoteFirmwareConfig`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L249) — **a second, separately-budgeted wave of network calls the raw finding did not account for**: two release JSONs per device model ([`:261-262`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L261)), each through `getOnlineReleaseByPath` with `signal: AbortSignal.timeout(10000)` ([`:96`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L96)), joined by `await Promise.all(...)` at [`:279`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L279). The bundled config lists six models (`T1B1`, `T2B1`, `T2T1`, `T3B1`, `T3T1`, `T3W1`), so that is twelve requests, in parallel, capped at 10 s each and not capped in aggregate.

The two hosts that pay for it: [`packages/suite/src/actions/suite/initAction.ts:85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L85) (`await dispatch(trezorConnectActions.connectInitThunk()).unwrap()`, dispatched from the `Preloader` mount effect at [`Preloader.tsx:75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L75)) and [`suite-native/app-init/src/appInitThunks.ts:78`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L78).

The defect is that the _store_ awaits the remote answer before it has any answer at all, when a perfectly good bundled answer is one synchronous transform of a bundled JSON away (`createLocalFirmwareConfig`, [`firmwareInfo.ts:221`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L221), touches no network).

## Before

[`packages/connect/src/data/firmwareReleaseStore.ts:24-49`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareReleaseStore.ts#L24):

```ts
const local: FirmwareReleaseConfig = getOnlyLocalFirmwareReleaseConfig().config;
let releases:
    | Partial<Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>>
    | undefined;
let intermediary: Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]> | undefined;

export const init = async (
    firmwareChannel: FirmwareChannel | undefined,
    onlyLocal: boolean,
    initializeFirmwareConfig: InitializeFirmwareConfig,
): Promise<void> => {
    const firmwareReleaseConfig = onlyLocal
        ? { config: local, isRemote: false as const }
        : await getFirmwareReleaseConfig(firmwareChannel);

    const result = await initializeFirmwareConfig(
        firmwareReleaseConfig.config,
        firmwareReleaseConfig.isRemote,
    );
    releases = result.releases;
    intermediary = result.intermediaries;
};

export const getLocal = (): FirmwareReleaseConfig => local;
export const getReleases = () => releases;
export const getIntermediary = () => intermediary;
```

and the caller it blocks, [`packages/connect/src/core/index.ts:978-997`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L978):

```ts
// enabledNetworks has its own store (the single source of truth); keep it out of
// settingsStore so no reader picks up a stale, unsanitized snapshot.
settingsStore.set({ ...settings, enabledNetworks: undefined });
enabledNetworksStore.set(settings.enabledNetworks ?? []);
await firmwareReleaseStore.init(settings.firmwareChannel, false, initializeFirmwareConfig);
const localFirmwares = settings.localFirmwares && parseLocalFirmwares(settings.localFirmwares);
if (localFirmwares) {
    localFirmwareStore.set(localFirmwares);
}
await loadProtobufModules();

this._deviceList = new DeviceList({
    createLogger: this.createLogger,
});
initDeviceList(this.getCoreContext());
```

## After

`packages/connect/src/core/index.ts` is **unchanged** — the whole fix is inside the store, so `Core.init` keeps awaiting `firmwareReleaseStore.init` and that await now resolves on a microtask.

```ts
const local: FirmwareReleaseConfig = getOnlyLocalFirmwareReleaseConfig().config;
let releases:
    | Partial<Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>>
    | undefined;
let intermediary: Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]> | undefined;
let remoteRefresh: Promise<void> = Promise.resolve();

const setConfig = async (
    config: FirmwareReleaseConfig,
    isRemote: boolean,
    initializeFirmwareConfig: InitializeFirmwareConfig,
) => {
    const result = await initializeFirmwareConfig(config, isRemote);
    releases = result.releases;
    intermediary = result.intermediaries;
};

export const init = async (
    firmwareChannel: FirmwareChannel | undefined,
    onlyLocal: boolean,
    initializeFirmwareConfig: InitializeFirmwareConfig,
): Promise<void> => {
    // The bundled config is what every failing fetch falls back to anyway, so seed from it and let
    // transports come up; the remote config can only replace it with newer releases.
    await setConfig(local, false, initializeFirmwareConfig);

    if (onlyLocal) return;

    remoteRefresh = getFirmwareReleaseConfig(firmwareChannel).then(({ config, isRemote }) => {
        if (!isRemote) return;

        return setConfig(config, isRemote, initializeFirmwareConfig);
    });
};

export const getRemoteRefresh = () => remoteRefresh;
export const getLocal = (): FirmwareReleaseConfig => local;
export const getReleases = () => releases;
export const getIntermediary = () => intermediary;
```

## Why it matters

The user is starting Suite with a Trezor already plugged in — or plugging one in while the loader is on screen — and waiting for it to be recognised.

Nothing between `Core.init` and the transport layer consumes the firmware release config. `loadProtobufModules`, `new DeviceList`, `initDeviceList` and `deviceList.init` do not read it; the first reader is `Device._updateFeatures` ([`Device.ts:816-820`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L816)), which runs after a device has already been enumerated, acquired and has answered `Initialize`/`GetFeatures` ([`:698`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L698), [`:705`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L705)). So the ordering today buys nothing except the guarantee that the config is populated by then — a guarantee the bundled seed gives just as well, and instantly.

`n` here is not a collection; it is latency the app neither controls nor bounds in aggregate. Stage 1 is capped at 5 s. Stage 2 runs twelve requests capped at 10 s each. The worst realistic case — a captive portal, a throttled hotel link, Tor, a CDN edge that accepts the connection and then stalls — is stage 1 timing out and _then_ stage 2 timing out, which is 15 s of loader on a machine whose USB device was ready the whole time. The finding's claim that "the full 5 s elapses ... offline" is the one part worth softening: a genuinely offline machine usually fails DNS or connect immediately, so plain offline is fast today. It is the _slow_ network, not the absent one, that this costs, and stage 2 makes it cost roughly three times what the finding assumed.

Stage 2 is also not the rare branch. It runs exactly when the remote `sequence` exceeds the bundled one — that is, whenever data.trezor.io has published firmware since the user's Suite build was cut, which is the normal state of an installation that is a few weeks old.

What the platforms are holding while this resolves — none of it CPU, all of it a stalled bootstrap:

- **Web:** connect's `Core` runs in-process in the renderer via `CoreInModule` ([`index.browser.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/index.browser.ts#L44)); Suite imports `@trezor/connect` directly. `initAction` is stuck at its step 6 of 16, so steps 7-11 — backends, token definitions, fiat rates, `routerInit` — have not started either, and `Preloader` renders `InitialLoading` because `selectIsTransportInitialized` is `!!state.suite.transport` ([`suiteSelectors.ts:13`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/selectors/suite/suiteSelectors.ts#L13)) and `state.suite.transport` is only written by `TRANSPORT.START`/`TRANSPORT.ERROR` ([`suiteReducer.ts:146`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/suite/suiteReducer.ts#L146), [`:155`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/suite/suiteReducer.ts#L155)) — events `DeviceList` cannot emit because it does not exist yet.
- **Desktop:** `Core` lives in the Electron **main** process ([`suite-desktop-core/src/modules/trezor-connect.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts)), reached from the renderer over `ipc-proxy`. The renderer's `Preloader` gate is identical, so the same screen is held from the other side of the IPC boundary.
- **Native:** `Core` runs on the RN JS thread. `extraDependencies` sets `transportReconnect: false` ([`suite-native/state/src/extraDependencies.ts:125`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/extraDependencies.ts#L125), against `true` on web/desktop at [`packages/suite/src/support/extraDependencies.ts:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L94)), so `Core.init` additionally awaits `pendingConnection()` — the firmware fetch is charged _before_ a wait that is itself device-dependent.

After the fix the store has a complete, valid config before the first `await` in `Core.init` returns; transports come up at the speed of USB enumeration, and the remote refresh lands whenever it lands. Offline behaviour is unchanged, because offline already means "bundled config".

## Notes

- **The regression this can cause, and the reason the PR is bigger than the diff above.** `Device._updateFeatures` computes `_firmwareStatus` and `_firmwareReleaseConfigInfo` once per firmware-version change and stores them on the device ([`Device.ts:816-820`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L816)); they ride out to Suite inside `toMessageObject()` ([`:1097`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L1097)). A device that completes its handshake during the refresh window therefore gets its firmware verdict from the bundled config and **never recomputes it**, because the version did not change. If the remote config marks a release `required`, Suite would not raise the prerequisite screen ([`prerequisites.ts:107`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/suite/prerequisites.ts#L107)) for that session — a device stays on firmware a release note calls mandatory, and the user is told nothing until they replug or restart. **This is a correctness backstop, not polish: the PR must recompute the firmware info of already-connected devices when `remoteRefresh` resolves and emit `DEVICE.CHANGED`.** That part is not written above because it needs a decision I did not want to bury in a hunk — a new `Device` method that re-derives from the stored `features`, and a rule for what happens if the refresh lands mid-workflow (a `DEVICE.CHANGED` during firmware install or a signing flow is its own hazard). A reviewer who thinks that is too much surface for the win should reject this issue as written and ask for the narrower variant in the next note.
- **The narrower variant, if the recompute is judged too invasive.** Keep the bundled seed, and `await firmwareReleaseStore.getRemoteRefresh()` at the top of the device handshake instead of in `Core.init`. Then transports and the `TRANSPORT` event are prompt — which is what unblocks the Suite loader — and only a device that is actually plugged in waits, exactly as today. It fixes the app-render half of the problem and none of the device-detection half. It is strictly less valuable and strictly safer; say which one you want before anyone writes the PR.
- **Why there is no `requestIdleCallback` here, against F4.4's proposal.** `packages/connect` is shared code that runs on the RN JS thread, and the convention this whole issue set agrees on is that native code uses `InteractionManager.runAfterInteractions`, never `runWhenIdle`. Adding a platform split to `packages/connect` for this is more machinery than the win justifies — and the win would be small, because the refresh is latency-bound, not CPU-bound: its only main-thread work is one ES256 JWS verification and a `JSON.parse` of a small config ([`verifyAndDecodeJws`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L129)). Unawaiting it is the whole fix; scheduling it would be decoration. If someone measures that verification as a long task, that is a separate, later issue.
- **No cancellation, and `Core.dispose()` should get one.** `dispose()` aborts `this.abortController` ([`core/index.ts:934`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L934)) but `getFirmwareReleaseConfig` takes no signal, so a quick quit leaves up to thirteen in-flight requests and a promise that resolves into a disposed module. It is harmless today — the store is module-level state, not a Core field — but it is exactly the kind of thing that becomes a leak the moment the store gains a listener. Threading an `AbortSignal` through `getFirmwareReleaseConfig` and `getOnlineReleaseByPath` is a small follow-up and could reasonably be demanded in the same PR.
- **Unhandled rejection risk is currently nil, and that is load-bearing.** `remoteRefresh` has no `.catch` because neither `getFirmwareReleaseConfig` (bare `catch` at [`:170`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/utils/firmwareReleaseConfigUtils.ts#L170)) nor `initializeFirmwareConfig` (bare `catch` at [`firmwareInfo.ts:296`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts#L296)) can reject. That is an invariant a future edit could break silently; if a reviewer prefers a defensive `.catch`, add one — it costs nothing.
- **Tests.** `Core.test.ts` mocks `firmwareReleaseStore.init` and asserts `getOrInit` rejects when it throws ([`Core.test.ts:35-44`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/Core.test.ts#L35)); the mock throws synchronously, so it still passes — but note that under the After, a failure _inside the refresh_ no longer fails `Core.init`, which is the intended behaviour change and is worth a new test. Every other in-repo caller of `firmwareReleaseStore.init` already passes `onlyLocal: true` ([`firmwareInfo.test.ts:41`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.test.ts#L41), [`DeviceList.test.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/DeviceList.test.ts#L32), [`handshakeWorkflow.test.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/workflow/handshakeWorkflow.test.ts#L56), [`onCallFirmwareUpdate.test.ts:259`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/onCallFirmwareUpdate.test.ts#L259)) and takes the early-return branch, so their behaviour is byte-identical. `Core.init` itself is the only production call site, and it passes `false`.
- **Published-package impact.** `@trezor/connect` is published and exposes `./lib/*`, so `getRemoteRefresh` is an additive export on a deep-import path. No existing signature changes: `init` keeps its three parameters and its `Promise<void>` return. **The After has not been compiled.** The types read as sound — `getFirmwareReleaseConfig` resolves to `{ config: FirmwareReleaseConfig; isRemote: boolean }` at the destructuring site, and the `.then` callback's `void | undefined` collapses to `Promise<void>` — but check it.
- **What I deliberately did not change.** `Device._updateCurrentRelease` ([`Device.ts:762-784`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/device/Device.ts#L762)) is awaited inside the handshake and can itself fetch a release JSON with a 10 s timeout when the installed version is not among the bundled assets; that is device-connect latency of the same family and belongs in its own issue. `createRemoteFirmwareConfig` fetching two JSONs per model on every start, with no caching between starts, is the other obvious target — an HTTP cache or a persisted copy would make the refresh nearly free — and it is orthogonal to whether the fetch is awaited.
- **How this interacts with the rest of the set.** `p1-01` moves `routerInit` ahead of the rates work in `initAction`, and `p1-10` covers the native first-render gate on the same connect chain. This issue is upstream of both: while `connectInitThunk` is blocked at `initAction.ts:85`, neither of those reorderings can help. Landing them in either order is fine; landing this one first is what makes the others visible.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
