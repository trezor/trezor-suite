# `initBlockchainThunk` holds app init until every coin backend has handshaked and fee levels are preloaded

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_, whose premise is that work the user is not waiting for should not compete with work they are. `initBlockchainThunk` contains two `await`s over work nobody is waiting for at boot, and both call sites (web/desktop `initAction` and native `postOnboardingInit`) await the thunk before the app is usable. Connecting to the backends eagerly is right; blocking init until all of them have resolved is the defect.

## Where

[`suite-common/wallet-core/src/blockchain/blockchainThunks.ts:127`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L127) and [`suite-common/wallet-core/src/blockchain/blockchainThunks.ts:148`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L148)

Line 127 awaits `preloadFeeInfoThunk`, which fans out one `TrezorConnect.blockchainEstimateFee({ request: { feeLevels: 'preloaded' } })` per **enabled network** — the user's coin settings, not their accounts ([`feesThunks.ts:34`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fees/feesThunks.ts#L34)). Line 148 awaits a fan-out of `reconnectBlockchainThunk` over the distinct network symbols of **every persisted account of every remembered wallet** ([`blockchainThunks.ts:140`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L140)); that thunk calls `blockchainUnsubscribeFiatRates`, whose `run()` opens the real backend websocket via `initBlockchain` ([`packages/connect/src/api/blockchainUnsubscribeFiatRates.ts:48`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/blockchainUnsubscribeFiatRates.ts#L48)).

Both fan-outs are internally concurrent — `blockchainEstimateFee` and `blockchainUnsubscribeFiatRates` are both on the connect blacklist ([`suite-common/connect-init/src/blacklist.ts:11`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/connect-init/src/blacklist.ts#L11), [`:17`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/connect-init/src/blacklist.ts#L17)), so they bypass the `getSynchronize()` wrapper at [`connectInitThunks.ts:152`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/connect-init/src/connectInitThunks.ts#L152), and methods with `useDevice = false` run immediately instead of queueing for the device ([`packages/connect/src/core/index.ts:248`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L248)). The cost is therefore the **slowest** member of each fan-out, not the sum — but that is exactly what the `await` charges to boot.

The two awaiting call sites: [`packages/suite/src/actions/suite/initAction.ts:93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L93) (step 7, six steps before `routerInit()` un-gates the full-page loader at [`Preloader.tsx:109`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L109)) and [`suite-native/app-init/src/appInitThunks.ts:85`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L85) (awaited by `applicationInit` before `setIsAppReady(true)`).

## Before

```ts
>(`${BLOCKCHAIN_MODULE_PREFIX}/initBlockchainThunk`, async (_, { dispatch, getState }) => {
    await dispatch(preloadFeeInfoThunk());

    // Load custom blockbook backend
    const blockchain = selectBlockchainState(getState());
    const backends = getCustomBackends(blockchain);
    await setBackendsToConnect(backends);

    const accounts = selectAccounts(getState());
    if (accounts.length <= 0) {
        // continue suite initialization
        return;
    }

    const symbols: NetworkSymbol[] = [];
    accounts.forEach(a => {
        if (!symbols.includes(a.symbol)) {
            symbols.push(a.symbol);
        }
    });

    const promises = symbols.map(symbol => dispatch(reconnectBlockchainThunk({ symbol })));
    await Promise.all(promises);

    dispatch(reportWalletBalanceThunk());

    // continue suite initialization
});
```

## After

```ts
>(`${BLOCKCHAIN_MODULE_PREFIX}/initBlockchainThunk`, async (_, { dispatch, getState }) => {
    // Load custom blockbook backend
    const blockchain = selectBlockchainState(getState());
    const backends = getCustomBackends(blockchain);
    await setBackendsToConnect(backends);

    // Fee levels are only read by the send, RBF, staking and trading forms, and every one of them
    // refetches on mount, so init must not wait for them.
    dispatch(preloadFeeInfoThunk());

    const accounts = selectAccounts(getState());
    if (accounts.length <= 0) {
        // continue suite initialization
        return;
    }

    const symbols: NetworkSymbol[] = [];
    accounts.forEach(a => {
        if (!symbols.includes(a.symbol)) {
            symbols.push(a.symbol);
        }
    });

    // Connect eagerly but do not wait for the handshakes. BLOCKCHAIN.CONNECT and BLOCKCHAIN.ERROR
    // drive the per-coin state, so one unreachable backend must not hold up the rest of init.
    symbols.forEach(symbol => dispatch(reconnectBlockchainThunk({ symbol })));

    dispatch(reportWalletBalanceThunk());

    // continue suite initialization
});
```

`setBackendsToConnect` stays awaited: it is the only part of the thunk that later `TrezorConnect.blockchain*` calls depend on, which is what the comment at [`appInitThunks.ts:84`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L84) is protecting.

## Why it matters

The user has just opened Suite and is looking at the full-page `InitialLoading` spinner (web/desktop) or the pre-render splash (native). Nothing — dashboard, coin list, settings — is reachable until `init()` reaches `routerInit()`, and this thunk is six steps in front of it.

For the reconnect fan-out, n is the number of distinct networks the user holds accounts on, which grows with the wallets they remember and the coins they enable. Each element is a websocket `connect()` plus `getInfo()`, and per coin the worker walks its URL list serially, falling back on failure ([`packages/blockchain-link/src/workers/baseWorker.ts:112`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/baseWorker.ts#L112)) with a per-URL connection timeout that defaults to 20 s ([`packages/websocket-client/src/client.ts:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/websocket-client/src/client.ts#L20)). A rejected thunk does not short-circuit the `Promise.all` — `createThunk` is RTK's `createAsyncThunk`, so `dispatch(...)` resolves with a rejected action rather than rejecting — so init waits for the failing coin to exhaust its fallbacks. Boot latency is therefore proportional to the worst backend the user holds a coin on, times that coin's URL-list length, and a single unreachable altcoin backend gates the entire app. The standing TODO at [`Preloader.tsx:110`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L110) — the spinner timeout raised to `90 * 5` seconds because "initActions incorrectly awaits altcoin specific logic" — is the same symptom, written down by someone else.

For the fee preload, n is the enabled-coin list, bounded by the network catalogue rather than by user data, and the per-element cost is much smaller than the scan assumed (see Notes). It is included here because it is the same thunk and the same PR, not because it is the larger half.

After the fix, both fan-outs still start at exactly the same moment; only the awaits go. The per-coin state keeps converging on its own, because `BLOCKCHAIN.CONNECT` and `BLOCKCHAIN.ERROR` are dispatched into the store from `blockchainMiddleware` and drive subscription and sync per coin ([`blockchainMiddleware.ts:25`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainMiddleware.ts#L25)). What the user sees change: the app appears while some coins still show as connecting, instead of the app not appearing at all until the last one answers.

## Notes

- **The `After` hunk has not been compiled.** It is written against the surrounding types by reading. It touches one file; neither call site needs editing, since both simply resolve sooner. `initAction.ts:93` already ends in `.catch(err => console.error(err))`.
- **No `runWhenIdle` here, deliberately.** `suite-common/wallet-core` is shared with React Native, which has no `requestIdleCallback`, and the agreed rule is that native code uses `InteractionManager.runAfterInteractions` instead. Pushing these two dispatches into an idle callback would mean injecting a platform scheduler through the thunk's extra dependencies; that is a bigger change than this issue proposes, and dropping the awaits already removes the gate. A reviewer who wants the idle callback as well should ask for the dependency injection explicitly.
- **The scan's "latent correctness fix" claim for the fee preload does not hold, and I checked.** `blockchainEstimateFee` only calls `initBlockchain` when `request.feeLevels === 'smart'`; for `'preloaded'` it returns the fee constants from the bundled JSON via `getOrInitFeeLevels` without touching a backend ([`blockchainEstimateFee.ts:84`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/blockchainEstimateFee.ts#L84)). So `preloadFeeInfoThunk` does **not** connect to the default backend ahead of the user's custom one, and moving it after `setBackendsToConnect` is ordering-neutral rather than a fix. It is moved anyway because it is free and because it keeps the "custom backends first" invariant if `'preloaded'` ever gains I/O.
- **Honest sizing of the fee half: small, and unmeasured.** Once the `'preloaded'` path does no network I/O, the awaited cost is n connect-core round trips (postMessage to the iframe on web, IPC to the main process on desktop) plus JSON fee-level construction. Method _selection_ is serialised by `methodSynchronize` ([`core/index.ts:210`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L210)) even though `run()` is not, so the fan-out is not perfectly parallel — but this is nowhere near the websocket half, and a reviewer could reasonably ask to keep line 127 awaited and take only the reconnect change.
- **Fee info is not persisted.** `feesReducer` starts from `{}` every boot ([`feesReducer.ts:21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fees/feesReducer.ts#L21)), so deferring the preload widens the window in which `state.wallet.fees[symbol]` is `undefined`. Most consumers are forms that call `updateFeeInfoThunk` on mount via `useFetchFeesOnce`/`useRefetchFees`, but [`transactionsThunks.ts:425`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L425) reads `rawFeeInfo!.blockTime` behind a non-null assertion. That path runs after a send, so a form has already fetched — but it is an assertion, not a check, and it should be audited as part of this PR.
- **`reportWalletBalanceThunk` moves ahead of the handshakes, and this is less of a change than it looks.** It is debounced leading + trailing over 5 minutes and reads the store when it fires ([`accountBalanceAnalytics.ts:26`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountBalanceAnalytics.ts#L26)), and it is dispatched again on every account refresh ([`accountsThunks.ts:320`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsThunks.ts#L320)). Today's awaited version does not report fresher balances either: `Promise.all` resolves when the sockets are up, while the actual refresh happens later, in `onBlockchainConnectThunk` → `syncAccountsWithBlockchainThunk`. If a reviewer still wants the original timing, `Promise.all(...).then(() => dispatch(reportWalletBalanceThunk()))` preserves it at the cost of a floating chain.
- **Two existing tests will fail and must be updated, not deleted.** [`packages/suite/src/actions/suite/initAction.test.ts:146`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L146) asserts a strictly ordered action list (`toEqual` at [`:366`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L366)) in which `preloadFeeInfoThunk.fulfilled` precedes `initBlockchainThunk.fulfilled`; that ordering is exactly what this change removes. All three `init` fixtures in [`packages/suite/src/actions/wallet/__fixtures__/blockchainActions.ts:447`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/__fixtures__/blockchainActions.ts#L447) assert that `feesActions.updateMultipleFees` was dispatched by the time the thunk resolves, so they need a promise flush after the dispatch at [`blockchainActions.test.ts:122`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/blockchainActions.test.ts#L122). Both are the correct place to encode the new contract: init resolves without waiting for either fan-out.
- **No cancel path, before or after.** If the store is torn down mid-init (reload, killswitch, wallet forgotten), the in-flight reconnects and the fee preload still land. That is already true today for everything behind `BLOCKCHAIN.CONNECT`; this change does not make it worse, but it does not fix it either.
- **Deliberately not changed:** the `symbols` dedupe loop at [`:140`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L140) uses `includes` inside `forEach` and is quadratic; that belongs to the `performance-complexity` sweep, and `arrayDistinct` is already imported in this file if someone wants it in a separate PR. The native gate itself — `applicationInit` awaiting `postOnboardingInit` before `setIsAppReady(true)` — is owned by `p1-10`; this issue only makes the awaited chain shorter for both apps.
- **Where a reviewer should push back:** anything downstream that assumes "backends are connected once Suite is ready". Nothing found while reading, and `reconnectBlockchainThunk` can already reject today so such a consumer would already be broken — but this was verified by reading the blockchain slice and its middleware, not by exercising every coin flow.
- `@suite-common/wallet-core` is private and not published, so there is no external API surface here; the change is visible to web, the Electron renderer and the React Native JS thread alike.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
