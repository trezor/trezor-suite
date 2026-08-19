# Every keystroke in the accounts sidebar search re-filters and re-renders the whole unvirtualised account list at urgent priority

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_, its closing rule: for work that is a React render rather than a loop, the lever is `startTransition` or `useDeferredValue`. This is the sidebar, not a page — `AccountsMenu` is mounted by `Sidebar` on every Suite route, so the render this keystroke commits competes with whatever the main pane is already doing, and the control being typed into is the wallet's primary navigation.

## Where

[`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSearchBox.tsx:23`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSearchBox.tsx#L23) dispatches straight through on change, with no debounce and no local state:

```tsx
            onChange={e => {
                setSearchString(e.target.value);
            }}
```

`setSearchString` is the redux action from `useAccountSearch` ([`useAccountSearch.tsx:36`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useAccountSearch.tsx#L36), reducer at [`accountSearchReducer.ts:38`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/accountSearchReducer.ts#L38)). `ReduxAccountSearchProvider` re-reads the slice ([`useAccountSearch.tsx:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useAccountSearch.tsx#L44)) and pushes the new value into context, where `AccountsList` picks it up at [`AccountsList.tsx:84`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L84).

Everything that follows is in the render body of `AccountsList`, with no `useMemo` and no `useTransition` anywhere on the path:

- the filter itself at [`AccountsList.tsx:93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L93);
- per account, `getTokens` ([`AccountsList.tsx:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L105); implementation [`suite-common/wallet-core/src/tokens/tokenUtils.ts:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L33)), which allocates two `Set`s and six arrays and walks that account's whole token list;
- per account, `accountSearchFn` ([`AccountsList.tsx:121`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L121); implementation [`suite-common/wallet-utils/src/accountUtils.ts:813`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L813)), whose `addressMatch` at [`:856`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L856) scans `addresses.used`, `addresses.unused` and `addresses.change`. It is a plain `const`, so it is evaluated eagerly for every account before the `||` chain at [`:877`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L877) gets a chance to short-circuit;
- then the survivors are rendered by `Accounts`, a bare `accounts.map` at [`AccountsList.tsx:42`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L42) — **no virtualisation** — into `AccountSection`, which calls `getTokens` for the same account a second time ([`AccountSection.tsx:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx#L46)) and then renders one to three `AccountItem`s, each with its own `useSelector` subscriptions and fiat formatting ([`AccountItemsGroup.tsx:68`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItemsGroup.tsx#L68)).

Two more consumers of the raw `searchString` have to move together with the filter, or the sidebar shows a frame in which the list and the empty-state disagree:

```tsx
{
    coinjoinIsPreloading && !searchString && !coinFilter && <AccountItemSkeleton />;
}
```

([`AccountsList.tsx:141`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L141)) and the no-results guard:

```tsx
if (!searchString) return null;
```

([`AccountsList.tsx:152`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L152)).

## Before

```tsx
const filteredAccounts =
    searchString || coinFilter
        ? accounts.filter(account => {
              const { key } = account;

              const accountLabel =
                  account.label ??
                  (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                      ? accountLegacyLabels[key]
                      : getDefaultAccountLabel(translationString, account)) ??
                  '';

              const { shownWithBalance } = getTokens({
                  tokens: account.tokens ?? [],
                  symbol: account.symbol,
                  tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
              });

              // Mirror the account type badge, which is hidden for normal accounts.
              const accountTypeTranslationId =
                  account.accountType === 'normal'
                      ? null
                      : getAccountTypeName({
                            path: account.path,
                            accountType: account.accountType,
                            networkType: account.networkType,
                        });

              return accountSearchFn(account, searchString, {
                  coinsFilter: coinFilter,
                  accountLabel,
                  searchableTokens: shownWithBalance,
                  accountTypeName: accountTypeTranslationId
                      ? translationString(accountTypeTranslationId)
                      : undefined,
              });
          })
        : accounts;
```

## After

Add to the top of the import block, above the existing blank line before `@suite/account`:

```tsx
import { useDeferredValue, useMemo } from 'react';
```

Then, replacing `AccountsList.tsx:84`–`:130` — the memo has to sit above the `if (!device)` early return, so that return moves below it:

```tsx
const { coinFilter, searchString } = useAccountSearch();
const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
const discoveryInProgress = discoveryStatus?.status === 'loading';
const tokenDefinitions = useSelector(selectTokenDefinitions);

// Filtering walks every account's addresses and tokens and its result re-renders the whole
// list, so it runs at transition priority and the input stays live while the list catches up.
const deferredSearchString = useDeferredValue(searchString);
const deferredCoinFilter = useDeferredValue(coinFilter);

const filteredAccounts = useMemo(
    () =>
        deferredSearchString || deferredCoinFilter
            ? accounts.filter(account => {
                  const { key } = account;

                  const accountLabel =
                      account.label ??
                      (Object.prototype.hasOwnProperty.call(accountLegacyLabels, key)
                          ? accountLegacyLabels[key]
                          : getDefaultAccountLabel(translationString, account)) ??
                      '';

                  const { shownWithBalance } = getTokens({
                      tokens: account.tokens ?? [],
                      symbol: account.symbol,
                      tokenDefinitions: tokenDefinitions[account.symbol]?.coin,
                  });

                  // Mirror the account type badge, which is hidden for normal accounts.
                  const accountTypeTranslationId =
                      account.accountType === 'normal'
                          ? null
                          : getAccountTypeName({
                                path: account.path,
                                accountType: account.accountType,
                                networkType: account.networkType,
                            });

                  return accountSearchFn(account, deferredSearchString, {
                      coinsFilter: deferredCoinFilter,
                      accountLabel,
                      searchableTokens: shownWithBalance,
                      accountTypeName: accountTypeTranslationId
                          ? translationString(accountTypeTranslationId)
                          : undefined,
                  });
              })
            : accounts,
    [
        accountLegacyLabels,
        accounts,
        deferredCoinFilter,
        deferredSearchString,
        tokenDefinitions,
        translationString,
    ],
);

if (!device) {
    return null;
}
```

and the two consumers below read the same deferred pair:

```tsx
{
    coinjoinIsPreloading && !deferredSearchString && !deferredCoinFilter && <AccountItemSkeleton />;
}
```

```tsx
if (!deferredSearchString) return null;
```

## Why it matters

The user is typing into the sidebar search — often via `CMD/CTRL + K`, which focuses this exact input ([`useAppShortcuts.tsx:106`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useAppShortcuts.tsx#L106)) — while a wallet page is loaded next to it.

`n` here is two nested things, and neither is bounded by the app:

- **Accounts.** One entry per (network, account type, index) that discovery found, filtered only by "enabled in settings and supported by the device" ([`selectAllAccountsToList`, `suite-common/wallet-core/src/selectors.ts:67`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/selectors.ts#L67)). With many coins enabled and several BTC account types this is dozens; the user can keep adding accounts, so there is no ceiling.
- **Per account, its addresses and its tokens.** `addressMatch` reads every address the account has ever used, which grows with the account's lifetime, and `getTokens` walks the token list, which on a busy EVM account is long and full of spam entries.

Every character typed commits all of that plus a full re-render of every surviving row, in the same task as the keystroke — and nothing on the path is memoised, so nothing is reused between characters. Fast typing therefore pays the whole cost once per character rather than once per settled query.

After the change the input is still urgent — `AccountSearchBox` renders `searchString` from context untouched, so the caret and the typed characters never lag. The list lags behind by one transition instead. React can abandon a transition render that a newer keystroke supersedes, so a burst of typing produces one final list rather than one list per character.

**Honest sizing.** `useDeferredValue` does not make any of this work cheaper — it moves it off the keystroke's frame and makes intermediate results discardable. React 19 can yield between components during the transition render, but the commit for the final list is still a single synchronous chunk; if a user with a very large account list still sees a stutter when the list lands, the remaining lever is virtualising `Accounts` and cutting the per-account cost, not scheduling.

## Notes

- **The `After` hunk has not been compiled.** It is written against the surrounding types by reading.
- **The `useMemo` is not optional, and it is the part most likely to be wrong.** Without it, `useDeferredValue` makes things _worse_: the urgent pass re-runs the filter with the old string and the transition pass runs it again with the new one, so each keystroke costs two full filters instead of one. With the memo, the urgent pass hits the previous transition's cached result. That only holds if the deps are reference-stable. `translationString` is `useCallback`-wrapped on `[intl]` ([`suite/intl/src/hooks/useTranslation.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/suite/intl/src/hooks/useTranslation.ts#L17)) and `accounts` comes from a weakMap-memoised selector ([`suite-common/suite-sync/src/data/account/selectAccountsWithSuiteSyncLabel.ts:40`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-sync/src/data/account/selectAccountsWithSuiteSyncLabel.ts#L40)), but `accountLegacyLabels` comes from `selectAccountLabelsLegacy`, which is **unmemoised and builds a fresh object on every call** ([`suite/metadata/src/metadataReducer.ts:219`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L219)). It survives only because this repo's `useSelector` defaults to `shallowEqual` ([`packages/suite/src/hooks/suite/useSelector.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useSelector.ts)) and therefore keeps the previous reference. That is a load-bearing accident and a reviewer should verify it holds before merging.
- **Adjacent bug I deliberately did not fix: the filter is not actually conditional.** `coinFilter` is always an array (`[]` in `accountSearchInitialState`, [`accountSearchReducer.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/wallet/accountSearchReducer.ts#L17), and `setCoinFilter` coerces with `?? []`), and `[]` is truthy, so `searchString || coinFilter` at [`:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L94) is **always** true — the `getTokens`-per-account pass runs on every sidebar render even when the user has never touched the search box. The same mistake makes `!coinFilter` at [`:141`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L141) always false, so that `AccountItemSkeleton` branch is dead code today. Changing it to `deferredCoinFilter.length > 0` is a one-word fix that is plausibly a bigger win than this whole document, but it is a behaviour change (the skeleton would start appearing during coinjoin preloading), so it belongs in its own PR with its own review. The `After` above preserves the current truthiness exactly.
- **Why `useDeferredValue` and not `startTransition` around the dispatch.** The value originates in redux, and react-redux 9.3.0 ([`packages/suite/package.json:188`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L188)) subscribes through `useSyncExternalStore`. React cannot defer an external-store update without risking tearing, so wrapping `setSearchString` in `startTransition` would defer nothing. Deferring in the consumer is the only lever that works here. React is 19.2.3 ([`packages/suite/package.json:181`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L181)), so `useDeferredValue` is available; `packages/suite` is **not** compiled with React Compiler (there is no react-compiler configuration in the repo), so the explicit `useMemo` is required rather than redundant.
- **There is no existing debounce to argue against.** `AccountSearchBox` has no local state, no `useDebounce`, and `@trezor/components`' `Input` does not debounce `onChange`. So this is genuinely "urgent state driving an expensive render", not "the debounce is set wrong". Worth saying because a debounce is the reflex fix and would be the worse one: it adds fixed latency to every query and cannot be interrupted, whereas the deferred render starts immediately and is abandoned when superseded.
- **What the user could notice.** For one frame after a keystroke the list shows the previous query's results. On a clear (`onClear`, [`AccountSearchBox.tsx:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSearchBox.tsx#L14)) the "no results" notice can persist for one extra frame before the full list returns. Nothing can get stuck: `useDeferredValue` always schedules the follow-up render, there is no timeout involved and no fallback path. Consider passing the deferred/current mismatch down as an opacity or spinner cue only if review asks for it — it was left out to keep the diff to one concern.
- **`coinFilter` and `searchString` are deferred together on purpose.** Two separate `useDeferredValue` calls stay consistent because both flip in the same transition pass. Do **not** collapse them into `useDeferredValue([searchString, coinFilter])` — a fresh array literal every render never compares equal, and React would schedule a deferred render forever.
- **Tests.** [`suite/e2e/tests/wallet/account-search.test.ts:30`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/wallet/account-search.test.ts#L30) fills the box and immediately asserts one account hidden and another visible; [`suite/e2e/tests/metadata/legacy/account-metadata.test.ts:66`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/metadata/legacy/account-metadata.test.ts#L66) types into the same input. Both use Playwright web-first assertions, which retry, so a one-transition lag should not break them — but "should not" is the honest word here, and both are worth running rather than reasoned about. There is no unit test for `AccountsList`.
- **Platform and packaging.** Web and desktop only. `packages/suite` is private, nothing published changes, and this document adds no dependency — unlike most of this sweep it needs neither `yieldToMain` nor `runWhenIdle`. The mobile accounts list is a different tree and is not covered here.
- **Same lever, three call sites.** `p1-12` (tokens table search) and `p2-05` (coin-control UTXO search) are the same `useDeferredValue` change on different trees. A reviewer may reasonably want one PR introducing the pattern across all three; this one is the best candidate to go first because the sidebar is on every route.
- **Orthogonal to the complexity sweep.** Reducing the per-account cost — the duplicated `getTokens` between [`AccountsList.tsx:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx#L105) and [`AccountSection.tsx:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx#L46), the eager `addressMatch`, and the unmemoised `selectAccountLabelsLegacy` scan (`p1-06` of the sibling `asymptotic-complexity` set) — is a different fix that stacks with this one. This document does not re-report any of it.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
