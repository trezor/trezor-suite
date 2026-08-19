# `updateMissingTxFiatRatesThunk` scans every persisted transaction in one synchronous task, awaited on the startup path

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — sections _"Break a long task up and
yield to the main thread"_ and _"Schedule non-essential work in an idle callback"_. This call site is
both defects at once: the scan is one uninterruptible task proportional to the user's entire persisted
transaction history, and what it produces — historic fiat rates for transactions the user is not looking
at — is cold backfill that nothing on screen waits for. So it needs both levers: chunk the loop and
yield, _and_ take it off the boot path.

## Where

[`suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:333`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts#L333)
and
[`:339`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts#L339)
— the thunk body is synchronous end to end. It calls
[`selectTransactionsWithMissingRates`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsSelectors.ts#L358)
(`transactionsSelectors.ts:358`) and then `forEach`s the result, dispatching one
`updateTxsFiatRatesThunk` per account.

When no `accountKey` is passed, the selector sets `scopedTransactions` to the whole
`state.wallet.transactions` record (`transactionsSelectors.ts:368-370`) and walks it: per account it
builds the ERC4626 contract `Set`, and per transaction it builds a fiat-rate key, rounds `blockTime` to
the nearest past hour, does a two-level lookup in `historicFiatRates`, and repeats that for every
non-NFT token transfer on the transaction. Two call sites pass no `accountKey`:

- [`packages/suite/src/actions/suite/initAction.ts:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L115)
  — step 10 of `init()`, **awaited**, immediately before `dispatch(routerInit())` at `:118`.
- [`suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:77`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts#L77)
  — whenever `fetchAllTransactionsForAccountThunk` settles, i.e. every time an account's transaction
  list finishes paging; and again at
  [`:91`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts#L91)
  on base-currency change. Both are `!isNative()`-gated.

The `forEach` at `:339` does not end the task either: `updateTxsFiatRatesThunk`'s synchronous prefix
(`fiatRatesThunks.ts:151-163`, plus the timestamp rounding and de-duplication inside
`fetchTransactionsRates`) runs before its first `await`, so each account's transaction list is mapped
and filtered again inside the same task as the scan.

## Before

`suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:326-349`

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

`packages/suite/src/actions/suite/initAction.ts:114-118`

```ts
// 10. fetch rates for transactions with missing rates
await dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));

// 11. dispatch initial location change
dispatch(routerInit());
```

## After

`suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts`

```ts
export const updateMissingTxFiatRatesThunk = createThunk<
    void,
    UpdateMissingTxFiatRatesThunkParams,
    { state: UpdateMissingTxFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/updateMissingTxRates`,
    async ({ localCurrency, accountKey }, { dispatch, getState }) => {
        const transactionsWithMissingRates = selectTransactionsWithMissingRates(
            getState(),
            localCurrency,
            accountKey,
        );

        // Each dispatched updateTxsFiatRatesThunk maps and de-duplicates that account's timestamps
        // synchronously before it reaches the network, so the accounts are dispatched in batches
        // with the main thread free in between.
        const ACCOUNTS_CHUNK_SIZE = 5;

        for (let i = 0; i < transactionsWithMissingRates.length; i += ACCOUNTS_CHUNK_SIZE) {
            transactionsWithMissingRates
                .slice(i, i + ACCOUNTS_CHUNK_SIZE)
                .forEach(({ account, txs }) => {
                    dispatch(
                        updateTxsFiatRatesThunk({
                            accountKey: account.key,
                            txs,
                            baseCurrencyCode: localCurrency,
                        }),
                    );
                });

            await yieldToMain();
        }
    },
);
```

`packages/suite/src/actions/suite/initAction.ts`

```ts
// 10. fetch rates for transactions with missing rates
runWhenIdle(() => dispatch(updateMissingTxFiatRatesThunk({ localCurrency })), {
    timeout: 5000,
});

// 11. dispatch initial location change
dispatch(routerInit());
```

## Why it matters

At startup the user is looking at `InitialLoading`. `Preloader.tsx:109` keeps the full-page loader up
while `!router.loaded`, and `router.loaded` is only set once `routerInit()` runs — which is step 11,
after this thunk is awaited at step 10. So the scan sits between the user and the first screen.

`n` is every transaction of every account of every remembered wallet in the store, plus every non-NFT
token transfer on each of those transactions. Nothing bounds it: it grows with history, with the number
of accounts, and with the number of remembered wallets, and nothing prunes it. The whole scan plus the
per-account synchronous prefixes run as one task, so the blocking period is proportional to the entire
persisted history — the 50 ms long-task threshold is the spec's number, not a measurement of this call
site.

The middleware path is worse in kind if not in size: when the user opens an account's transaction list
and it finishes paging, this fires unscoped, so the scan covers every _other_ account too — work the
user is not waiting for, landing on the thread while they scroll the list they just opened.

Nothing visible depends on the result. Historic rates are backfill; rows render with a placeholder until
a rate arrives, and the middleware comment at `:73-76` says outright that this is a fallback for when the
per-transaction fetch failed. After the fix, startup is not behind it at all, and when it does run each
task covers a handful of accounts instead of all of them.

## Notes

- **Found twice, independently.** Area 1 (startup scan) and area 2 (wallet-core scan) reported this
  separately as F1.3 and F2.1, landing on the same anchor, the same two unscoped call sites and the same
  two-lever fix. That is the strongest robustness signal in this set.
- **Both classes, deliberately.** Chunking alone leaves the work competing with first paint; moving it
  to idle alone leaves one unbounded task, which on a busy machine the 5 s timeout will eventually force
  onto the thread anyway. The idle move is the larger win and the chunking is the safety net.
- **This is not a complexity defect.** The selector's lookups are already indexed — `historicFiatRates`
  is a two-level record and `erc4626Contracts` is a `Set` — so the scan is linear in transactions plus
  token transfers, not quadratic. `performance-complexity` has nothing to fix here; scheduling is the
  whole lever. Adjacent and out of scope: `selectTransactionsWithMissingRates` is a plain function, not
  a `createMemoizedSelector` like its neighbours in that file, so every call is a full rescan — that
  does not help the boot path, where it runs once, so it is left alone.
- **Honest sizing of the network cost: unchanged.** `fetchTransactionsRates` sends all of an account's
  unique rounded timestamps in a single `getFiatRatesForTimestamps` call, so the request count is one per
  account plus one per token contract, not one per transaction. This issue is about main-thread time, not
  request volume, and the fix does not reduce either the number of requests or their payloads.
- **`yieldToMain` / `runWhenIdle` are introduced by whichever of these issues lands first** —
  `packages/utils/src/yieldToMain.ts` and `packages/utils/src/runWhenIdle.ts`, exported from
  `@trezor/utils`. `@trezor/utils` is a published package, so that is a published-API addition.
  `fiatRatesThunks.ts` already imports from `@trezor/utils` (line 36).
- **Ordering under yielding.** The account list is snapshotted before the loop, so an account forgotten
  mid-run can still be dispatched for. That is already handled: `updateTxsFiatRatesThunk` starts with
  `selectAccountByKey` and returns `{ account, rates: [] }` when the account is gone
  (`fiatRatesThunks.ts:152-154`). The alternative — re-reading `getState()` per batch — is more code for
  the same outcome and is not proposed here. A reviewer who wants the fresher read should say so.
- **Re-entrancy is the real risk, and there is no cancellation today.** The middleware can fire this
  again (another account finishing paging, a base-currency change) while a previous run is mid-loop,
  duplicating the dispatches. Overlapping calls already duplicate today, but yielding widens the window.
  `createSingleInstanceThunk` (`@suite-common/redux-utils`, used by three thunks in
  `transactionsThunks.ts`) is the existing tool for this and would be a reasonable follow-up or a
  reasonable demand from a reviewer; it is deliberately not folded in here to keep the change reviewable.
- **What the user sees change.** At startup, a transaction whose historic rate is missing keeps its
  placeholder until the idle callback fires instead of until step 10 completes. It still runs: the 5 s
  `timeout` forces it on a page that never idles, and on Safari — which has no `requestIdleCallback` —
  `runWhenIdle` falls back to `setTimeout`, so the work is deferred, never skipped. 5 s rather than the
  2 s used elsewhere because nothing on screen depends on this and it should lose every race against
  first paint and early interaction.
- **Tests that break.** `packages/suite/src/actions/suite/initAction.test.ts` asserts an exact
  action-type sequence containing `updateMissingTxFiatRatesThunk.pending` / `.fulfilled` at lines
  163-164, 212-213 and 263-264; deferring the dispatch removes those from the synchronous sequence, so
  the fixtures need updating (or the test needs to drive the timer).
  `suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.test.ts` covers only `updateTxsFiatRatesThunk`
  (`describe` at `:61`) — a test that the chunked thunk dispatches once per account and resolves after
  the last batch would be new.
- **Platform.** The thunk is shared, so `yieldToMain` must stay RN-safe — it is, since the fallback is
  `setTimeout` and Hermes has no `scheduler.yield`. `runWhenIdle` is web/desktop only and the
  `initAction.ts` change is `packages/suite`, so native is unaffected by it. Native reaches the thunk
  through `useFetchMissingTransactionFiatRates`, whose `accountKey` is typed optional but is passed a
  defined key at both call sites (`TransactionList.tsx:251`, `TransactionDetailScreen.tsx:53`), so native
  does not hit the unscoped path today — the type permits it, which is worth tightening separately.
- **The loop yields after the final batch too**, including the single-account native case, so the
  thunk's promise resolves one task later than before. No caller depends on that: `initAction` would no
  longer await it, the middleware never awaited it, and the native hook does not await it.
- `storageMiddleware.ts:193-215` deletes and rewrites _all_ of an account's historic rates on every
  `updateTxsFiatRatesThunk.fulfilled`. Spreading the fulfilments out keeps those rewrites off one task,
  but it does not reduce their number — a reviewer could fairly call that a wash.
- **The After hunks have not been compiled.** They are written against the surrounding types by reading,
  not by running `tsc`. Making the thunk body `async` is required for the chunked variant and is
  compatible with `createThunk` (it is `createAsyncThunk`); the `initAction.ts` call site is already
  `async` and simply stops awaiting.
- **Overlap with `p1-01`**, which proposes moving `routerInit()` / `onSuiteReady()` ahead of steps 8-10
  wholesale. That subsumes the `initAction.ts` hunk here. If `p1-01` lands first, only the thunk-side
  chunking remains in this issue.
- **Where to push back.** For a user with one wallet and a few dozen transactions the scan is trivially
  short and this is noise; the case rests on the unbounded tail, not the median. And because the inner
  dispatches were always fire-and-forget, nothing about the rates themselves gets faster — only the
  thread gets freed.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
