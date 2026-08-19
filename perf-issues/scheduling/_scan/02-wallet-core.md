# Area 2 — wallet-core thunks, reducers and middleware

Scanned: suite-common/wallet-core/src/discovery/ (discoveryThunks.ts, discoveryActions.ts, discoveryReducer.ts, selectDeviceThunk.ts, passphraseWalletThunks.ts), suite-common/wallet-core/src/accounts/ (accountsThunks.ts, accountsMiddleware.ts, accountsReducer.ts, accountsInfoAnalytics.ts, accountBalanceAnalytics.ts), suite-common/wallet-core/src/transactions/ (transactionsThunks.ts, transactionsReducer.ts, transactionsSelectors.ts), suite-common/wallet-core/src/blockchain/ (blockchainThunks.ts, blockchainMiddleware.ts, blockchainActions.ts), suite-common/wallet-core/src/fiat-rates/ (fiatRatesThunks.ts, fiatRatesMiddleware.ts), suite-common/wallet-core/src/fees/ (feesThunks.ts, hooks/useRefetchFees.ts), suite-common/wallet-core/src/stake/ (stakeThunks.ts, stakeMiddleware.ts), suite-common/wallet-core/src/device/ (deviceThunks.ts), packages/suite/src/middlewares/suite/** (analyticsMiddleware, sentryMiddleware, logsMiddleware, eventsMiddleware, suiteMiddleware, messageSystemMiddleware, buttonRequestMiddleware, redirectMiddleware, protocolMiddleware, toastMiddleware), packages/suite/src/middlewares/wallet/** (walletMiddleware, storageMiddleware, graphMiddleware, tradingMiddleware, replaceByFeeErrorMiddleware), packages/suite/src/middlewares/onboarding/**. Corroborating reads outside the area (trigger/consumer only, not anchored): packages/suite/src/actions/suite/initAction.ts, packages/suite/src/components/suite/Preloader/Preloader.tsx, suite-native/app-init/src/appInitThunks.ts, suite/router/src/routerReducer.ts, packages/analytics-uploader/src/{analytics,utils}.ts, suite-common/wallet-utils/src/fiatRatesUtils.ts, packages/suite/src/actions/wallet/graphActions.ts.
Findings: 5

## F2.1 — Stop `updateMissingTxFiatRatesThunk` rescanning every persisted transaction in one task; chunk it into idle callbacks

- **Anchor:** `suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:339` (also `suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:77` and `packages/suite/src/actions/suite/initAction.ts:115` — the two call sites that pass no `accountKey`)
- **Class:** non-essential
- **Platform:** web (packages/suite, so also the Electron renderer; the middleware path is `!isNative()`-gated and suite-native only ever calls this scoped to one `accountKey`)
- **What grows:** n = every transaction of every account of every remembered wallet in the store. Called without `accountKey`, `selectTransactionsWithMissingRates` walks `state.wallet.transactions` whole: for each account it maps its token contracts into a `Set`, then for each tx builds a fiat-rate key string, rounds the timestamp, does a two-level record lookup, and loops the tx's token transfers doing the same again. Nothing caps it — a user with 20 accounts × several hundred txs is in the tens of thousands of iterations, and it grows every time history is fetched. The `forEach` then dispatches one `updateTxsFiatRatesThunk` per account, and _that_ thunk's synchronous prefix (before its first `await`) maps the account's full tx list to timestamps, filters, rounds and de-duplicates them — so the per-account work also lands inside the same task.
- **When it runs:** (a) app start, `initAction.ts` step 10, **awaited**; (b) every time `fetchAllTransactionsForAccountThunk` settles — i.e. whenever the user opens an account's transaction list and it finishes paging; (c) on base-currency change (`fiatRatesMiddleware.ts:91`).
- **Blocking-what:** At startup, first paint. `Preloader.tsx:109` keeps the full-page loader up until `router.loaded`, and `router.loaded` is only set by `routerLocationChange`, which `initAction` dispatches at step 11 — _after_ awaiting this thunk at step 10. So the user is staring at the spinner. On path (b) the user is looking at the transaction list they just opened, and the scan covers all the _other_ accounts too, which is work they are not waiting for at all. Historic fiat rates are pure backfill: rows render with a placeholder until the rates arrive.
- **Before:**

```ts
export const updateMissingTxFiatRatesThunk = createThunk<
    void,
    UpdateMissingTxFiatRatesThunkParams,
    { state: UpdateMissingTxFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/updateMissingTxRates`,
    ({ localCurrency, accountKey }, { dispatch, getState }) => {
        const transactionsWithMissingRates = selectTransactionsWithMissingRates(
            getState(),
            localCurrency,
            accountKey,
        );

        transactionsWithMissingRates.forEach(({ account, txs }) => {
            dispatch(
                updateTxsFiatRatesThunk({
                    accountKey: account.key,
                    txs,
                    baseCurrencyCode: localCurrency,
                }),
            );
        });
    },
);
```

- **Proposed fix:** Two levers, both needed. First, drop the `await` at `initAction.ts:115` and schedule the whole thunk in `requestIdleCallback(..., { timeout: 5000 })` behind a web `setTimeout` fallback (Safari has no rIC) — a 5 s timeout because this is pure backfill and nothing on screen depends on it, so it should lose every race against first paint but still run on a busy machine. Second, make the thunk itself yield: it is currently a synchronous thunk body, so it needs restructuring into an `async` body that walks `transactionsWithMissingRates` in batches of ~5 accounts and `await yieldToMain()` between batches, so the per-account synchronous prefixes are spread across tasks instead of one. Batch of 5 keeps each task well under 50 ms for typical account sizes while not multiplying the number of tasks needlessly. The heavy part before the loop — `selectTransactionsWithMissingRates` itself — cannot be chunked without restructuring the selector, so scheduling the _whole_ call in an idle callback is the part that matters most.
- **Risk / ordering:** The inner `updateTxsFiatRatesThunk` dispatches are already fire-and-forget (the outer thunk never awaits them), so yielding between them changes nothing observable about completion order — rates already land in whatever order the network returns them. The reducer merges by ticker+timestamp key, so interleaving is safe. Re-entrancy is the real risk: on the transaction-list path the middleware can fire this again while a previous chunked run is still walking, doubling the requests; guard with a single-flight token or use `createSingleInstanceThunk` (already used elsewhere in `transactionsThunks.ts`) so a newer run cancels the older. There is no cancel path today. Also note `storageMiddleware.ts:196` reacts to each `updateTxsFiatRatesThunk.fulfilled` by deleting and rewriting _all_ of that account's historic rates — spreading the fulfilments over time is strictly better for that too.
- **Confidence:** high — the selector, both unscoped call sites, and the `router.loaded`/Preloader gating were all read directly.
- **Priority:** P1

## F2.2 — Stop firing one analytics event per account synchronously when discovery completes

- **Anchor:** `suite-common/wallet-core/src/discovery/discoveryThunks.ts:284` (identical loop repeated at `suite-common/wallet-core/src/discovery/discoveryThunks.ts:788` in `runAdditionalDiscoveryThunk`)
- **Class:** non-essential
- **Platform:** shared (both `completeDiscovery` and `runAdditionalDiscoveryThunk` are reached from packages/suite and suite-native)
- **What grows:** n = every account of the just-discovered wallet — coins × account types × discovered indices. Unbounded in practice: enabling many networks and having used several accounts per network puts this in the dozens to low hundreds. Per iteration `reportAccountInfoThunk` runs a full RTK thunk dispatch through the entire middleware chain, computes `getAccountInfoAnalyticsPayload` (BigNumber staking-balance math, `getAccountAnalyticsTokenSymbols` over the account's token list cross-referenced against token definitions, `getStakingProvidersForAnalytics`), does a linear `getTradedAccountKeys().includes(account.key)` scan, and — via `Analytics.report` (packages/analytics-uploader/src/analytics.ts:102) — builds a query string and calls `fetch()`. So it is n dispatches **and** n outbound HTTP requests in one uninterruptible task.
- **When it runs:** the instant discovery finishes — `completeDiscovery` is called from `runDiscoveryThunk`, and the same loop again at the end of `runAdditionalDiscoveryThunk`.
- **Blocking-what:** The user has just plugged in / unlocked their Trezor and is waiting for the account list and balances to appear. This task runs in the same tick as `discoveryActions.updateDiscovery({ status: 'complete' })`, i.e. exactly the render that flips the wallet out of its loading state. Clicks on the freshly-appeared accounts queue behind it.
- **Before:**

```ts
const completeDiscovery = (
    devicePath: DeviceUniquePath,
    deviceState: TrezorDeviceWithState['state'],
    { dispatch, fetchAndSaveMetadata, getState }: {/* ... */},
) => {
    dispatch(discoveryActions.updateDiscovery({ status: 'complete' }, devicePath));
    dispatch(fetchAndSaveMetadata(deviceState.staticSessionId));
    dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, true));

    dispatch(reportWalletBalanceThunk());

    selectAccountsByDeviceState(getState(), deviceState.staticSessionId).forEach(account =>
        dispatch(reportAccountInfoThunk(account.key)),
    );
};
```

- **Proposed fix:** Wrap the `forEach` in `requestIdleCallback(..., { timeout: 2000 })` on web/desktop (behind a shared `runWhenIdle` helper with a `setTimeout` fallback for Safari) and `InteractionManager.runAfterInteractions` on native — this is telemetry, nobody is waiting for it, and a 2 s timeout guarantees delivery before the user can realistically navigate away. If the whole batch still measures long once deferred, additionally chunk it 20 accounts at a time with `await yieldToMain()` between chunks, since 20 `fetch()` starts per task is roughly where the browser's per-host queue absorbs it anyway. `completeDiscovery` is a plain synchronous helper, so chunking means turning it (or just an extracted `reportDiscoveredAccounts`) into an async function; the callers ignore its return value, so that is a safe change. Note the guard inside `reportAccountInfoThunk` that skips accounts whose token definitions have not loaded — deferring makes that guard _more_ likely to pass, which is a bonus, not a regression.
- **Risk / ordering:** No observable ordering dependency — analytics events carry their own timestamp (`Analytics.report` stamps `data.timestamp` at call time), so stamping happens later but stays monotonic; if exact event time matters, capture `Date.now()` before deferring and pass it through. There is no cancel path: if the user forgets the device or discovery restarts before the idle callback fires, the loop would report accounts that have since been removed — `reportAccountInfoThunk` already re-reads the account via `selectAccountByKey` and bails when it is gone, so this degrades to a no-op rather than a crash, but the pending callback id should still be cancelled on `cancelDiscoveryThunk`. Deferring past a re-render is safe because the loop re-reads from the store, not from a captured array, if the `selectAccountsByDeviceState` call is moved inside the callback (it should be).
- **Confidence:** high — read the loop, `reportAccountInfoThunk`, `getAccountInfoAnalyticsPayload`, and confirmed `Analytics.report` reaches `fetch()` synchronously.
- **Priority:** P1

## F2.3 — Chunk the discovery `accountQueue` drain, or the whole batch's middleware fan-out lands in one task (named-in-skill)

- **Anchor:** `suite-common/wallet-core/src/discovery/discoveryThunks.ts:468`
- **Class:** long-task
- **Platform:** shared
- **What grows:** n = the accounts buffered before the first non-empty account is seen. Bounded only by how many empty accounts Connect walks before it finds a funded one — for a wallet with many enabled networks that is every account of every network up to the first hit, and on the final progress event (`event.progress === 100`) the queue drains whatever is left. Crucially each `createAccount` is not one reducer write: `walletMiddleware.ts:43` turns it into an `addTransaction` dispatch carrying that account's whole first history page, `walletMiddleware.ts:56` into a `subscribeBlockchainThunk`, `fiatRatesMiddleware.ts:32` into two `fetchFiatRatesThunk` dispatches plus `fiatRatesMiddleware.ts:113` into an `updateFiatRatesThunk` for every one of the account's tokens, `fiatRatesMiddleware.ts:50` (via the nested `addTransaction`) into an `updateTxsFiatRatesThunk`, and `storageMiddleware.ts:108`/`:170` into `saveAccounts` + `removeAccountTransactions` + `saveAccountTransactions` IndexedDB writes. So one queue drain of k accounts is ~7k dispatches through the full middleware chain, all synchronous.
- **When it runs:** inside the `BUNDLE_PROGRESS` handler during discovery, on the tick where the first non-empty account arrives or on the last progress event.
- **Blocking-what:** the same moment as F2.2 — the user is waiting for their wallet to appear after unlocking the device, and the progress bar itself cannot advance while this runs.
- **Before:**

```ts
// first non-empty account encountered right now or the last event, create all enqueued accounts first
if (!currentDiscovery.hasLoadedAnyNonEmptyAccount) {
    if (isAddingHiddenWallet && discoveryPayload.hasLoadedAnyNonEmptyAccount) {
        dispatch(applyDeviceStatesThunk({/* ... */}));
    }

    accountQueue.forEach(account => dispatch(accountsActions.createAccount(account)));
    accountQueue.splice(0, accountQueue.length);
}
dispatch(accountsActions.createAccount(accountPayload));
```

- **Proposed fix:** Exactly the skill's prescription — drain in batches of ~25 with an unconditional `await yieldToMain()` between batches. The complication is that `onBundleProgress` is a **synchronous** Connect event handler, so it cannot itself await: extract the drain into an async helper, kick it off without awaiting, and keep a `draining` flag so a later progress event does not start a second concurrent drain (it should push onto the same queue instead). Batch 25 is right here precisely _because_ of the fan-out above — 25 accounts is already ~175 dispatches plus IndexedDB writes per task.
- **Risk / ordering:** Real ordering exposure. `accountQueue.splice(0, accountQueue.length)` currently guarantees the queue is empty before the trailing `dispatch(createAccount(accountPayload))` on line 473, so the buffered accounts always land before the triggering one; a chunked drain must preserve that by pushing `accountPayload` onto the queue rather than dispatching it separately. Re-entrancy is the main hazard: `onBundleProgress` fires repeatedly and `runDiscoveryThunk` reads `currentDiscovery.hasLoadedAnyNonEmptyAccount` from the store to decide whether to drain, so a half-finished drain could be re-entered. The accounts reducer inserts in canonical coin order (`accountsReducer.ts:119`), so relative dispatch order does not affect the final sorted list — but `walletMiddleware`'s `addTransaction` must still follow its own `createAccount`, which it does since it is the same dispatch's middleware pass. Also: `TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress)` at line 503 runs when `discoverAccounts` resolves, so a drain still in flight past that point must be allowed to finish — it must not be tied to the listener's lifetime.
- **Confidence:** high — this is the skill's own named example; the added value here is the verified middleware fan-out multiplier, read in walletMiddleware, fiatRatesMiddleware and storageMiddleware.
- **Priority:** P1 — **named-in-skill** (documented as the canonical bad example in skills/performance-scheduling/SKILL.md; not filed as an issue)

## F2.4 — Defer the four whole-account-list analytics scans `analyticsMiddleware` runs on discovery completion

- **Anchor:** `packages/suite/src/middlewares/suite/analyticsMiddleware.ts:186`
- **Class:** non-essential
- **Platform:** web (packages/suite — web and the Electron renderer)
- **What grows:** n = all accounts in the store (not just the wallet that just finished discovering — it reads `state.wallet.accounts` wholesale, so every remembered wallet counts), times each account's token list. Four separate full passes: `accountsWithNonZeroBalance` (a `BigNumber` per account for balance, another for staking balance, plus `hasVisibleTokens` which calls `getTokens` over the account's tokens against `state.tokenDefinitions`), `accountsWithTokens` (a `BigNumber` plus another `hasVisibleTokens`), `accountsWithStaking` (another `BigNumber` staking pass), and `getAccountsWithSomeTransactionHistory(...).reduce(...)`. EVM accounts routinely carry hundreds of spam token entries, so the token factor is not small.
- **When it runs:** on the `discoveryActions.updateDiscovery` action whose status is `complete` — the same tick as F2.2's loop, and the same tick that flips the UI out of the discovery-loading state.
- **Blocking-what:** the render of the account list / dashboard the user has been waiting for since unlocking the device. Note this cost is paid **even when the user has opted out of analytics**: `Analytics.report` bails on `!this.enabled` only _after_ the caller has already built the payload, and all four aggregations here happen before any `report` call.
- **Before:**

```ts
            case discoveryActions.updateDiscovery.type: {
                if (action.payload.status.status !== 'complete') return result;

                const accountsWithNonZeroBalance = state.wallet.accounts
                    .filter(
                        account =>
                            new BigNumber(account.balance).gt(0) ||
                            new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0) ||
                            hasVisibleTokens(
                                account.symbol,
                                account.tokens ?? [],
                                state.tokenDefinitions,
                            ),
                    )
                    .reduce(accumulateAccountCountBySymbolAndType, {});
```

- **Proposed fix:** Move the whole `case` body into `requestIdleCallback(..., { timeout: 2000 })` (with the usual `setTimeout` fallback for Safari), reading `getState()` inside the callback rather than closing over the `state` captured during the middleware pass. Timeout 2000 ms for the same reason as F2.2: it is telemetry, it must eventually go out, but it must never win a race against the frame that shows the user their accounts. This is a middleware, so it is synchronous by construction — a callback is the only option, a chunked loop is not. While in there, the four passes should also be folded into one (that part is complexity, not scheduling, and is out of this skill's scope).
- **Risk / ordering:** Deferred aggregation reads a slightly later store snapshot, which for these counters is arguably _more_ accurate, not less — but if exact "state at completion" semantics are wanted, snapshot `state.wallet.accounts` and `state.tokenDefinitions` at dispatch time and pass them into the callback (they are immutable references, so this is cheap). Nothing downstream consumes the result; the four `analytics.report` calls are terminal. No cancel path exists and none is strictly needed, though the callback id should be cancelled if a new discovery starts, otherwise a rapid discover→forget→discover sequence could emit a duplicate batch.
- **Confidence:** high — read the middleware case, `hasVisibleTokens`/`getTokens`, `getAccountsWithSomeTransactionHistory`, and confirmed in `Analytics.report` that the opt-out check happens after payload construction.
- **Priority:** P2

## F2.5 — Stop `initBlockchainThunk` awaiting `preloadFeeInfoThunk` before the rest of app init

- **Anchor:** `suite-common/wallet-core/src/blockchain/blockchainThunks.ts:127` (awaited at `packages/suite/src/actions/suite/initAction.ts:93` and `suite-native/app-init/src/appInitThunks.ts:85`)
- **Class:** startup-serialisation
- **Platform:** shared (web, Electron renderer, and the React Native JS thread)
- **What grows:** n = the networks the user has enabled (`networksCollection.filter(n => !n.isHidden && enabledNetworks?.includes(n.symbol))`). Bounded by the network catalogue rather than by user data, but the cost per element is a `TrezorConnect.blockchainEstimateFee` round-trip, which forces a backend connection for each enabled coin. Enabling a broad set of networks makes this dozens of backend handshakes.
- **When it runs:** app start. It is the very first statement of `initBlockchainThunk`, which both init flows `await`.
- **Blocking-what:** first paint, on the whole init chain behind it. `Preloader.tsx:109` holds the full-page loader until `router.loaded`, and `routerInit()` is `initAction` step 11 — behind step 7 (this thunk), step 8 (token definitions), steps 9–10 (fiat rates). The file even carries a standing comment at `Preloader.tsx:110` about `initActions` "incorrectly await[ing] altcoin specific logic". Nothing before `routerInit` needs fee data: the only consumers of `selectRawNetworkFeeInfo` / `selectNetworkFeeInfo` are the send, RBF, staking, allowance and trading forms, and every one of those re-fetches on mount via `useFetchFeesOnce` / `useRefetchFees` anyway.
- **Before:**

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
```

- **Proposed fix:** Neither of the two statements after it depends on fee info — `getCustomBackends` reads the blockchain settings slice and `setBackendsToConnect` only configures backend URLs — so the `await` is pure serialisation. Drop the `await` and schedule the dispatch in `requestIdleCallback(..., { timeout: 10000 })` (web/desktop, with a `setTimeout` fallback) or `InteractionManager.runAfterInteractions` (native), placed _after_ `setBackendsToConnect`. A long 10 s timeout is right because the first consumer is a form the user has to navigate to, and the forms refresh fees on mount regardless. The call site is already `async`, so this is a one-line restructure, not a rewrite.
- **Risk / ordering:** Moving it after `setBackendsToConnect` is not just harmless, it is a latent correctness fix: today `preloadFeeInfoThunk` issues `blockchainEstimateFee` **before** the user's custom backends are applied, so a custom-backend user's very first connection goes to the default backend. Downstream, `feesActions.updateMultipleFees` writes a `'preloaded'` status per network; anything reading fee info before it lands already has to handle the un-preloaded case (`useRbfForm.ts:184` falls back to `DEFAULT_FEE_INFO`, `addFakePendingEvmTxThunk` at `transactionsThunks.ts:425` uses `rawFeeInfo!` and would need auditing under the new timing). No cancel path today; the idle callback should be cancelled if the app tears down mid-init.
- **Confidence:** medium — the serialisation, the awaiting call sites and the Preloader gating are all read and certain; "medium" only because I did not measure how long `blockchainEstimateFee` with `feeLevels: 'preloaded'` actually takes per coin, so the size of the win is estimated from the round-trip count rather than observed.
- **Priority:** P2 — bounded n by the strict rubric, but it sits on the startup critical path and gates every later init step.
