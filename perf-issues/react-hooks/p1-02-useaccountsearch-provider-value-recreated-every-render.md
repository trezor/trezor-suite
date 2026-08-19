Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/suite/useAccountSearch.tsx:43-57`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useAccountSearch.tsx#L43-L57)
(Provider's JSX at `:47-56`)

Provider's mount point, whose own re-renders drive this:
[`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu.tsx:22-23,47`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu.tsx#L22-L23)

## Before

```tsx
export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const filters = useSelector(state => selectAccountSearch(state));
    const actions = useReduxAccountSearchActions();

    return (
        <AccountSearchContext.Provider
            value={{
                ...filters,
                ...actions,
            }}
        >
            {children}
        </AccountSearchContext.Provider>
    );
};
```

`filters` comes from a plain selector and `actions` is already correctly memoized on `[dispatch]`
(`useReduxAccountSearchActions`, same file), so both inputs are individually stable — only the inline
spread creating the `value` object is not.

## After

```tsx
export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const filters = useSelector(state => selectAccountSearch(state));
    const actions = useReduxAccountSearchActions();

    const value = useMemo(() => ({ ...filters, ...actions }), [filters, actions]);

    return <AccountSearchContext.Provider value={value}>{children}</AccountSearchContext.Provider>;
};
```

`useMemo` is already imported in this file (used by `useReduxAccountSearchActions`), so no new import
is needed. Because `filters` and `actions` are already stable individually, this memo will actually
hold across renders where neither changed.

## Why it matters

Every consumer of `useAccountSearch()` — `AccountSearchBox`, `AccountsList` (the accounts sidebar
rows), `CoinsFilter`, `AccountsMenuHeader`, plus `AddAccountModal` and `AssetActionButton` elsewhere —
re-renders whenever `ReduxAccountSearchProvider` re-renders, because a Context consumer re-renders on
any new `value` reference regardless of whether the fields inside it actually changed.
`ReduxAccountSearchProvider`'s mount point, `AccountsMenu`, reads `selectSelectedDevice` as a whole,
unnarrowed device object and `selectDiscoveryOverallStatus`, both of which change reference on most
device/discovery-related store updates — so the sidebar's search/filter context churns considerably
more often than the underlying filter/search state does.

## Notes

- No new imports beyond `useMemo`, already present in this file.
- `packages/suite` is not React-Compiler-covered, so this manual memoization is the correct and only
  mechanism here (contrast with `suite-native`, where a compiled component would need the source of
  the instability fixed instead).
- `AccountsMenu` is the Provider's only mount point in the app
  (`packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu.tsx:47`), and is
  itself rendered by `Sidebar`, which every page's shell mounts — see sibling draft p1-01 (not yet
  filed), which covers a separate defect that re-renders this same `Sidebar` subtree on every page
  render. The two compound but neither depends on the other being fixed.
- Confirmed 6 consumers via `useAccountSearch()`: `AccountSearchBox.tsx`, `AccountsList.tsx`,
  `AccountsMenuHeader.tsx`, `CoinsFilter.tsx`, `AddAccountModal.tsx`, `AssetActionButton.tsx`.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
