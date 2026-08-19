Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_, covering two compounding defects on the
dashboard's asset table/grid: the parent's unmemoized prop pipeline, and a per-row component that
independently re-derives portfolio-wide data. Found by sweep, not named in the doc.

## Where

1. [`packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:92-172`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx#L92-L172)
   — the `assets`/`assetSymbols`/`assetsData` construction and the `useAssetsFiatBalances` call,
   entirely unmemoized in the render body. Feeds `AssetRow`'s `memo()` wrap
   ([`AssetTable/AssetRow.tsx:48`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx#L48))
   via [`AssetTable.tsx:49-63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetTable.tsx#L49-L63),
   and feeds `AssetCard.tsx:246-261` (not itself `memo()`-wrapped).
2. [`packages/suite/src/views/dashboard/AssetsView/AssetCoinLogo.tsx:22-31`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetCoinLogo.tsx#L22-L31)
   — `calculateAssetsPercentage(assetsFiatBalances)` re-run once per row/card instance. Rendered
   from both [`AssetTable/AssetRow.tsx:136-139`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx#L136-L139)
   (table view) and [`AssetCard/AssetCardInfo.tsx:18-22`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/AssetsView/AssetCard/AssetCardInfo.tsx#L18-L22)
   (card view).

## Before

### 1. `AssetsView.tsx` — no memoization anywhere in the prop pipeline

```tsx
const useAssetsFiatBalances = (
    assetsData: AssetData[],
    accounts: { [key: string]: Account[] },
    localCurrency: BaseCurrencyCode,
    currentFiatRates?: RatesByKey,
) =>
    assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
        /* ...unchanged... */
        return [...acc, { fiatBalance, symbol: asset.network.symbol }];
    }, []);

export const AssetsView = () => {
    const accounts = useSelector(selectAllAccountsToList);
    // ...

    const assets: PartialRecord<NetworkSymbol, Account[]> = {};
    accounts.forEach(account => {
        /* groups into `assets` — fresh object every render */
    });

    const assetSymbols = typedObjectKeys(assets).filter(symbol => isNetworkSymbol(symbol));

    const assetsData: AssetData[] = assetSymbols.map((symbol): AssetData => {
        const network = getNetwork(symbol);
        const assetTokens = assets[symbol]?.reduce(/* ... */);
        const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

        return {
            network,
            failed: !!assetFailed,
            assetNativeCryptoBalance: /* ... */,
            assetTokens: assetTokens?.length ? assetTokens : [],
            stakingAccounts: accounts.filter(/* p2-26's territory, untouched by this doc */),
            accounts,
            isStakeNetwork: getNetworkFeatures(symbol).includes('staking'),
        };
    });

    const assetsFiatBalances = useAssetsFiatBalances(
        assetsData,
        assets,
        baseCurrencyCode,
        currentFiatRates,
    );
    // ...
```

`useAssetsFiatBalances` is named like a hook but calls none — it's a plain `.reduce()` invoked
directly in the render body, allocating a fresh array every call.

### 2. `AssetCoinLogo.tsx` — re-derives the whole portfolio's percentages per instance

```tsx
export const AssetCoinLogo = ({ symbol, assetsFiatBalances, index }: AssetCoinLogoProps) => {
    const locale = useSelector(selectLanguage);
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);

    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;
    const { color: networkColor } = getNetworkConfig(symbol);
    // ...
};
```

`calculateAssetsPercentage` is an O(n) `reduce` + O(n) `map` over every asset
(`suite-common/assets/src/utils.ts:13-36`); calling it once per row/card for N assets is O(N²) per
render of the whole table/grid.

## After

### 1. `AssetsView.tsx` — memoize the pipeline; make `useAssetsFiatBalances` a genuine hook

```tsx
const useAssetsFiatBalances = (
    assetsData: AssetData[],
    accounts: { [key: string]: Account[] },
    localCurrency: BaseCurrencyCode,
    currentFiatRates?: RatesByKey,
) =>
    useMemo(
        () =>
            assetsData.reduce<AssetFiatBalance[]>((acc, asset) => {
                /* ...unchanged body... */
                return [...acc, { fiatBalance, symbol: asset.network.symbol }];
            }, []),
        [assetsData, accounts, localCurrency, currentFiatRates],
    );

export const AssetsView = () => {
    const accounts = useSelector(selectAllAccountsToList);
    // ...

    const { assets, assetSymbols, assetsData } = useMemo(() => {
        const assets: PartialRecord<NetworkSymbol, Account[]> = {};
        accounts.forEach(account => {
            /* ...unchanged... */
        });

        const assetSymbols = typedObjectKeys(assets).filter(symbol => isNetworkSymbol(symbol));

        const assetsData: AssetData[] = assetSymbols.map((symbol): AssetData => {
            /* ...unchanged body... */
        });

        return { assets, assetSymbols, assetsData };
    }, [accounts]);

    const assetsFiatBalances = useAssetsFiatBalances(
        assetsData,
        assets,
        baseCurrencyCode,
        currentFiatRates,
    );

    const percentageBySymbol = useMemo(
        () =>
            new Map(
                calculateAssetsPercentage(assetsFiatBalances).map(a => [a.symbol, a.fiatPercentage]),
            ),
        [assetsFiatBalances],
    );
    // ...at both render sites, pass percentageShare={percentageBySymbol.get(asset.network.symbol)}
    // instead of assetsFiatBalances={assetsFiatBalances} to <AssetRow>/<AssetCard>
```

### 2. `AssetCoinLogo.tsx` — accept the scalar directly

```tsx
type AssetCoinLogoProps = {
    symbol: NetworkSymbol;
    percentageShare?: number;
    index?: number;
};

export const AssetCoinLogo = ({ symbol, percentageShare, index }: AssetCoinLogoProps) => {
    const locale = useSelector(selectLanguage);
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const { color: networkColor } = getNetworkConfig(symbol);

    return (
        <Row justifyContent="center">
            <Tooltip
                content={localizePercentage({
                    valueInFraction: (percentageShare ?? 0) / 100,
                    locale,
                    numDecimals: 2,
                })}
                cursor="pointer"
            >
                <AssetShareIndicator
                    symbol={symbol}
                    networkColor={networkColor}
                    size={24}
                    percentageShare={percentageShare}
                    index={index}
                />
            </Tooltip>
        </Row>
    );
};
```

`AssetTable/AssetRow.tsx`, `AssetCard/AssetCard.tsx`, and `AssetCard/AssetCardInfo.tsx` each need the
same mechanical change: replace their `assetsFiatBalances: AssetFiatBalance[]` prop (used in each of
those three files solely to forward to `<AssetCoinLogo>`) with `percentageShare?: number`, and pass
through the value looked up by their caller — `percentageShare` is already `AssetShareIndicator`'s
own prop name (`packages/product-components/src/components/AssetShareIndicator/AssetShareIndicator.tsx:24`),
so this aligns with an existing convention rather than inventing one.

## Why it matters

`AssetRow` is explicitly `memo()`-wrapped, but `AssetsView` hands it a brand-new `assetTokens` array
and a brand-new shared `assetsFiatBalances` array on every single render — either one alone is
enough to defeat a shallow-prop `memo()` comparison entirely, so today the wrap provides close to no
protection. `AssetsView` re-renders on every discovery tick, every `selectCurrentFiatRates` chunk,
and every account-sync update, none of which are scoped to a single row, so every asset row/card on
the dashboard currently re-renders in full on all of them. Layered on top, `AssetCoinLogo` —
instantiated once per row in both the table and card layouts — independently re-derives the whole
portfolio's percentage breakdown on every one of its own renders, so a dashboard with N enabled
assets does O(N²) work in that single derivation alone, per render, even after the parent-level
memoization fix, unless the percentage is also lifted out and computed once.

## Notes

- Boundary with `perf-issues/asymptotic-complexity/p2-26` (sibling draft, not yet filed): that doc's
  territory is the `stakingAccounts: accounts.filter(...)` line inside the `assetSymbols.map` above
  (left unchanged here) — a loop-invariant O(accounts) scan repeated once per asset symbol, plus
  `selectAnyAccountIsStakingActive`'s array-argument selector never hitting its own weakMap memo.
  This doc's fix wraps that same line inside the new outer `useMemo`, which incidentally makes
  `asset.stakingAccounts`'s _reference_ stable across renders where `accounts` hasn't changed (today
  it's as unstable as every other field here) — but it does not hoist the filter out of the map or
  touch the selector's signature, so the per-recompute cost p2-26 targets is untouched. The two
  fixes are additive; land either one first without blocking the other.
- Compile requirement: `useMemo` is already imported in `AssetsView.tsx`. `AssetCoinLogo.tsx` drops
  its now-unused `calculateAssetsPercentage`/`AssetFiatBalanceWithPercentage`/`AssetFiatBalance`
  imports from `@suite-common/assets`.
- `AssetCard` (grid view) is not itself `memo()`-wrapped, so finding 1's "restores a defeated memo"
  benefit applies only to the table view's `AssetRow`; finding 2's relocation benefits both layouts
  equally, since it doesn't depend on the row component being memoized.
- Mechanical prop-rename, not a logic change, across `AssetTable.tsx`, `AssetTable/AssetRow.tsx`,
  `AssetCard/AssetCard.tsx`, and `AssetCard/AssetCardInfo.tsx`: each currently threads
  `assetsFiatBalances` through to `<AssetCoinLogo>` and touches it nowhere else.
- `packages/suite` is not React-Compiler-covered — both memoizations are manual and load-bearing at
  runtime.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
