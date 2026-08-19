Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx#L34) (destructuring default)
[`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx#L46) (unmemoized call)

## Before

```tsx
export const AccountSection = ({
    account,
    forceOnlyItemClick,
    hideStaking,
    selected,
    onItemClick,
}: AccountSectionProps) => {
    const {
        symbol,
        accountType,
        index,
        descriptor,
        formattedBalance,
        tokens: accountTokens = [],
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const showGroup = hasNetworkFeatures(account, 'tokens');

    const isStakeShownStored = useSelector(state =>
        selectAccountIsStakingActive(state, account.key),
    );
    const isStakeShown = !hideStaking && isStakeShownStored;

    const tokens = getTokens({
        tokens: accountTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });
```

## After

```tsx
const EMPTY_TOKENS: Account['tokens'] = [];

export const AccountSection = ({
    account,
    forceOnlyItemClick,
    hideStaking,
    selected,
    onItemClick,
}: AccountSectionProps) => {
    const {
        symbol,
        accountType,
        index,
        descriptor,
        formattedBalance,
        tokens: accountTokens = EMPTY_TOKENS,
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const showGroup = hasNetworkFeatures(account, 'tokens');

    const isStakeShownStored = useSelector(state =>
        selectAccountIsStakingActive(state, account.key),
    );
    const isStakeShown = !hideStaking && isStakeShownStored;

    const tokens = useMemo(
        () =>
            getTokens({
                tokens: accountTokens,
                symbol: account.symbol,
                tokenDefinitions: coinDefinitions,
            }),
        [accountTokens, account.symbol, coinDefinitions],
    );
```

## Why it matters

Neither `AccountSection` nor its parents (`AccountItemsGroup`, `AccountsList`) are `memo()`-wrapped, and this path isn't gated behind search/filter state, so it runs continuously: any unrelated re-render of the sidebar (a new `coinjoinIsPreloading`, `accountLegacyLabels`, or `discoveryStatus` value) re-walks every visible account's whole token list through `getTokens`, unconditionally, once per account, on every render — a cost that scales with how many tokens a busy EVM account holds.

## Notes

- Compile requirement: add `import { useMemo } from 'react';` — this file has no React import today.
- The `tokens: accountTokens = []` default is replaced with a module-level `EMPTY_TOKENS` constant so the new memo's own `accountTokens` dependency is stable too — otherwise the memo would never cache for token-less accounts, the same `?? []`-in-a-dependency shape the skill's own `useAccounts.ts:9` example warns about.
- Distinct from `p1-13-accounts-sidebar-filters-urgently-on-every-keystroke.md` in `perf-issues/scheduling/` (sibling draft, not yet filed), which already covers the _search-filter_ path's duplicate `getTokens` call in `AccountsList.tsx`. This doc is the _base_ render path that runs unconditionally for every account regardless of search/filter state.
- Sibling draft (not yet filed): `p3-01-cleanups-suite-hooks-and-components.md` batches the same-file-tree `TargetAddressLabel.tsx` fix (an `EMPTY_ADDRESSES` constant), the identical "module-level empty-array constant" mechanism applied to a different call site in this same scan area.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
