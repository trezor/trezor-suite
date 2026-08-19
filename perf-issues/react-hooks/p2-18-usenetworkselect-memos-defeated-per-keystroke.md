Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Keep hook dependencies
referentially stable"_. Found by sweep, not named in the doc.

## Where

[`packages/product-components/src/components/SearchAsset/hooks/useNetworkSelect.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/product-components/src/components/SearchAsset/hooks/useNetworkSelect.ts#L15)

- Real caller 1 (outside this area, cited as evidence):
  [`.../GlobalSendReceive/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx:43,49-57`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx#L49-L57)
  — global Send/Receive asset search.
- Real caller 2, near-duplicate (outside this area):
  [`.../TradingFormInputAssetPicker/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx:37-43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAssetPicker/AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter.tsx#L37-L43)
  — Trading asset picker.
- Search-state evidence: [`.../GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useSearchFilter.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useSearchFilter.ts#L12)
  — `search` is local `useState`, updated on every keystroke.

## Before

```tsx
// useNetworkSelect.ts:14-41
export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};

    const allOptions = useMemo(() => {
        const networkOptions = networks
            .map(symbol => {
                const network = getNetwork(symbol);

                return network ? { label: network.name, value: network.symbol } : null;
            })
            .filter(isNotNull);

        return includeAllOption
            ? [{ label: allLabel ?? 'All networks', value: undefined }, ...networkOptions]
            : networkOptions;
    }, [networks, includeAllOption, allLabel]);

    const selectedOption = useMemo(
        () => allOptions.find(option => option.value === selectedNetwork),
        [allOptions, selectedNetwork],
    );

    const options = useMemo(
        () => allOptions.filter(option => option.value !== selectedNetwork),
        [allOptions, selectedNetwork],
    );

    return { options, selectedOption };
};
```

```tsx
// AssetSearchWithNetworkFilter.tsx:43,49-57 (GlobalSendReceive) — rebuilt every keystroke
const networks = protocolSymbol ? [protocolSymbol] : enabledNetworks;
// ...
const selectConfig = isBitcoinOnlyFirmware
    ? undefined
    : {
          networks,
          selectedNetwork: networkFilter,
          onChange: setNetworkFilter,
          includeAllOption: !protocolSymbol,
          allLabel: translationString('TR_ALL_NETWORKS'),
      };
```

```tsx
// TradingFormInputAssetPicker/AssetSearchWithNetworkFilter.tsx:37-43 — same shape, inline in JSX
selectConfig={{
    networks,
    selectedNetwork: networkFilter,
    onChange: setNetworkFilter,
    includeAllOption: true,
    allLabel: translationString('TR_ALL_NETWORKS'),
}}
```

Both callers rebuild their `selectConfig` object literal every render. The `GlobalSendReceive`
component owns `search` as local `useState` (`useSearchFilter.ts:12`) and re-renders on every
keystroke; the Trading variant receives `search` as a prop from `AssetPickerModal`, which owns the
same shape of local `useState` one level up
(`packages/suite/src/components/suite/asset-picker/hooks/useSearchFilter.ts:5`). Either way, a fresh
`config` object reaches `useNetworkSelect` on every keystroke, so all three of its internal
`useMemo`s (`allOptions`, `selectedOption`, `options`) recompute along with it.

## After

In `useNetworkSelect.ts`, hoist a module-level empty-array constant for the destructuring default —
this is the skill's own `?? []` worked example:

```tsx
const EMPTY_NETWORKS: NetworkSymbol[] = [];

export const useNetworkSelect = (config?: SearchAssetSelectConfig) => {
    const { networks = EMPTY_NETWORKS, includeAllOption, allLabel, selectedNetwork } = config ?? {};
    // ...unchanged
```

That only fixes the "no config at all" path — `useNetworkSelect` cannot deduplicate a `config` object
it did not create. The per-keystroke cadence needs the fix in the caller (outside this area):
memoize `selectConfig` (and `networks`, where it's derived from `protocolSymbol`) on its primitive
inputs, e.g. in the `GlobalSendReceive` variant:

```tsx
const networks = useMemo(
    () => (protocolSymbol ? [protocolSymbol] : enabledNetworks),
    [protocolSymbol, enabledNetworks],
);

const selectConfig = useMemo(
    () =>
        isBitcoinOnlyFirmware
            ? undefined
            : {
                  networks,
                  selectedNetwork: networkFilter,
                  onChange: setNetworkFilter,
                  includeAllOption: !protocolSymbol,
                  allLabel: translationString('TR_ALL_NETWORKS'),
              },
    [
        isBitcoinOnlyFirmware,
        networks,
        networkFilter,
        setNetworkFilter,
        protocolSymbol,
        translationString,
    ],
);
```

with the same shape applied to the Trading variant's inline object.

## Why it matters

Two near-duplicate `AssetSearchWithNetworkFilter` components — the global Send/Receive asset search
and the Trading asset picker — both feed `useNetworkSelect` an unmemoized config, so every character
typed into either search box redoes the network-options list and the options-minus-selected
filtering as pure pipeline overhead, on a hot per-keystroke path. Small per call, but avoidable and
it compounds with every keystroke while either picker is open.

## Notes

- Compile requirement: `useNetworkSelect.ts` already imports `useMemo`; no new import needed for the
  in-area fix.
- Checked, not just flagged: the caller-side memo sketched above will actually hold.
  `setNetworkFilter` (`useNetworkFilter.ts`) is a plain `useState` setter, stable forever.
  `enabledNetworks` (`selectEnabledNetworks`,
  `suite-common/wallet-core/src/settings/walletSettingsReducer.ts:118`) returns the Redux-stored
  array directly (only substituting a shared empty array via `returnStableArrayIfEmpty` when it's
  empty), so it's referentially stable across renders that don't change that slice of state.
  `translationString` (`suite/intl/src/hooks/useTranslation.ts:17-26`) is a `useCallback` keyed on
  `[intl]` from `react-intl`, stable in practice. None of these were flagged as unstable in this
  area's scan, and independent verification confirms they aren't.
- The caller-side fix lives in two files outside this area (`packages/suite`), so it isn't verified
  here to the same depth as `useNetworkSelect.ts` itself — sketched above as the necessary follow-up,
  not a patch.
- Honest sizing: the network list itself is small (one entry per enabled network), so the
  per-keystroke cost of the defeated memos is modest — the finding is about avoidable, compounding
  waste on a hot path, not a slow operation.
- `packages/product-components` ships to both the uncompiled `packages/suite` web/desktop app and
  the React-Compiler-covered `suite-native`; per this area's scope, native-vs-web doesn't change the
  in-area fix — memoize for the web consumer. Both caller files are `packages/suite` (also
  uncompiled), so their proposed `useMemo` fix is likewise a manual, permanent one.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
