Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Pick the ref hook by when `.current` is read"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/hooks/useAccountWithTokensOptions.ts:57,59-98`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/hooks/useAccountWithTokensOptions.ts#L57-L98) — global Send asset picker

[`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:90,92-93,171-179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts#L90-L179) — Trading sell-asset picker (same name, different file, from the same copy-pasted shape)

[`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts:59,61-62,180`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts#L59-L180) — Trading buy-asset picker

## Before

All three hooks share the identical shape: a `useCurrentRef(fiatRates)` declared alongside a
`useThrottle`d accounts list, then read through `.current` inside the very next `useMemo`.

```tsx
// useAccountWithTokensOptions.ts (GlobalSendModal) :55-98
// Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
const throttledAccounts = useThrottle(accounts, 1000);
const fiatRatesRef = useCurrentRef(fiatRates);

const accountsAndTokensSortedByCoin = useMemo(() => {
    const fiatRates = fiatRatesRef.current;

    if (!fiatRates) {
        return [];
    }

    const networkAccounts = filterAccountsByNetworkSymbol(throttledAccounts, networkSymbolFilter);

    return networkAccounts.map(account => {
        /* ...builds sorted tokens/hidden-tokens per account using `fiatRates`... */
    });
}, [fiatRatesRef, throttledAccounts, networkSymbolFilter, baseCurrencyCode, tokenDefinitions]);
```

The other two repeat the same two-part shape, just with more logic inside the memo body:

```tsx
// useAccountWithTokensOptions.ts (TradingFormInputSellAsset/AssetPickerModal) :88-93,171-179
const throttledAccounts = useThrottle(accounts, 1000);
const fiatRatesRef = useCurrentRef(fiatRates);

const { networks, accountsWithTokens, supportedCryptoIds } = useMemo(() => {
    const fiatRates = fiatRatesRef.current;

    if (!fiatRates) {
        return { accountsWithTokens: [], networks: [], supportedCryptoIds: new Set() };
    }
    /* ...validAccounts / supportedNetworkAccounts / sorted tokens, all keyed off `fiatRates`... */
}, [
    fiatRatesRef,
    throttledAccounts,
    networkSymbolFilter,
    includedCryptoIds,
    tokenDefinitions,
    baseCurrencyCode,
    excludedCryptoIds,
]);
```

```tsx
// useAgregatedAccountsWithTokens.ts (TradingFormInputBuyAsset) :58-62,180
const throttledAccounts = useThrottle(accounts, 3000);
const fiatRatesRef = useCurrentRef(fiatRates);

return useMemo(() => {
    const fiatRates = fiatRatesRef.current;

    if (!fiatRates) {
        return [];
    }
    /* ...aggregates accounts/tokens per network and sorts by fiat balance... */
}, [throttledAccounts, baseCurrencyCode, fiatRatesRef, tokenDefinitions]);
```

## After

Per the skill: "the only correct choice when the ref is read in render or inside a `useMemo`" is
`useFreshRef`, not `useCurrentRef`. `useFreshRef` assigns `.current` synchronously during render, so
it already holds this render's value by the time the memo body (declared right after it, in the same
render) reads it — `useCurrentRef` only assigns in an effect that runs after commit, so a memo that
recomputes for some unrelated reason can still read the _previous_ commit's rate. The fix is the same
one-line swap at all three sites; nothing else in any of the three hooks changes:

```tsx
import { useFreshRef } from '@trezor/react-utils';

// ...

const fiatRatesRef = useFreshRef(fiatRates);
```

## Why it matters

`fiatRatesRef` is a stable ref object, so listing it in each memo's own dependency array (already done
at all three sites) never by itself triggers a recompute — these memos only re-evaluate when
`throttledAccounts`/`networkSymbolFilter`/`baseCurrencyCode`/`tokenDefinitions`/etc. change. When one
of those does force a recompute, `useCurrentRef`'s `.current` can still be the fiat rate from _before_
the previous render's rate update, because its own internal effect updates it only after commit. The
sorted fiat balances and fiat-based ordering shown in the Send asset picker and both Trading asset
pickers can therefore lag the real fiat rate by more than the usual one-render window the
ref-updated-in-an-effect pattern is normally good for.

## Notes

- No new imports needed beyond swapping the named import (`useCurrentRef` → `useFreshRef`) — both are
  exported from `@trezor/react-utils`
  ([`packages/react-utils/src/index.ts:14-15`](https://github.com/trezor/trezor-suite/blob/develop/packages/react-utils/src/index.ts#L14-L15)).
- Alternative considered and not proposed: keep `useCurrentRef` but make the throttle explicit —
  `const throttledFiatRates = useThrottle(fiatRates, 1000)`, put `throttledFiatRates` directly in the
  memo's own deps instead of a ref. That would also fix the staleness, but it changes the recompute
  cadence (the memo would now also re-run on every throttle-interval fiat tick, not only when the other
  listed deps change), which is a bigger behavioral change than the codebase currently has anywhere
  else in these three hooks. `useFreshRef` is the smaller, skill-prescribed fix, since these reads all
  happen inside a `useMemo`, not a later effect or callback.
- All three files are `packages/suite`, not React-Compiler-covered, so this is a manual fix either way.
- In-repo contrast confirming the mechanism: `packages/suite/src/components/dashboard/DashboardSection.tsx:41-45`'s
  `useCurrentRef(onCollapseChange)` is read inside a `useEffect` declared immediately after it (not a
  memo) — hook-declaration order guarantees that ref's own effect commits before the reading effect
  runs, so `useCurrentRef` is the _correct_ choice there. Same for
  `packages/suite/src/views/wallet/staking/components/SolStakingDashboard/SolStakingDashboard.tsx:70-75`.
  `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/GlobalSendModal.tsx:61,68,76`
  and
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs.tsx:57-58`/`TradingExchangeFormInputs.tsx:109-112`/`TradingSellFormInputs.tsx:90`
  all read their own `useCurrentRef` values only inside click-driven callbacks, well after any
  same-commit ordering concern applies — also correct. This doc's three sites are the only ones in
  either scanned area where a `useCurrentRef` is read inside a `useMemo` body.
- Confidence is high on the mechanism (verified `useFreshRef`/`useCurrentRef`'s own implementations at
  `packages/react-utils/src/hooks/useFreshRef.ts` and `useCurrentRef.ts`) and medium on user-visible
  impact, since how often `selectCurrentFiatRates` actually ticks in practice wasn't measured for this
  sweep.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
