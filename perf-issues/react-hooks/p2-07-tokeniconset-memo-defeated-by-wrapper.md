Extracted from the `skills/performance-react-hooks/SKILL.md` audit — sections _"Relocate render-body work before memoizing it, and memoize only what pays"_ and _"Keep hook dependencies referentially stable"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:26`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TokenIconSetWrapper.tsx#L26) (also line 60) — unmemoized `flatMap`/`getTokens`/`reduce`/`sort` chain

[`packages/product-components/src/components/TokenIconSet/TokenIconSet.tsx:30`](https://github.com/trezor/trezor-suite/blob/develop/packages/product-components/src/components/TokenIconSet/TokenIconSet.tsx#L30) — the correctly-written `useMemo` the wrapper defeats every render

## Before

```tsx
// TokenIconSetWrapper.tsx:26-60 — no useMemo anywhere in this chain
const allTokensWithRates = accounts.flatMap(account =>
    enhanceTokensWithRates(account.tokens, baseCurrencyCode, symbol, fiatRates),
);

if (!allTokensWithRates.length) return null;

const tokens = getTokens<TokensWithRates>({
    tokens: allTokensWithRates,
    symbol,
    tokenDefinitions: coinDefinitions,
})?.shownWithBalance;

const aggregatedTokens = Object.values(
    tokens.reduce((acc: Record<string, TokensWithRates>, token) => {
        const { contract, balance, fiatValue } = token;

        if (!acc[contract]) {
            acc[contract] = {
                ...token,
                balance: balance ?? '0',
                fiatValue: fiatValue ?? BigNumber(0),
            };
        } else {
            const existingBalance = parseFloat(acc[contract].balance ?? '0');
            const newBalance = existingBalance + parseFloat(balance ?? '0');
            acc[contract].balance = newBalance.toString();

            acc[contract].fiatValue = acc[contract].fiatValue.plus(fiatValue);
        }

        return acc;
    }, {}),
);

const sortedAggregatedTokens = aggregatedTokens.sort(sortTokensWithRates);
```

```tsx
// TokenIconSet.tsx:30-55 — this memo is written correctly; `tokens` (== sortedAggregatedTokens
// above) is simply never referentially stable across renders, so it never hits
const visibleTokensContent = useMemo(() => {
    const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

    return visibleTokens.map(token => {
        /* … */
    });
}, [tokens, maxVisibleIcons, symbol, size, gap, length]);
```

## After

The fix lives entirely in `TokenIconSetWrapper.tsx` — wrap the whole chain in one `useMemo`, and turn the early `return null` into a check on the memoized result so it doesn't follow a conditional hook call:

```tsx
const sortedAggregatedTokens = useMemo(() => {
    const allTokensWithRates = accounts.flatMap(account =>
        enhanceTokensWithRates(account.tokens, baseCurrencyCode, symbol, fiatRates),
    );

    const tokens = getTokens<TokensWithRates>({
        tokens: allTokensWithRates,
        symbol,
        tokenDefinitions: coinDefinitions,
    })?.shownWithBalance;

    const aggregatedTokens = Object.values(
        tokens.reduce((acc: Record<string, TokensWithRates>, token) => {
            // ...same reduce body as today, unchanged...
            return acc;
        }, {}),
    );

    return aggregatedTokens.sort(sortTokensWithRates);
}, [accounts, symbol, baseCurrencyCode, fiatRates, coinDefinitions]);

if (!sortedAggregatedTokens.length) return null;

const size = sortedAggregatedTokens.length === 1 ? 24 : 20;
```

`TokenIconSet.tsx` itself needs no change — its `useMemo` starts caching correctly as soon as it receives a stable `tokens` prop.

## Why it matters

`TokenIconSetWrapper` renders once per network row of the dashboard's My Assets table/grid, and re-renders on every fiat-rate tick or account update touching _any_ row, not just its own. Every one of those re-renders currently redoes the full `flatMap` → `getTokens` (2+ BigNumber allocations per token) → `reduce` → `sort` chain from scratch, and the fresh array it produces feeds straight into `TokenIconSet`'s otherwise-correctly-written `useMemo`, which as a result can never actually cache — so the per-icon `<TokenIcon>` element list is also rebuilt from scratch on every one of those renders, regardless of whether this row's own tokens or rates changed.

## Notes

- Compile requirement: add `import { useMemo } from 'react';` to `TokenIconSetWrapper.tsx` — the file currently has no React import at all.
- Boundary with `p2-17-tokeniconsetwrapperx-tokeniconsetwrapper.md` in `perf-issues/asymptotic-complexity/` (sibling draft, not yet filed): that doc fixes _what_ is passed in — `accounts` should be the row's own accounts, not the whole device's account list, an O(n)-sizing fix. This doc fixes _how often_ the chain re-runs regardless of n — there is no memoization at all today. The two are independent and additive; landing one doesn't obsolete the other. That doc's own Notes section already flags this same missing memo as an optional aside ("Optionally also wrap … in a `useMemo`"); this is the hooks-class write-up of that aside, extended to also cover the downstream `TokenIconSet` symptom.
- `packages/suite` is not React-Compiler-compiled, so the wrapper needs the manual `useMemo`. `TokenIconSet.tsx` lives in `packages/product-components`, which also ships to `suite-native`, but nothing changes there since that file needs no edit.
- `size` (line 61 today) can stay outside the memo — it's an O(1) derivation from the memoized array's `.length` and doesn't need its own memoization.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
