# Loading another page of native transaction history rebuilds the whole list model in one urgent commit

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, its closing rule: for work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`. The mobile account-detail list derives its entire flat model — partition, group, sort, flatten — from every transaction loaded so far, synchronously in the render body, at urgent priority. Every "load more" that returns, every pull-to-refresh and every incoming block runs it again over a list that only ever grows, on the RN JS thread of the screen the user is scrolling.

## Where

[`suite-native/transactions/src/components/TransactionList.tsx:210`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L210) is the derivation. Its only input is the selector result read at [`:153`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L153), and its memo key is that array's identity ([`:249`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L249)) — so the memo misses on exactly the updates that matter, because every one of them produces a new array. Over that array it runs, in order:

- `arrayPartition` ([`:214`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L214)) — a `reduce` that spreads both accumulators per element ([`packages/utils/src/arrayPartition.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/arrayPartition.ts#L15));
- `groupTransactionsByDate` ([`:215`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L215)) — copies the array, filters it, sorts it, then folds it with `{ ...r, [key]: [...prev, item] }` per element ([`suite-common/wallet-utils/src/transactionUtils.ts:393`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L393)–[`:396`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L396));
- an `Object.keys(...).sort` over the month keys ([`:224`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L224)) that parses two `Date`s per comparison ([`:83`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L83)–[`:84`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L84));
- a `flatMap` that rebuilds every row plus a month-key string ([`:245`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L245)), and in the token view additionally re-scans `transaction.tokens` per transaction and allocates a spread object per matching transfer ([`:231`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L231)–[`:240`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L240)).

**Paging is a footer button, not infinite scroll.** The `FlashList` at [`:290`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L290) has no `onEndReached`; the only way to extend the list is `handleOnLoadMore` ([`:178`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L178)) wired through `ListFooterComponent` ([`:304`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L304)) to the button's `onPress` at [`TransactionsListFooter.tsx:38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionsListFooter.tsx#L38). That handler is `async` and awaits a `getAccountInfo` round trip, so **the press itself is not what blocks** — the footer swaps to a `Loader` ([`TransactionsListFooter.tsx:26`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionsListFooter.tsx#L26)) and the rebuild lands later, in the render caused by `addTransaction` ([`transactionsThunks.ts:635`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L635)) when the page arrives. It is the frames _after_ the response — while the user is still scrolling and the spinner is being replaced by 25 new rows — that are lost.

The same commit is reached by two other paths that need no press at all: pull-to-refresh ([`:189`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L189)), and `onBlockchainNotificationThunk` ([`blockchainThunks.ts:389`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L389)), which refetches the matched account ([`:452`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L452)) and appends through [`accountsThunks.ts:267`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsThunks.ts#L267) while the screen is open.

## Before

The selector read, verbatim, at [`:153`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L153):

```tsx
const transactions = useSelector((state: TransactionsRootState & TokensRootState) =>
    stakingOnly
        ? selectAccountStakeTypeTransactionsWithTokenTransfers(state, accountKey)
        : selectAccountTransactionsWithTokenTransfers(state, accountKey),
);
```

and the derivation, verbatim, at [`:210`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L210)–[`:249`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L249):

```tsx
const data = useMemo((): TransactionListItem[] => {
    // groupTransactionsByDate now sorts also pending transactions, if they have blockTime set.
    // This is here to keep the original behavior of having pending transactions in one group
    // at the beginning of the list.
    const [pendingTxs, confirmedTxs] = arrayPartition(transactions, isPending);
    const accountTransactionsByMonth = groupTransactionsByDate(confirmedTxs, 'month');
    if (pendingTxs.length || accountTransactionsByMonth['no-blocktime']) {
        accountTransactionsByMonth['pending'] = [
            ...(accountTransactionsByMonth['no-blocktime'] ?? []),
            ...pendingTxs.sort(sortPendingTransactions),
        ];
        delete accountTransactionsByMonth['no-blocktime'];
    }

    const transactionMonthKeys = Object.keys(accountTransactionsByMonth).sort(
        sortKeysPendingFirst,
    ) as MonthKey[];

    if (tokenContract) {
        return transactionMonthKeys.flatMap(monthKey => [
            monthKey,
            ...(accountTransactionsByMonth[monthKey] ?? []).flatMap(transaction =>
                transaction.tokens
                    .filter(token => token.contract === tokenContract)
                    .map(
                        tokenTransfer =>
                            ({
                                ...tokenTransfer,
                                originalTransaction: transaction,
                            }) as TypedTokenTransferWithTx,
                    ),
            ),
        ]);
    }

    return transactionMonthKeys.flatMap(monthKey => [
        monthKey,
        ...(accountTransactionsByMonth[monthKey] ?? []),
    ]) as TransactionListItem[];
}, [transactions, tokenContract]);
```

and the footer wiring, verbatim, at [`:300`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L300)–[`:306`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L306):

```tsx
                ListFooterComponent={
                    <TransactionsListFooter
                        accountKey={accountKey}
                        isLoading={isLoadingTransactions}
                        onButtonPress={handleOnLoadMore}
                    />
                }
```

## After

The import at [`:1`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L1) gains one hook:

```tsx
import { type JSX, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
```

Two lines after the selector at [`:157`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L157):

```tsx
// Rebuilding the list model walks every transaction loaded so far, so it runs at transition
// priority and the scroll that is in flight when a page or a block lands is not blocked by it.
const deferredTransactions = useDeferredValue(transactions);
const isListBehind = deferredTransactions !== transactions;
```

The memo body is unchanged; only its input and its dependency change — [`:214`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L214):

```tsx
const [pendingTxs, confirmedTxs] = arrayPartition(deferredTransactions, isPending);
```

and [`:249`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L249):

```tsx
    }, [deferredTransactions, tokenContract]);
```

and the footer keeps its loader until the rows it is announcing actually exist:

```tsx
                ListFooterComponent={
                    <TransactionsListFooter
                        accountKey={accountKey}
                        isLoading={isLoadingTransactions || isListBehind}
                        onButtonPress={handleOnLoadMore}
                    />
                }
```

Nothing else moves. `initialPageNumber` ([`:165`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L165)) keeps reading the undeferred `transactions`, because it only seeds `useState` on the first render, where the deferred and current values are identical anyway.

## Why it matters

The user is on an account's detail screen, has scrolled to the bottom, tapped "load more", and is still moving their finger when the page comes back. The JS thread is what `FlashList` needs to recycle cells, and it is the thread this derivation runs on. Hermes, one thread, no worker.

`n` is every transaction loaded for the account so far: 25 per press for most networks, 8 for Cardano and Solana ([`paging.ts:1`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/constants/paging.ts#L1)–[`:3`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/constants/paging.ts#L3), via [`getTxsPerPage`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-utils/src/txsPerPage.ts#L4)). It only grows — nothing trims the loaded window — and the button keeps being offered until `selectAreAllAccountTransactionsLoaded` is true ([`transactionsSelectors.ts:304`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsSelectors.ts#L304)), i.e. until the account's whole history is in memory. So the _k_-th press rebuilds a model of 25·_k_ rows, and the per-element cost is not constant either: `arrayPartition` and `groupTransactionsByDate` both spread their accumulator per element, so the derivation is superlinear before any of the sorting is counted.

After the change, the commit that clears the spinner is split in two. The urgent pass renders with the previous `deferredTransactions`, so the memo hits, `FlashList` receives the identical `data` reference and bails out — that pass costs nothing, and the touch and scroll events queued behind it are processed. The rebuild then runs in a transition render, which React schedules as separate host work and can throw away if a newer store update supersedes it. Today a block arriving mid-page-load means two full rebuilds; after, the first is discarded.

**Honest sizing, and where this claim is weaker than the raw finding.**

- **The press is not blocked today.** `handleOnLoadMore` awaits the network; the tap is acknowledged immediately by the footer's spinner. What is blocked is the frame in which the results appear, and any scrolling happening at that moment. That is a real defect, but it is "the list stutters when the page lands", not "the button does not respond".
- **Deferring does not make the derivation interruptible.** React can yield between components, not inside a `useMemo` body. If the rebuild alone exceeds the frame budget it still does so, as one uninterrupted unit; it just no longer shares a task with the event-driven commit.
- **The rows are already bounded.** `FlashList` 2.3.0 ([`suite-native/transactions/package.json:18`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/package.json#L18)) recycles cells, so growing the list does not grow the number of `TransactionListItem`s rendered per commit. The cost being argued about here is the model rebuild and `FlashList`'s own diff of an _n_-length array — not row rendering. That narrows the claim and is the reason this is P2 rather than P1.
- **Most accounts are small.** A user who never presses the button sees one page, and for them this is unobservable. It bites on long-lived accounts paged through deliberately — which is exactly when the user is doing the thing that triggers it, repeatedly.

## Notes

- **The `After` has not been compiled or run.** It is written against the file's real types by reading them; `useDeferredValue` is a plain React import and `isListBehind` is a `boolean`, so the type surface is small, but it deserves a `type-check` before review.
- **`InteractionManager` is not the lever here, and on this repo's React Native it could not be.** `skills/performance-scheduling/SKILL.md` calls `InteractionManager.runAfterInteractions` React Native's nearest equivalent to `requestIdleCallback`. Verified in the installed source (`node_modules/react-native` 0.86.0; `suite-native/app/package.json:145` pins `0.85.3`): `Libraries/Interaction/InteractionManager.js` exports `InteractionManagerStub`, every member `@deprecated`, with `runAfterInteractions` a bare `setImmediate` wrapped in a promise, `createInteractionHandle()` returning `-1` and `setDeadline()` literally doing nothing. It waits for no interaction and no animation. Worse for this file's purposes, with the new architecture enabled (`suite-native/app/android/gradle.properties:38`) `Libraries/Core/setUpTimers.js:38`–`:41` shims `setImmediate` onto `queueMicrotask` (`Libraries/Core/Timers/immediateShim.js`), so it does not even end the current task. **`SKILL.md` needs correcting on this point** — the same correction `p1-16` reports from the other direction.
- **`requestIdleCallback` does exist on this React Native, contrary to the skill.** Same file, `setUpTimers.js:47`–`:59`, polyfills `requestIdleCallback`/`cancelIdleCallback` from `NativeIdleCallbacks`. Not used here — extending a list the user just asked for is not deferrable, non-essential work — but worth flagging into the skill alongside the point above.
- **Why `useDeferredValue` and not `startTransition`.** The update arrives from redux through react-redux 9.3.0 ([`suite-native/transactions/package.json:54`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/package.json#L54)), i.e. `useSyncExternalStore`; React will not defer an external-store update, so wrapping the `dispatch` in `handleOnLoadMore` in `startTransition` would defer nothing. Deferring on the read side is the only thing that works. React is 19.2.3 ([`suite-native/transactions/package.json:51`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/package.json#L51)) and the new architecture is on, so concurrent rendering is genuinely available rather than a no-op.
- **React Compiler is enabled for the native app** (`suite-native/app/app.config.ts:326`). It does not change scheduling priority, so it neither helps nor hinders this change; the explicit `useMemo` at [`:210`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L210) stays as written rather than being removed in the same diff.
- **What the user could notice.** For one transition after a page lands, the list still shows the previous page while the store already has the new one — so the footer would flip from "loading" back to a "load more" button over rows that are not there yet. `isListBehind` is there precisely to prevent that, and it is the part of this change most worth arguing about: it keeps the spinner up marginally longer than today. Nothing can get stuck — `useDeferredValue` always schedules the follow-up render, there is no timeout and no fallback involved. On mount the deferred and current values are the same object, so first paint is unaffected.
- **`ListEmptyComponent` and the fiat-rate backfill both move one pass later.** `useFetchMissingTransactionFiatRates` is keyed on `data.length > 0` ([`:251`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L251)); it is a rate backfill and one transition of delay is harmless. The empty state ([`:294`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L294)) is unaffected on mount for the reason above, and `shouldDeferEmptyState` ([`:148`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L148)) already guards the staking case.
- **Ordering and re-entrancy.** The derivation is pure and its inputs do not change, so deferring cannot reorder rows: pending transactions still sort first ([`:78`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L78)) and `sortPendingTransactions` is untouched. `page` ([`:166`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L166)) is incremented from the handler after the await, independently of the deferred value, so a second press while the list is catching up still requests the correct next page. There is no cancellation to thread through — nothing is started by this code.
- **Tests.** `@suite-native/transactions` has no test for `TransactionList` (only `utils.test.ts` and `TransactionName.test.tsx`), and the `@transactions/list/more-button` testID appears nowhere outside the component itself, so there is no e2e coverage of paging either. Nothing should break; equally, nothing is watching. A test written for this would have to tolerate the one-transition lag, which argues for `findBy*`-style retrying assertions.
- **Deliberately not changed: the derivation's own complexity.** `arrayPartition`'s spread accumulator is `p1-05` of the sibling `asymptotic-complexity` set. `groupTransactionsByDate` ([`transactionUtils.ts:371`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L371)) has the same defect in object form and is, as far as I can tell, **not** covered by that set — it copies the accumulator object _and_ the bucket array per transaction, and it is called from web code too. Fixing both would shrink this task substantially and is a better first PR than this one; it would not remove the task, because the sort, the flatten and `FlashList`'s diff remain O(n). A reviewer who wants only one change here should take the complexity fix and leave this open.
- **Deliberately not changed: paging is unbounded by design.** Nothing evicts older pages, so `n` is monotonic for the lifetime of the screen. A windowed store slice would cap this properly and is a much larger change.
- **Package impact.** `@suite-native/transactions` is `private: true`; nothing published changes. This document adds no dependency and needs neither `yieldToMain` nor `runWhenIdle` — and per the brief, native code must not use `runWhenIdle` in any case.
- **Platform: native only.** The web transaction list is a different component tree and is not touched.
- **Cross-references.** `p1-16` (balance-history reduction) and `p1-17` (graph refetch) both run on this same screen, so the JS thread this document is contending for is already contended; if they land first, the case here gets weaker in practice and no less true. `p2-14` is the same `useDeferredValue` lever on the native accounts search. `p1-12`, `p1-13` and `p2-05` are the same lever on web — a reviewer may reasonably want one PR that establishes the pattern across all of them, though this one is the only member of that group where the trigger is not a keystroke.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
