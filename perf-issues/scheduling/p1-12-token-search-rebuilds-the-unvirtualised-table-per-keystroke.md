# The token search box holds urgent state that drives an un-virtualised table, so every keystroke commits a re-render of every token row

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, specifically its closing clause: for work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`, not a chunked loop. This call site is the clearest instance in the app: one `useState` in `views/wallet/tokens/index.tsx` is simultaneously the controlled value of the search `Input` and the filter input for the entire token table, and the table renders one row per match with no windowing. The keystroke and the table therefore share a single commit, and the caret waits for the table.

## Where

[`packages/suite/src/views/wallet/tokens/index.tsx:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L20) holds `searchQuery`. It is passed down twice: to `TokensNavigation` ([`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L67)), which renders the controlled `Input` ([`TokensNavigation.tsx:184`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L184)), and to all four tab tables — `CoinsTable` ([`:75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L75)), `HiddenTokensTable` ([`:78`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L78)), `InactiveTokensTable` ([`:84`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L84)) and `DefiTokensTable` ([`:90`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L90)).

The filter itself is `getTokens` ([`suite-common/wallet-core/src/tokens/tokenUtils.ts:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L33)): one `forEach` over every token ([`:58`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L58)), with the search test at [`:63`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L63)–[`:69`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L69) doing up to five `toLowerCase().includes()` per token ([`isTokenMatchesSearch`, `suite-common/wallet-utils/src/tokenUtils.ts:101`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/tokenUtils.ts#L101)) and a `new BigNumber(...)` per surviving token.

**The table is genuinely un-virtualised** — read, not assumed. `TokensTable` maps the full arrays: `tokensWithBalance.map` at [`TokensTable.tsx:100`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L100) and `tokensWithoutBalance.map` at [`:127`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L127), with no slicing or paging above them. The `Table` primitive underneath is a plain `<table>` ([`packages/components/src/components/Table/Table.tsx:53`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Table/Table.tsx#L53)) whose body is a bare `<tbody>` ([`TableBody.tsx:7`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Table/TableBody.tsx#L7)) — a horizontal scroll shadow and nothing else. Zero-balance rows are collapsed via an `isCollapsed` prop ([`TokensTable.tsx:137`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L137)), not unmounted, so they render even when hidden.

Each row is not cheap. `TokenRow` ([`TokenRow.tsx:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRow.tsx#L43)) runs two `useSelector` calls ([`:54`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRow.tsx#L54), [`:55`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRow.tsx#L55)), `useTokenYieldBadge` ([`:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRow.tsx#L58)), a `TokenIcon`, `BaseCurrencyValue`, `PriceTicker` and `TrendTicker`, and mounts `TokenRowActions`, which adds six more `useSelector` calls ([`TokenRowActions.tsx:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRowActions.tsx#L105)–[`:118`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokenRowActions.tsx#L118)). `TokenRow` is not wrapped in `memo`.

There is no debounce and no throttle anywhere on this path. The transaction list next door debounces its search 200 ms ([`TransactionList.tsx:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx#L66)) and the asset picker throttles 250 ms ([`useSearchFilter.ts:6`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/asset-picker/hooks/useSearchFilter.ts#L6)); the token search has neither.

## Before

[`packages/suite/src/views/wallet/tokens/index.tsx:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L20) — one piece of state for the input and for the table:

```tsx
const [searchQuery, setSearchQuery] = useState('');
```

[`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L67)–[`:76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L76) — the same value reaches the navigation and the first table (the three other `Route` blocks at [`:77`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L77)–[`:91`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L91) pass it identically):

```tsx
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onManualActivation={handleManualActivation}
                    showManualActivation={showManualActivationButton}
                />
                <Route name="wallet-tokens">
                    <CoinsTable selectedAccount={selectedAccount} searchQuery={searchQuery} />
                </Route>
```

[`TokensNavigation.tsx:184`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L184)–[`:186`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L186) — the keystroke enters as an urgent state update:

```tsx
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    onClear={() => setSearchQuery('')}
```

[`coins/CoinsTable.tsx:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx#L56)–[`:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx#L66) — recomputed in the same commit, because `searchQuery` is one of its dependencies:

```tsx
const tokens = useMemo(() => {
    const groupedTokens = getTokens({
        tokens: enhancedTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
        searchQuery,
    });
    groupedTokens.shownWithoutBalance.sort(sortTokensByName);

    return groupedTokens;
}, [enhancedTokens, account.symbol, coinDefinitions, searchQuery]);
```

## After

Both halves are in one file. The input keeps the urgent value; only the tables get the deferred one.

[`packages/suite/src/views/wallet/tokens/index.tsx:1`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L1):

```tsx
import { useDeferredValue, useEffect, useState } from 'react';
```

[`:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L20):

```tsx
const [searchQuery, setSearchQuery] = useState('');
// The input repaints per keystroke; the table re-renders at transition priority, so a
// half-finished filter is thrown away when the next character arrives.
const deferredSearchQuery = useDeferredValue(searchQuery);
```

[`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L67)–[`:76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L76), and the same substitution in the three remaining `Route` blocks:

```tsx
                <TokensNavigation
                    selectedAccount={selectedAccount}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onManualActivation={handleManualActivation}
                    showManualActivation={showManualActivationButton}
                />
                <Route name="wallet-tokens">
                    <CoinsTable
                        selectedAccount={selectedAccount}
                        searchQuery={deferredSearchQuery}
                    />
                </Route>
```

Nothing changes inside `TokensNavigation`, `CoinsTable`, `HiddenTokensTable`, `InactiveTokensTable`, `DefiTokensTable`, `TokensTable` or `TokenRow`. No helper from `@trezor/utils` is needed — this is the one document in the sweep that needs neither `yieldToMain` nor `runWhenIdle`.

## Why it matters

The user is typing a token name into the search box on the Tokens, Hidden or DeFi tab. `n` is `account.tokens.length` — every asset the backend has ever reported for that account, which is not a list the user curated: on EVM chains any contract can push a transfer to any address, so airdrop and spam tokens accumulate on used mainnet addresses without consent, and nothing between the backend response and `getTokens` caps the array. A long-lived Ethereum account can therefore carry far more token entries than the user believes they own, and every one of them is a candidate row.

Because `searchQuery` is urgent state, one keystroke produces one synchronous commit that contains: `getTokens` over the whole token array unmemoised in `TokensNavigation` for the tab counts ([`:126`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L126)), `getTokens` again in the active table, a `sortTokensByName` over the zero-balance group, and then the mount/unmount of the whole matched row set — each row carrying eight Redux subscriptions and four price/rate components. The next character cannot be painted until that finishes, and each character narrows the set, so the rows are torn down and rebuilt rather than updated in place.

After the change the input's own re-render stays urgent and paints immediately; the table subtree re-renders at transition priority, where React can interrupt it and discard the in-progress result when the next keystroke lands. The user sees their typing keep up, and the table settles one commit behind.

**Honest sizing: the win is responsiveness, not speed, and `n` may be smaller than the argument assumes.**

- `useDeferredValue` does not make the table render cheaper. The same filter, sort and row work happens; it happens at a priority React is allowed to abandon. On a search that narrows monotonically, most of that abandoned work is genuinely wasted work removed — but on the final keystroke the full render still happens, and the commit phase is not interruptible, so the last update still lands as one block.
- For an account with a handful of tokens — which is most accounts, and all Bitcoin-like accounts, which have no token tab at all — this is invisible. The claim rests entirely on the unbounded-token-list premise. A reviewer who has numbers showing real accounts sit at tens of rows should rank this P3, not P1.
- The correct fix for hundreds of rows is virtualisation. This is the cheap mitigation that does not require redesigning the table.

## Notes

- **The After hunk has not been compiled.** It is written against the surrounding types by reading. It is a four-line change in one file.
- **The existing `useMemo` is not the fix and does not make the render cheap.** `CoinsTable.tsx:56` and `DefiTokensTable.tsx:48` both list `searchQuery` in their dependency arrays, so the memo invalidates on every keystroke by construction — it exists to skip recompute when _other_ state changes, not this one. Even a hit would not help: the memo returns object identities that feed `TokensTable`, and `TokenRow` is not `memo`-wrapped, so every row re-renders regardless. `HiddenTokensTable` has no memo at all — [`:23`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/hidden-tokens/HiddenTokensTable.tsx#L23)–[`:35`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/hidden-tokens/HiddenTokensTable.tsx#L35) runs a `toSorted` plus two full `getTokens` passes in the render body on every keystroke.
- **No auto-memoization backstop here.** React Compiler is enabled only for mobile (`experiments.reactCompiler: true`, [`suite-native/app/app.config.ts:326`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/app.config.ts#L326)); `packages/suite` is not compiled, so what is written is what runs.
- **Why `useDeferredValue` rather than the debounce used next door.** A debounce imposes a fixed delay on everyone and still commits urgently when it fires; `useDeferredValue` is interruptible and has no delay at all, so on a short token list the table updates in the same frame as today, and on a long one it degrades gracefully. It also needs no new state and no timer to clean up.
- **All four tables must get the deferred value, not just the row lists.** `TokensTable` uses the `searchQuery` prop for the "no search results" branch ([`:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L66)). If the empty-state check saw the urgent query while the rows saw the deferred one, the table would flash "no results" a commit before the filtered rows arrived. Passing the deferred value everywhere keeps the branch and the rows consistent.
- **Ordering and convergence.** The deferred value lags by at most one commit and always converges; there is no re-entrancy and no cancellation to manage. The reset effect in `TokensNavigation` ([`:149`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L149)–[`:151`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L151)), which clears the query when the account changes, converges the same way. The one-shot effect dispatching `tradingThunks.loadInitialDataThunk` ([`TokensTable.tsx:60`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L60)–[`:62`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx#L62)) depends only on `dispatch`, so deferring does not change how often it runs.
- **What the user could notice.** On a long list the table is briefly one keystroke stale while the input is current. Nothing guarantees a deadline the way an idle `timeout` would — React commits the deferred render as soon as it is not being preempted, which on a busy main thread is the same moment the urgent version would have finished. If reviewers want the staleness made visible, the usual affordance is reduced opacity on the table while `deferredSearchQuery !== searchQuery`. Deliberately left out of the After: that is a design decision, not a performance one.
- **Tests.** There are no unit tests anywhere under `packages/suite/src/views/wallet/tokens`, and no e2e exercises the token search box, so this change has no coverage to break and none to lean on. Note a trap for anyone adding one: `data-testid="@wallet/accounts/search-icon"` is used by both this input ([`TokensNavigation.tsx:180`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L180)) and the transaction list's ([`TransactionListActions.tsx:91`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/TransactionListActions.tsx#L91)), and the existing selector for it resolves to the transaction one ([`suite/e2e/tests/wallet/transactions.test.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/wallet/transactions.test.ts#L44)).
- **Published-package impact: none.** `packages/suite` is private and nothing outside it changes. React 19.2.3 is pinned repo-wide ([`package.json:113`](https://github.com/trezor/trezor-suite/blob/develop/package.json#L113)), so `useDeferredValue` is available without any dependency change.
- **Deliberately not changed.** The NFT tab holds the same urgent state ([`views/wallet/nfts/index.tsx:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/nfts/index.tsx#L14)) and reuses the same `TokensNavigation`; the identical one-line change applies and probably belongs in the same PR, but I did not read `NftsTablesSection`'s render path end to end and am not claiming its per-row cost here. Also left alone: the unmemoised `getTokens` for the tab counts at `TokensNavigation.tsx:126`, which stays urgent because the counts must track the input — deferring does nothing for it, and making it cheaper is a complexity fix, not a scheduling one.
- **Virtualisation is a follow-up, not a swap.** `packages/components` does ship a `VirtualizedList` ([`VirtualizedList.tsx:257`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/VirtualizedList/VirtualizedList.tsx#L257)), but it absolutely positions items inside a `div`, which does not compose with the `<table>`/`<tbody>` structure `TokensTable` renders. Windowing this table means rebuilding it off the `Table` primitive.
- **Related work.** p1-13 (accounts sidebar) and p2-05 (coin-control UTXO search) are the same lever at two other call sites; a reviewer may reasonably want all three in one PR that establishes the pattern. In the complexity sweep, `p2-25` (`getTokens` re-normalises the query inside the loop) and `p2-19` (`sortTokensWithRates` allocates per comparison) make this exact per-keystroke pass cheaper. They are independent of this change and compose with it: those reduce the constant, this one takes it off the urgent path.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
