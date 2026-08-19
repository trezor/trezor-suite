# Discovery completion fires the whole analytics batch on the frame that reveals the account list

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential
work in an idle callback"_. Two scan findings merged (F2.2 and F2.4) because they share a trigger and a
fix: the `dispatch(discoveryActions.updateDiscovery({ status: 'complete' }, ...))` that flips the wallet
out of its loading state drags four whole-account-list aggregations through `analyticsMiddleware` on the
way in, and the very next statements dispatch one analytics thunk — and one outbound `fetch()` — per
discovered account. All of it is telemetry, and all of it runs in the same synchronous task as the
update the user has been waiting for since they unlocked the device.

## Where

Three anchors, one trigger.

- [`suite-common/wallet-core/src/discovery/discoveryThunks.ts:284`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L284)
  — the per-account loop at the end of `completeDiscovery` (`:265-287`). Line `:278` dispatches
  `updateDiscovery({ status: 'complete' })`; six lines later the same call stack walks every account of
  the wallet and dispatches `reportAccountInfoThunk` for each.
- [`suite-common/wallet-core/src/discovery/discoveryThunks.ts:788`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L788)
  — **the identical loop, copy-pasted**, at the end of `runAdditionalDiscoveryThunk` (`:785-791`), after
  its own `updateDiscovery({ status: 'complete' })` at `:772-782`. Any fix has to land in both places,
  which is the argument for extracting the loop rather than wrapping it twice.
- [`packages/suite/src/middlewares/suite/analyticsMiddleware.ts:186`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/suite/analyticsMiddleware.ts#L186)
  — the `case discoveryActions.updateDiscovery.type` body (`:186-246`), which runs _inside_ that same
  `dispatch` call, i.e. before the loop above, in the same task.

What each unit costs at the call site:

- [`reportAccountInfoThunk`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsThunks.ts#L122)
  (`accountsThunks.ts:122-144`) is a full RTK thunk dispatch through the whole middleware chain. Per
  account it builds `getAccountInfoAnalyticsPayload` (`accountsInfoAnalytics.ts:15-27`: a `BigNumber`
  over the staking balance, `getAccountAnalyticsTokenSymbols` running `getTokens` across the account's
  entire token array against the coin definitions, and `getStakingProvidersForAnalytics`), does a linear
  `getTradedAccountKeys().includes(account.key)`, then calls `analytics.report`.
- `Analytics.report` (`packages/analytics-uploader/src/analytics.ts:102`) is **not** a queue push once
  the app is past init: `init()` has already set `enabled` from storage, so `report` builds the query
  string (`:136`) and calls `reportEvent` (`:148`), which does `await fetch(url, options)` at
  `packages/analytics-uploader/src/utils.ts:100` — the `fetch()` is _started_ synchronously inside the
  loop. So one discovery completion is n thunk dispatches **and** n request starts in one task.
- The four middleware passes are over **`state.wallet.accounts`, not the transaction lists**. That is
  worth stating precisely because the third `report` reads
  `getAccountsWithSomeTransactionHistory(state.wallet.accounts)`, and that helper only filters on the
  scalar counters `account.history.total + account.history.unconfirmed`
  ([`accountUtils.ts:1199-1200`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L1199))
  — it never touches `state.wallet.transactions`. The inner cost is the account's **token** array:
  `hasVisibleTokens` (`packages/suite/src/utils/wallet/tokenUtils.ts:68`) runs `getTokens` over every
  token, and EVM accounts routinely carry hundreds of spam entries. Note also that the middleware reads
  `state.wallet.accounts` wholesale, so it counts **every remembered wallet**, not just the one that
  just finished discovering.

## Before

`suite-common/wallet-core/src/discovery/discoveryThunks.ts:265-287`

```ts
const completeDiscovery = (
    devicePath: DeviceUniquePath,
    deviceState: TrezorDeviceWithState['state'],
    {
        dispatch,
        fetchAndSaveMetadata,
        getState,
    }: {
        getState: () => DiscoveryReportingThunkState;
        dispatch: ThunkDispatch<DiscoveryReportingThunkState, DiscoveryReportingDeps, AnyAction>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
    },
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

`suite-common/wallet-core/src/discovery/discoveryThunks.ts:785-791`

```ts
if (result.success) {
    dispatch(reportWalletBalanceThunk());

    selectAccountsByDeviceState(getState(), staticSessionId).forEach(account =>
        dispatch(reportAccountInfoThunk(account.key)),
    );
}
```

`packages/suite/src/middlewares/suite/analyticsMiddleware.ts:186-246`

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

                const accountsWithTokens = state.wallet.accounts
                    .filter(account => new BigNumber(account.tokens?.length || 0).gt(0))
                    .reduce<Record<string, number>>((acc, { symbol, tokens }) => {
                        if (
                            tokens?.length &&
                            !hasVisibleTokens(symbol, tokens, state.tokenDefinitions)
                        ) {
                            return acc;
                        }
                        acc[symbol] = (acc[symbol] || 0) + 1;

                        return acc;
                    }, {});

                const accountsWithStaking = state.wallet.accounts
                    .filter(account =>
                        new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0),
                    )
                    .reduce(accumulateAccountCountBySymbolAndType, {});

                analytics.report({
                    type: events.accountsStatusEvent.name,
                    payload: getAccountsWithSomeTransactionHistory(state.wallet.accounts).reduce(
                        accumulateAccountCountBySymbolAndType,
                        {},
                    ),
                });

                analytics.report({
                    type: events.accountsNonZeroBalanceEvent.name,
                    payload: accountsWithNonZeroBalance,
                });

                analytics.report({
                    type: events.accountsTokensStatusEvent.name,
                    payload: accountsWithTokens,
                });

                analytics.report({
                    type: events.accountsActiveStakingEvent.name,
                    payload: accountsWithStaking,
                });

                break;
            }
```

## After

`suite-common/wallet-core/src/discovery/discoveryThunks.ts` — one helper, used by both anchors.

```ts
const ANALYTICS_IDLE_TIMEOUT = 2000;

const reportDiscoveredAccounts = (
    staticSessionId: StaticSessionId,
    {
        dispatch,
        getState,
    }: {
        getState: () => DiscoveryReportingThunkState;
        dispatch: ThunkDispatch<DiscoveryReportingThunkState, DiscoveryReportingDeps, AnyAction>;
    },
) => {
    const report = () =>
        selectAccountsByDeviceState(getState(), staticSessionId).forEach(account =>
            dispatch(reportAccountInfoThunk(account.key)),
        );

    // Discovery completion is the update that reveals the account list, so the per-account events
    // wait for an idle gap. React Native has no idle callback, so there it stays inline.
    if (isNative()) {
        report();
    } else {
        runWhenIdle(report, { timeout: ANALYTICS_IDLE_TIMEOUT });
    }
};
```

```ts
    dispatch(reportWalletBalanceThunk());

    reportDiscoveredAccounts(deviceState.staticSessionId, { dispatch, getState });
};
```

```ts
if (result.success) {
    dispatch(reportWalletBalanceThunk());

    reportDiscoveredAccounts(staticSessionId, { dispatch, getState });
}
```

`packages/suite/src/middlewares/suite/analyticsMiddleware.ts` — the case body extracted and deferred;
the four passes themselves are unchanged, only `state` becomes a parameter.

```ts
const ANALYTICS_IDLE_TIMEOUT = 2000;

const reportAccountsStatus = (
    state: AnalyticsMiddlewareState,
    analytics: DesktopAnalyticsDep['analytics'],
) => {
    const accountsWithNonZeroBalance = state.wallet.accounts
        .filter(
            account =>
                new BigNumber(account.balance).gt(0) ||
                new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0) ||
                hasVisibleTokens(account.symbol, account.tokens ?? [], state.tokenDefinitions),
        )
        .reduce(accumulateAccountCountBySymbolAndType, {});

    const accountsWithTokens = state.wallet.accounts
        .filter(account => new BigNumber(account.tokens?.length || 0).gt(0))
        .reduce<Record<string, number>>((acc, { symbol, tokens }) => {
            if (tokens?.length && !hasVisibleTokens(symbol, tokens, state.tokenDefinitions)) {
                return acc;
            }
            acc[symbol] = (acc[symbol] || 0) + 1;

            return acc;
        }, {});

    const accountsWithStaking = state.wallet.accounts
        .filter(account => new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0))
        .reduce(accumulateAccountCountBySymbolAndType, {});

    analytics.report({
        type: events.accountsStatusEvent.name,
        payload: getAccountsWithSomeTransactionHistory(state.wallet.accounts).reduce(
            accumulateAccountCountBySymbolAndType,
            {},
        ),
    });

    analytics.report({
        type: events.accountsNonZeroBalanceEvent.name,
        payload: accountsWithNonZeroBalance,
    });

    analytics.report({
        type: events.accountsTokensStatusEvent.name,
        payload: accountsWithTokens,
    });

    analytics.report({
        type: events.accountsActiveStakingEvent.name,
        payload: accountsWithStaking,
    });
};
```

```ts
            case discoveryActions.updateDiscovery.type: {
                if (action.payload.status.status !== 'complete') return result;

                runWhenIdle(() => reportAccountsStatus(getState(), analytics), {
                    timeout: ANALYTICS_IDLE_TIMEOUT,
                });

                break;
            }
```

## Why it matters

The user has just plugged in and unlocked their Trezor. `updateDiscovery({ status: 'complete' })` is the
action that ends that wait: `isDiscoveryInProgress` (`discoverySelectors.ts:22-37`) stops returning
`true`, which is what `selectDiscoveryOverallStatus` and `useDiscovery` feed to `AssetsView`,
`PortfolioCard`, `AccountsList` and `AccountsMenu`. That single dispatch is the moment the dashboard
becomes usable — and it is exactly the dispatch we hang telemetry off.

Everything below happens in one uninterruptible task, in this order:

1. `analyticsMiddleware` runs four full passes over `state.wallet.accounts` (every remembered wallet),
   each account's token array walked twice by `hasVisibleTokens`.
2. `graphMiddleware.ts:26-34` dispatches `updateGraphData` over `api.getState().wallet.accounts` for the
   same action — not this issue's subject, but it shares the task, so the frame is already loaded.
3. Back in `completeDiscovery`: metadata fetch, `setDiscovered`, `reportWalletBalanceThunk`.
4. Then n × (`reportAccountInfoThunk` dispatch + payload build + `fetch()` start).

`n` for the loop is the accounts of the just-discovered wallet — coins × account types × discovered
indices, so dozens for a user with many networks enabled. `n` for the middleware is every account in the
store, which grows with every wallet the user remembers and never shrinks on its own. Clicks on the
accounts that just appeared queue behind all of it; the 50 ms long-task threshold is the spec's number,
not a measurement of this call site.

None of it is work the user is waiting for. After the fix the reveal frame carries the reducer writes and
the graph dispatch only, and the telemetry runs in the first idle gap — or at the 2 s timeout on a
machine that never idles, which is well inside the window before the user can plausibly have navigated
somewhere that makes the events stale.

## Notes

- **Confidential-data check: clean, and here is exactly what was checked.** Both payloads were traced to
  the wire. `getAccountInfoAnalyticsPayload` (`accountsInfoAnalytics.ts:15-27`) sends `network` (the
  network symbol), `accountType`, `index` (the 0-based account index), `hasStaked` and `hasTraded`
  (booleans, not amounts), `tokenSymbols` (ticker strings only, from `getTokens(...).shownWithBalance`)
  and `stakingProviders` (provider ids from a fixed list, or the literal `'unknown'` —
  `stakingUtils.ts:340` maps Ethereum pool names, Solana voter pubkeys, Cardano pool ids and Tron SR
  addresses to provider ids and never emits the raw identifier). The four middleware events send
  `Record<'{symbol}_{accountType}', number>` count maps
  (`accumulateAccountCountBySymbolAndType`, `accountUtils.ts:1202-1211`), and `reportWalletBalanceThunk`
  sends a single count (`accountBalanceAnalytics.ts`). **No descriptor, xpub, address, txid, exact
  balance, label or device identifier leaves in any of these.** The one thing a reviewer should still
  eyeball: for a network without the `coin-definitions` feature, or for a token the user explicitly
  added to `tokenDefinitions.show`, `getTokens` (`tokens/tokenUtils.ts:83-91` in `wallet-core`) puts it
  in `shownWithBalance` unfiltered, so an arbitrary token's _ticker_ can be reported. A ticker is not on
  the confidential list and it is not per-user data, so this is not a finding — but it is the only place
  the payload is not drawn from a closed vocabulary.
- **The cost is paid even by users who opted out of analytics.** `Analytics.report` bails on
  `!this.enabled` at `analytics.ts:132`, which is _after_ the caller has already built the payload. So an
  opted-out user pays every `BigNumber`, every `getTokens` pass and all four aggregations, and only skips
  the query string and the `fetch()`. Deferring fixes that for them too.
- **The duplicated loop at `:788` is the reason for the helper.** Wrapping each loop in a `runWhenIdle`
  in place would work and be a smaller diff; extracting `reportDiscoveredAccounts` removes a copy-paste
  that already exists in `develop`. That extraction is a refactor riding along with a scheduling fix, and
  a reviewer is entitled to ask for the two loops to be deduplicated in a separate commit.
- **Native gets nothing from this issue, and that is a real gap.** `discoveryThunks.ts` is shared, but
  `runWhenIdle` is web/desktop only — `@trezor/utils` is a published package with no `react-native`
  dependency, so `InteractionManager.runAfterInteractions` cannot live there. The `isNative()` branch
  (the same guard `fiatRatesMiddleware.ts` already uses in this package) keeps native on today's
  behaviour. Wiring the RN lever means injecting a scheduler through the thunk's `services` deps or a
  `runWhenIdle.native.ts` in a native-only package; that is a follow-up, not this change. A reviewer who
  thinks the branch is ceremony has a point: `runWhenIdle`'s `setTimeout` fallback would technically
  defer on Hermes too, just without interaction awareness.
- **Chunking is deliberately not in the After.** The scan suggested optionally splitting the loop 20
  accounts at a time with `await yieldToMain()` between chunks. Once the batch is off the reveal frame it
  is competing with nothing, so the added `async` plumbing through a synchronous helper buys little.
  If the deferred batch still measures long, that is the follow-up lever.
- **Folding the four middleware passes into one is out of scope.** They walk the same array four times
  and `hasVisibleTokens` runs twice per account; that is a `performance-complexity` fix, and doing it
  here would mix the two skills in one diff.
- **Ordering and timestamps.** `Analytics.report` stamps `data.timestamp = Date.now()` at call time
  (`analytics.ts:103-106`), so deferring moves the recorded time by up to the idle timeout. The events
  stay monotonic and nothing downstream consumes their order — all four `report` calls are terminal, and
  `accountsInfoEvent` is deduped by `network + index + accountType` per its own description. If exact
  "time of completion" semantics are wanted, capture `Date.now()` before deferring and pass it through.
- **The account list is read inside the callback, not captured.** `selectAccountsByDeviceState` moves
  into `report`, and the middleware calls `getState()` inside the callback rather than closing over the
  `state` captured during the middleware pass. For the counters that later snapshot is arguably more
  accurate, not less; for the per-account loop it means a forgotten account is simply not reported.
- **No cancel path, and none is added.** If the user forgets the device or restarts discovery before the
  callback fires, the loop can report accounts that are gone — `reportAccountInfoThunk` re-reads via
  `selectAccountByKey` and returns early when the account is missing (`accountsThunks.ts:127-128`), so it
  degrades to a no-op. The middleware side is weaker: a fast discover → forget → discover sequence could
  emit two batches of the four counter events. Storing the callback id and cancelling it on
  `cancelDiscoveryThunk` (and on a new `updateDiscovery` complete) is the obvious hardening and is a fair
  thing for a reviewer to demand before this lands.
- **Deferring makes an existing guard fire more often, in a good way.** `reportAccountInfoThunk` returns
  early when the network requires coin definitions and they have not loaded yet
  (`accountsThunks.ts:130-136`), which today silently drops events for accounts discovered before the
  definitions arrive. Running later makes that guard more likely to pass.
- **Tests: nothing breaks, and nothing covers it.** There is no `discoveryThunks.test.ts` (the discovery
  folder has only `discoveryReducer.test.ts`) and no test file for `analyticsMiddleware.ts`. So this
  change has no failing fixtures to update — which is also the weakness: a test asserting that the events
  are still emitted after the timeout would be new work, and without one a regression here is silent.
- **`runWhenIdle` is introduced by whichever of these issues lands first** —
  `packages/utils/src/runWhenIdle.ts`, exported from `@trezor/utils`, a published-API addition.
  `discoveryThunks.ts` imports neither `@trezor/utils` nor `@trezor/env-utils` today; both are already
  declared in `suite-common/wallet-core/package.json` (lines 50 and 57), so this adds imports, not
  dependencies. `analyticsMiddleware.ts` already imports `BigNumber` from `@trezor/utils` (line 42).
- **The After hunks have not been compiled.** They are written against the surrounding types by reading,
  not by running `tsc` — in particular `AnalyticsMiddlewareState` and `DesktopAnalyticsDep['analytics']`
  as the extracted function's parameter types are read off the middleware's own declarations
  (`analyticsMiddleware.ts:63-70`) and not verified by the compiler.
- **Where to push back.** For the loop, `n` is one wallet's accounts — for a Bitcoin-only user with two
  accounts this is noise, and the case rests on the many-networks tail. The genuinely unbounded side is
  the middleware, which scans every account of every remembered wallet and re-does it on _every_
  discovery completion. If a reviewer wants to split this back into two issues, the middleware half is
  the one that survives on its own merits.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
