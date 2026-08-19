# Coin control re-scans the whole UTXO set and re-renders every visible row in the keystroke's own commit

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, which ends by naming the render lever: _"For work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`, not a chunked loop."_ The UTXO search inside coin control is a controlled input whose state drives an unmemoised scan of `account.utxo` plus a full re-render of the visible rows, all at urgent priority — so the caret and the next character wait for the scan. This is the send form, which is where the user is least tolerant of input lag and often has a device connected with a compose request in flight.

## Where

[`packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx:37`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx#L37) and [`CoinControl.tsx:107`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L107), with the per-row cost at [`UtxoSelectionList/UtxoSelectionList.tsx:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelectionList.tsx#L66).

`searchQuery` is local state in `CoinControl` ([`:49`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L49)), passed down to `UtxoSearch` as the `Input`'s `value` ([`UtxoSearch.tsx:53`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx#L53)) and back up through `setSearch` on every `change` event. That single urgent state update commits, in one task:

- `filterAndCategorizeUtxos` ([`suite-common/transaction-search/src/filterAndCategorizeUtxos.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/filterAndCategorizeUtxos.ts#L45)) over four arrays — the full `account.utxo` plus the three category arrays that partition it — so ≈2n calls to `filterUtxos` ([`:21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/filterAndCategorizeUtxos.ts#L21)), each doing up to three `toLowerCase().includes()` and two `Map` lookups. It sits directly in the render body, with no `useMemo`.
- The pagination slicing at [`CoinControl.tsx:124`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L124)–[`:137`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L137), which is cheap.
- A re-render of up to `utxosPerPage` rows ([`:119`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L119) → `getTxsPerPage`, [`suite-common/suite-utils/src/txsPerPage.ts:4`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-utils/src/txsPerPage.ts#L4) → `DEFAULT_TXS_PER_PAGE = 25`, [`packages/connect-common/src/constants/paging.ts:1`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/constants/paging.ts#L1)). Each row runs `accountTransactions.find(...)` over the account's loaded transaction history ([`UtxoSelectionList.tsx:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelectionList.tsx#L69)) — a history this very component eagerly fetches in full on mount ([`CoinControl.tsx:145`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L145)) — and then mounts a `UtxoSelection` with five `useSelector` calls ([`UtxoSelection.tsx:86`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx#L86)–[`:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx#L105)), a scan of the Suite Sync output labels ([`:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx#L138)), two `Labeling` widgets and several tooltips.

There is no debounce, no throttle and no transition anywhere on this path. The sibling transaction search in the same app does debounce — `useDebounce(..., 200, ...)` at [`TransactionList.tsx:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx#L66) — so the asymmetry is unintentional rather than a considered decision.

## Before

The handler, which updates two pieces of urgent state per character — [`UtxoSearch.tsx:35`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx#L35):

```tsx
const onSearch = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
        setSearch(target.value);
        setSelectedPage(1);
    },
    [setSearch, setSelectedPage],
);
```

The scan, unmemoised in the render body — [`CoinControl.tsx:106`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L106):

```tsx
// Filter UTXOs based on searchQuery
const { filteredUtxos, filteredSpendableUtxos, filteredLowAnonymityUtxos, filteredDustUtxos } =
    filterAndCategorizeUtxos({
        searchQuery,
        utxos: account.utxo || [],
        spendableUtxos,
        lowAnonymityUtxos,
        dustUtxos,
        outputLabels,
    });
```

The rows that re-render behind it — [`UtxoSelectionList.tsx:65`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelectionList.tsx#L65):

```tsx
<Column gap={4}>
    {utxos.map(utxo => (
        <UtxoSelection
            key={`${utxo.txid}-${utxo.vout}`}
            transaction={accountTransactions.find(transaction => transaction.txid === utxo.txid)}
            utxo={utxo}
        />
    ))}
</Column>
```

## After

Three changes, and all three are load-bearing — see the first note, because `useDeferredValue` on its own makes this worse, not better.

`CoinControl.tsx` — the import at [`:1`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L1) gains two hooks:

```tsx
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
```

and the scan is keyed on the deferred query, memoised so the urgent commit can reuse the previous result:

```tsx
// the scan is O(utxos), so the list lags the input by one commit instead of blocking it
const deferredSearchQuery = useDeferredValue(searchQuery);

// Filter UTXOs based on searchQuery
const { filteredUtxos, filteredSpendableUtxos, filteredLowAnonymityUtxos, filteredDustUtxos } =
    useMemo(
        () =>
            filterAndCategorizeUtxos({
                searchQuery: deferredSearchQuery,
                utxos: account.utxo || [],
                spendableUtxos,
                lowAnonymityUtxos,
                dustUtxos,
                outputLabels,
            }),
        [
            deferredSearchQuery,
            account.utxo,
            spendableUtxos,
            lowAnonymityUtxos,
            dustUtxos,
            outputLabels,
        ],
    );
```

`UtxoSelection.tsx` — the row is memoised so the urgent commit bails out of the 25 row bodies. The component body is unchanged; only the declaration and the export move, matching the `memo(…Inner)` idiom already used at [`TradingOffersModalItem.tsx:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingOffers/TradingOffersModalItem.tsx#L89):

```tsx
import { memo, type MouseEventHandler, type ReactNode } from 'react';

// …

const UtxoSelectionInner = ({ transaction, utxo }: UtxoSelectionProps) => {
    // …body unchanged…
};

export const UtxoSelection = memo(UtxoSelectionInner);
```

`UtxoSearch.tsx` is untouched: `searchQuery` stays the urgent controlled `value`, and `setSelectedPage(1)` stays urgent and in the same handler.

## Why it matters

The user is composing a Bitcoin transaction with coin control open and is typing a txid, address or label fragment to find a specific UTXO. `n` is `account.utxo.length` — one entry per unspent output, growing with every payment received and shrinking only when outputs are spent. Nothing caps it: a merchant or donation address accumulates without bound, and a coinjoin account is deliberately split into many small outputs. Per keystroke, today's commit holds the main thread for ≈2n `filterUtxos` calls plus 25 row renders, each of which itself walks the loaded transaction history. Everything in that commit is urgent, so it cannot be interrupted, and the next character cannot be painted until it finishes.

After the change the keystroke's own commit re-renders `CoinControl`'s body only — the amount arithmetic at [`:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L81)–[`:104`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L104), which is O(selected inputs + outputs), and the `Input` itself. The scan and the rows re-render at transition priority, where React can abandon the in-progress render when the next character arrives instead of finishing it first.

What the user sees changes: the list can lag the caret by a commit, so for one frame the results shown belong to the previous query. There is no timeout and no fixed delay involved — `useDeferredValue` always converges on the latest value as soon as the render finishes, so nothing can fail to appear.

**Honest sizing: P2, and a reviewer can reasonably reject it on `n`.** On an ordinary account with tens of UTXOs, ≈2n substring checks plus 25 rows is not near the 50 ms long-task bar and this changes nothing the user can perceive. The case rests on accounts in the thousands of UTXOs — coinjoin accounts and heavily-received addresses — where it is clearly over. If a reviewer's position is that such accounts are rare enough not to warrant a memo and a `memo()`, that is a defensible call.

## Notes

- **The After hunks have not been compiled.** They are written against the surrounding types by reading.
- **`useDeferredValue` alone would be a pessimisation here, which is why the memos are not optional.** React renders twice per deferred update: an urgent pass in which the deferred value still holds the _old_ query, then a transition pass with the new one. With the scan unmemoised, the urgent pass re-runs `filterAndCategorizeUtxos` with the stale query and produces fresh arrays, and with `UtxoSelection` unmemoised, all 25 rows re-render in that same urgent pass. The blocking part of the keystroke would be unchanged and the total work roughly doubled. The `useMemo` is what lets the urgent pass skip the scan; `memo` on the row is what lets it skip the rows. Any reviewer trimming this diff to "just the one-line `useDeferredValue`" should be pointed at this bullet.
- **Memoising `UtxoSelectionList` instead of the row would not work.** Its `heading`, `description` and `icon` props are `<Translation>` elements constructed inline at [`CoinControl.tsx:217`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L217)–[`:258`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L258), so a new identity every render and the memo would never hit. The row's props (`utxo`, `transaction`) are objects owned by the store and keep identity across a search-only re-render, so the bailout lands there. The consequence is that the per-row `accountTransactions.find` at [`UtxoSelectionList.tsx:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelectionList.tsx#L69) still runs in the urgent pass — that scan is #31125's defect, not this one's, and it is fixed there.
- **Scope: this is orthogonal to #31125 and #31126 and stacks with them.** Those two are complexity issues against the same component — the per-row transaction/selection scans and the sort comparator's rescan — and `p1-09` of the sibling `asymptotic-complexity` set extends #31125 to six more scans in `useUtxoSelection`. This document does not re-report any of them and does not depend on them. They reduce _how much_ work each pass does; this one changes _when_ it runs and whether it can be interrupted. If they all land, the transition pass simply becomes cheaper; if none of them land, the urgent commit is still fixed by this change. They touch different lines, so there is no merge conflict.
- **The memo is not a general cache, and its deps are honest about that.** `spendableUtxos`, `lowAnonymityUtxos` and `dustUtxos` are freshly allocated arrays on every render of `useUtxoSelection` ([`:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L89)–[`:114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L114)), so the memo drops whenever the send form re-renders for any other reason — a compose result arriving, the amount field changing. That is fine, because in those cases the categories genuinely differ and the scan has to re-run. It holds across search keystrokes specifically because `searchQuery` lives in `CoinControl` and does not re-render the provider above it, which is also why the `sortUtxos` call at [`useUtxoSelection.ts:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L94) is **not** on the keystroke path and is deliberately left alone here.
- **Ordering: `setSelectedPage(1)` must stay urgent.** It is reset in the same handler as the query, so during the intermediate frame the user sees page 1 of the _previous_ result set. That is visually acceptable and it converges on the next commit; deferring the page instead would let a stale page index be applied to fresh results, which is worse. One consequence: the first keystroke after paging forward does change `currentPage`, so the rows re-render in that urgent commit; from the second keystroke on, React bails out on the identical state value and they do not. `handleAllUtxosSelected` ([`CoinControl.tsx:161`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L161)) and the input's `onClear` ([`UtxoSearch.tsx:57`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx#L57)) both clear the urgent value and keep working unchanged.
- **`memo` on the row is safe for correctness, but check one assumption.** `UtxoSelection` reads the send form through `useSendFormContext()` and the store through `useSelector`, and neither is affected by `memo` — context and subscription updates re-render a memoised component normally. The assumption worth verifying is that a UTXO is never mutated in place: the props comparison is referential, so an in-place edit of a `utxo` object would be skipped. UTXOs are replaced wholesale on account update today, but confirm rather than take my word for it.
- **What I deliberately did not memoise.** The pagination slicing at [`:124`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L124) stays as it is — it is three `slice` calls bounded by the 25-per-page limit, so wrapping it would add a dependency array for no gain, and the row `memo` does not need the array identity to be stable.
- **`useDeferredValue` over a debounce.** A 200 ms `useDebounce`, copying [`TransactionList.tsx:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx#L66), would also stop the scan running per character and is a smaller diff. It is worse on two counts: it adds a fixed 200 ms of latency even on a small account where the scan was never a problem, and the render it eventually triggers is still urgent and still uninterruptible. `useDeferredValue` has no delay and abandons stale renders. Copying the debounce is nonetheless a legitimate fallback if a reviewer wants the smallest possible change.
- **Tests: there are none on this path.** The `data-testid="@wallet/send/search-icon"` at [`UtxoSearch.tsx:45`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx#L45) is not referenced by any test in the repo — the e2e wallet page object only wires up the transactions search box ([`suite/e2e/support/pageObjects/walletPage.ts:94`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/pageObjects/walletPage.ts#L94)) — and there is no unit test for `CoinControl`. [`suite-common/transaction-search/src/filterAndCategorizeUtxos.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/filterAndCategorizeUtxos.test.ts) covers the pure function, which this change does not touch. So nothing breaks, and nothing catches a regression either; an e2e case that types into the coin-control search and asserts the filtered rows would be worth adding with the fix.
- **Platform and packaging.** Web and desktop only; `packages/suite` is private and no published API changes. No new dependency and no shared helper needed — `yieldToMain`/`runWhenIdle` are for chunked loops and idle work, and this is a render. React is `19.2.3` ([`packages/suite/package.json:181`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L181)), so `useDeferredValue` is available with its optional initial value, which is not needed here.
- **Manual memoisation is required, not redundant.** `packages/suite` is not compiled by React Compiler — see [`skills/performance-react-hooks/SKILL.md`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-react-hooks/SKILL.md); only `suite-native` sets `experiments.reactCompiler`. The `useMemo` and the `memo` here would be redundant on mobile and are not on web.
- **This would be the repo's first `useDeferredValue` call site**, along with `p1-12` (token search) and `p1-13` (accounts sidebar), which apply the identical lever to two other unvirtualised search boxes. A reviewer may reasonably prefer one PR that lands the pattern at all three call sites rather than three separate ones.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
