# `applicationInit` holds the suite-native splash screen until Connect and every backend has answered, with non-essential init in front of it

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_, whose premise is that work the user is not waiting for should not compete with work they are, and whose closing line is that React Native has neither `requestIdleCallback` nor `scheduler.yield` and `InteractionManager.runAfterInteractions` is its nearest lever. `applicationInit` is the native mirror of the web `initAction` gate, and it is stricter: the one flag that lets the app render anything at all is dispatched only after the whole Connect → fee-preload → backend-reconnect chain has settled, while analytics, the message-system config refresh, token definitions and WalletConnect bring-up are all dispatched in front of it.

## Where

[`suite-native/app-init/src/appInitThunks.ts:135`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L135) — `dispatch(setIsAppReady(true))`, reached only after the `await` at [`:131`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L131).

`setIsAppReady` has exactly two consumers, and one of them is the render gate. [`suite-native/app/src/App.tsx:86`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/App.tsx#L86) is `if (!isAppReady) return null;` — the entire component tree below `AppComponent` is nothing until the flag flips — and [`App.tsx:82`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/App.tsx#L82) only calls `SplashScreen.hideAsync()` once it has. So the user is looking at the Expo splash for the whole duration of the awaited chain.

What is awaited: [`appInitThunks.ts:131`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L131) awaits `postOnboardingInit`, which awaits `connectInitThunk` at [`:78`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L78) and then `initBlockchainThunk` at [`:85`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L85). That second one is a fan-out of network round trips: one `TrezorConnect.blockchainEstimateFee` per enabled non-hidden network ([`feesThunks.ts:34`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fees/feesThunks.ts#L34)) awaited at [`blockchainThunks.ts:127`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L127), then a `reconnectBlockchainThunk` per distinct account symbol awaited at [`blockchainThunks.ts:147`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L147). `selectIsOnboardingFinished` is true for every returning user, so this runs on every cold start.

The `catch` blocks at [`:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L79) and [`:86`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L86) swallow the error but not the wait — on a dead network the splash stays up for the full connect timeout.

In front of the flag, and none of it what the user opened the app for: `initAnalyticsThunk` at [`:124`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L124), `initMessageSystemThunk` at [`:125`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L125) (a remote JWS fetch and an async `verifyJws`, kicked off through a polling controller that re-arms every 3 min on mobile — [`messageSystemThunks.ts:146`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/messageSystemThunks.ts#L146), [`messageSystemConstants.ts:36`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/messageSystemConstants.ts#L36)), `periodicCheckTokenDefinitionsThunk` at [`:90`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L90) (a definitions download per enabled network per definition type, [`tokenDefinitionsThunks.ts:54`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L54)) and `walletConnectInitThunk` at [`:103`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L103) (`new Core(...)` plus `await WalletKit.init(...)` and a walk over every stored session and pending proposal, [`walletConnectThunks.ts:426`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/walletconnect/src/walletConnectThunks.ts#L426)).

The killswitch guard at [`:74`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L74) is **not** part of the defect and must not move. It is a genuine prerequisite — it is what stops a killswitched build from ever touching Connect — and this issue keeps it, and the `await prepareCachedEnvData()` at [`:117`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L117) that feeds it ([`cachedEnvData.ts:10`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/cachedEnvData.ts#L10)), ahead of the ready flag. See the Notes for the one ordering constraint that discovery exposed.

## Before

`postOnboardingInit`, [`appInitThunks.ts:72-104`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L72):

```ts
>(`${ACTION_PREFIX}/postOnboardingInit`, async (_, { dispatch, getState }) => {
    // Do not initialize Connect or anything else related to it, if there is an app-wide killswitch via message-system.
    const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
    if (activeKillswitchMessage) return;

    try {
        await dispatch(connectInitThunk()).unwrap();
    } catch (error) {
        console.error(`Connect init error: ${JSON.stringify(error)}`);
    }

    try {
        // Needs to be finished before any TrezorConnect.blockchain* calls.
        await dispatch(initBlockchainThunk()).unwrap();
    } catch (error) {
        console.error(`Blockchain init error: ${JSON.stringify(error)}`);
    }

    dispatch(periodicCheckTokenDefinitionsThunk());
    dispatch(initStakeDataThunk());

    dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'current',
            localCurrency: selectBaseCurrency(getState()),
        }),
    );

    // Create Portfolio Tracker device if it doesn't exist
    dispatch(createImportedDeviceThunk());

    dispatch(walletConnectInitThunk());
});
```

`applicationInit`, [`appInitThunks.ts:116-136`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L116):

```ts
>(`${ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    await prepareCachedEnvData();

    // apply the earn yield worker base url from debug settings (or the default for this build)
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());
    dispatch(initMessageSystemThunk());

    // Select latest remembered device or Portfolio Tracker device.
    dispatch(initDevices());

    if (selectIsOnboardingFinished(getState())) {
        await dispatch(postOnboardingInit());
    }

    // Tell the application to render
    dispatch(setIsAppReady(true));
});
```

## After

```ts
>(`${ACTION_PREFIX}/postOnboardingInit`, async (_, { dispatch, getState }) => {
    // Do not initialize Connect or anything else related to it, if there is an app-wide killswitch via message-system.
    const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
    if (activeKillswitchMessage) return;

    try {
        await dispatch(connectInitThunk()).unwrap();
    } catch (error) {
        console.error(`Connect init error: ${JSON.stringify(error)}`);
    }

    try {
        // Needs to be finished before any TrezorConnect.blockchain* calls.
        await dispatch(initBlockchainThunk()).unwrap();
    } catch (error) {
        console.error(`Blockchain init error: ${JSON.stringify(error)}`);
    }

    dispatch(initStakeDataThunk());

    dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'current',
            localCurrency: selectBaseCurrency(getState()),
        }),
    );

    // Create Portfolio Tracker device if it doesn't exist
    dispatch(createImportedDeviceThunk());

    // Neither is on the way to the first screen: definitions re-arm on their own timer and
    // WalletConnect only matters once a dapp pairs.
    InteractionManager.runAfterInteractions(() => {
        dispatch(periodicCheckTokenDefinitionsThunk());
        dispatch(walletConnectInitThunk());
    });
});
```

```ts
>(`${ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    // Caches the OS version that message-system decisions read synchronously, killswitch included.
    await prepareCachedEnvData();

    // apply the earn yield worker base url from debug settings (or the default for this build)
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());

    // Select latest remembered device or Portfolio Tracker device. Also the action that makes
    // messageSystemMiddleware recompute validMessages, so it has to stay ahead of the killswitch guard.
    dispatch(initDevices());

    // Not awaited. The killswitch guard and the Connect/blockchain chain keep their order inside,
    // but the store is already rehydrated, so the portfolio can be painted before the backends answer.
    if (selectIsOnboardingFinished(getState())) {
        dispatch(postOnboardingInit());
    }

    // Tell the application to render
    dispatch(setIsAppReady(true));

    // Only the config refresh is deferred - the killswitch above is decided from the persisted config.
    InteractionManager.runAfterInteractions(() => {
        dispatch(initMessageSystemThunk());
    });
});
```

Plus `import { InteractionManager } from 'react-native';` at the top of the file, and `react-native` added to `@suite-native/app-init`'s dependencies — the package does not declare it today and `depcheck` runs in CI.

`initAnalyticsThunk` stays where it is, in front of the ready flag, contrary to the raw finding. It is fully synchronous, does no I/O, and `useReportAppInitToAnalytics` reports `appReadyEvent` off the flag — deferring it would drop that event and log an error. See Notes.

## Why it matters

The user has just tapped the app icon and is looking at the splash screen. Nothing else is on screen: `App.tsx:86` renders `null`, so there is no skeleton, no shell and no navigation until `setIsAppReady(true)` lands.

Everything needed to paint the first screen is already in the store by then. `StorageProvider` wraps the whole tree in a `PersistGate` ([`StorageProvider.tsx:15`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/storage/src/StorageProvider.tsx#L15)), so MMKV rehydration of accounts, transactions and settings has completed before `AppComponent` mounts and before [`App.tsx:75`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/App.tsx#L75) dispatches `applicationInit` at all. The portfolio the user is waiting to see is sitting in memory while the splash is up.

What the splash is actually waiting for is network latency, not CPU. n is two user-controlled collections — the enabled non-hidden networks driving the fee fan-out, and the distinct account symbols driving the reconnect fan-out — and each element is a real round trip whose upper bound is a connect/websocket timeout. A user who has enabled more coins waits longer; a user on a bad connection waits for the timeout; a user with one unreachable altcoin backend waits for that backend. None of it is bounded by anything the app controls, and none of it is needed to render a cached balance.

After the fix, the same work still starts at the same moment — only the `await` in front of the render gate goes. `setIsAppReady(true)` is then gated on `prepareCachedEnvData()`, the earn-worker URL assignment, `initAnalyticsThunk` and `initDevices`, all of which are local and synchronous apart from the first.

What the user sees change: the portfolio appears while coins still show as connecting, instead of not appearing until the last backend answers. Balances and transaction lists come from the rehydrated store and are refreshed by `BLOCKCHAIN.CONNECT` → account sync exactly as they are today, just after the app is on screen rather than before. Analytics keeps its current timing; the message-system config refresh, token definitions and WalletConnect land after the first interactions instead of in front of them.

## Notes

- **The `After` hunks have not been compiled.** They are written against the surrounding types by reading. The only call-site change outside this file is the `react-native` dependency; `useExitOnboardingFlow.ts:15` already dispatches `postOnboardingInit` without awaiting it, so the onboarding-exit path is unaffected.
- **`InteractionManager` is a deprecated stub on the pinned React Native, and this is the biggest reason to push back on half of this issue.** `yarn.lock` resolves `react-native@npm:0.85.3`, whose `Libraries/Interaction/InteractionManager.js` exports `InteractionManagerStub`: every member carries `@deprecated`, `runAfterInteractions` is a bare `setImmediate` with a `clearImmediate` cancel, `createInteractionHandle()` returns `-1`, `clearInteractionHandle` does nothing and `setDeadline` is a no-op. It does **not** wait for touches or animations any more. So what the wrapper buys here is a task boundary and nothing else, and the `{ timeout: 2000 }` safety net the skill mandates for `requestIdleCallback` is pointless — `setImmediate` always fires. A reviewer may reasonably ask for `setImmediate` written directly, or for the deferral to be dropped entirely and only the re-ordering taken. **The re-ordering is where the win is; the `InteractionManager` half is close to cosmetic on this RN version.** The skill's own claim that `runAfterInteractions` is RN's idle lever should be corrected alongside.
- **First call site in the repo, so the pattern is worth stating.** `runAfterInteractions` returns a cancellable handle — `const interaction = InteractionManager.runAfterInteractions(fn)` with `interaction.cancel()` — and any use inside a component must cancel in the effect cleanup, otherwise the callback runs against an unmounted tree. Here the handles are deliberately dropped: `applicationInit` is dispatched once from a `useEffect` guarded by `isApplicationInitDispatchedRef` ([`App.tsx:67`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/App.tsx#L67)) and the app root never unmounts, so there is nothing to cancel against. If someone copies this into a screen hook, the handle must be kept.
- **Do not defer `initAnalyticsThunk`, and the raw finding was wrong to suggest it.** `useReportAppInitToAnalytics` computes `loadDuration` when `isAppReady` flips ([`useReportAppInitToAnalytics.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/hooks/useReportAppInitToAnalytics.ts#L45)) and reports `appReadyEvent` a render later ([`:51`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/hooks/useReportAppInitToAnalytics.ts#L51)). Native's analytics instance is constructed without `useQueue` ([`createAnalytics.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/analytics/src/createAnalytics.ts#L15)), and `report()` with no `instanceId`/`sessionId`/`url` takes the branch at [`analytics.ts:111`](https://github.com/trezor/trezor-suite/blob/develop/packages/analytics-uploader/src/analytics.ts#L111), logs `console.error` at [`:119`](https://github.com/trezor/trezor-suite/blob/develop/packages/analytics-uploader/src/analytics.ts#L119) and drops the event. Deferring the init would therefore lose the app-ready event **and** add Sentry noise, since `console.error` is captured. The thunk is synchronous and does no I/O, so deferring it buys nothing anyway.
- **`loadDuration` will step down, and that is a metric change, not a regression.** The number reported in `appReadyEvent` is `Date.now() - APP_STARTED_TIMESTAMP` at the moment the flag flips, so after this change it measures rehydration-to-render rather than rehydration-to-backends-connected. Whoever watches that dashboard should be told; otherwise it looks like an unexplained improvement, and the old quantity stops being recorded anywhere.
- **`initDevices()` must stay ahead of `postOnboardingInit`, and this constraint is load-bearing and undocumented today.** `selectActiveKillswitchMessage` reads `state.messageSystem.validMessages` ([`messageSystemSelectors.ts:217`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/messageSystemSelectors.ts#L217) via [`:205`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/messageSystemSelectors.ts#L205)), which is **not** in the persisted whitelist ([`messageSystemReducer.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/message-system/src/messageSystemReducer.ts#L32) — only `config`, `currentSequence`, `dismissedMessages`, `configSource`). It is recomputed by `messageSystemMiddleware` ([`messageSystemMiddleware.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/message-system/src/messageSystemMiddleware.ts#L31)) on a short list of actions, one of which is `deviceActions.selectDevice` — dispatched synchronously by `initDevices` → `selectDeviceThunk` ([`selectDeviceThunk.ts:48`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/selectDeviceThunk.ts#L48), reached from [`deviceThunks.ts:257`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/device/deviceThunks.ts#L257) because `selectedDevice` is not persisted). The `After` preserves that order deliberately. Worth auditing separately: on a cold start where no device is selected and no other trigger action fires, the guard reads an empty `validMessages` — pre-existing, not introduced here, and out of scope for a scheduling issue.
- **Deferring the message-system refresh cannot weaken the killswitch, and I checked rather than assumed.** `initMessageSystemThunk` is already dispatched without an `await` today, and `fetchConfigThunk` does a remote fetch and an async `verifyJws` before it can dispatch `fetchSuccessUpdate` — so it can never have landed by the time line 131 evaluates the guard. The guard is decided from the persisted config in both the old and the new ordering. What does change: a killswitch published since the last launch takes effect a beat later, so `KillswitchMessageScreen` ([`KillswitchMessageScreen.tsx:60`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/message-system/src/components/KillswitchMessageScreen.tsx#L60)) covers the app a beat later. It still covers it — the screen subscribes to the selector and is rendered last, over everything — and `TrezorConnect.dispose()` still fires from its effect. If a reviewer thinks even that window is too wide, keep `initMessageSystemThunk` on the fast path and take only the render gate and the `postOnboardingInit` tail.
- **Screens now mount before Connect is initialised, and this is the risk to review.** Device detection, `TrezorConnect.blockchain*` calls and the discovery middleware all key off actions that arrive asynchronously anyway, so they should tolerate it — but I verified that by reading the init path, not by exercising every screen. Anything that assumes "Connect exists by the time a screen renders" is what this change breaks, and finding it is the reviewer's job as much as mine.
- **Detox fixtures may need a different signal.** `suite-native/app/e2e` preloads state through `launchArguments.preloadedState` ([`App.tsx:62`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/App.tsx#L62)) and asserts against the post-splash screen. There are no unit tests on `appInitThunks.ts` at all, so nothing there breaks; `useExitOnboardingFlow.test.ts` and `BiometricsScreen.test.tsx` both stub `postOnboardingInit` out and are unaffected.
- **Overlaps with two sibling issues, deliberately not merged.** [`p1-02`](p1-02-initblockchainthunk-awaits-a-handshake-to-every-coin-backend.md) removes the awaits _inside_ `initBlockchainThunk`, which shortens the same chain for both apps; if it lands first, this issue's win shrinks but does not disappear, because `connectInitThunk` is still awaited in front of the gate. [`p1-11`](p1-11-mmkv-persist-rewrites-the-whole-wallet-per-state-change.md) is the other half of the same boot on the same JS thread — this issue makes the app render sooner, `p1-11` keeps the persistoid from eating the frames right after.
- **Deliberately not changed:** `initStakeDataThunk`, `periodicFetchFiatRatesThunk` and `createImportedDeviceThunk` stay on the `postOnboardingInit` fast path — rates feed the first screen and the Portfolio Tracker device is what a tracker-only user's first screen is _about_. The two `try/catch` blocks and their `console.error` calls are left alone; they are Sentry-captured today and this issue does not change how often they fire.
- **No published-package impact.** `@suite-native/app-init` is `private: true`, as is everything else touched. No `@trezor/utils` helper is involved: `runWhenIdle` is explicitly not for native code, per the agreed split.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
