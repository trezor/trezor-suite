Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/wallet/Fees/CollapsibleFees/CollapsibleFees.tsx:76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/Fees/CollapsibleFees/CollapsibleFees.tsx#L76)

Context definition: [`packages/suite/src/components/wallet/Fees/context/FeesContext.ts:23`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/Fees/context/FeesContext.ts#L23)

14 consumers via `useFeesContext()`, all under `packages/suite/src/components/wallet/Fees/`: `CollapsibleFees/CollapsibleFeesHeaderContent.tsx`, `CollapsibleFees/CollapsibleFeesHeader.tsx`, `CollapsibleFees/StandardFee/StandardFee.tsx`, `CollapsibleFees/StandardFee/BitcoinFeeCards.tsx`, `CollapsibleFees/StandardFee/EthereumFeeCards.tsx`, `CollapsibleFees/StandardFee/MiscFeeCards.tsx`, `CollapsibleFees/MaximumFee.tsx`, `CollapsibleFees/CustomFee/CustomFee.tsx`, `CollapsibleFees/CustomFee/CustomFeeEthereum.tsx`, `CollapsibleFees/CustomFee/CustomFeeMisc.tsx`, `CollapsibleFees/CustomFee/CurrentFee.tsx`, `CollapsibleFees/CustomFee/CustomFeeTooLowBanner.tsx`, `CollapsibleFees/TronFee/TronFee.tsx`, `DustPreventionNotice.tsx`.

## Before

```tsx
    return (
        <FeesContext.Provider
            value={{
                networkSymbol,
                networkType,
                feeInfo,
                changeFeeLevel,
                selectedFeeLevel,
                composedLevels,
                tronResources,
            }}
        >
```

## After

```tsx
    const contextValue = useMemo(
        () => ({
            networkSymbol,
            networkType,
            feeInfo,
            changeFeeLevel,
            selectedFeeLevel,
            composedLevels,
            tronResources,
        }),
        [
            networkSymbol,
            networkType,
            feeInfo,
            changeFeeLevel,
            selectedFeeLevel,
            composedLevels,
            tronResources,
        ],
    );

    return (
        <FeesContext.Provider value={contextValue}>
```

## Why it matters

React context has no shallow-compare bail-out: every consumer of `FeesContext` re-renders whenever the Provider's `value` reference changes, regardless of which field it actually reads. `CollapsibleFees` mounts on every send/stake/claim/unstake/RBF screen and re-renders on every `useWatch({ name: 'selectedFee' })` tick — effectively per keystroke/interaction in the surrounding fee form — so all 14 consumers (every fee-card variant, both custom-fee panels, the header, the too-low banner, the Tron fee panel, the dust notice) currently re-render together on each of those ticks, not just the ones whose data actually changed.

## Notes

- `useMemo` is already imported in this file (it's used for `isTrc20Transfer`, `defaultFeeLevel`, and `selectedFeeLevel`), so this fix needs no new import.
- Checked, not just flagged: `changeFeeLevel` (`packages/suite/src/hooks/wallet/form/useFees.ts:129`) is a plain arrow function rebuilt on every call to `useFees()`, not a `useCallback` — so on a render where `CollapsibleFees`'s _parent_ itself re-renders, this memo's own `changeFeeLevel` dependency is fresh again and the memo still recomputes. The fix still fully holds for the cadence called out above — a `useWatch`-driven re-render of `CollapsibleFees` in isolation, parent untouched, so `changeFeeLevel`/`feeInfo`/`composedLevels` arrive as the same prop references as the previous render — which is the hot path this doc is about. Full end-to-end stability additionally needs `changeFeeLevel` wrapped in `useCallback` in `useFees.ts`; that's outside `components/wallet/Fees` and not covered by this doc.
- `feeInfo`'s and `composedLevels`'s own stability at their producers (`useFees`, `useCompose`, and neighbors in `src/hooks/wallet`) wasn't independently re-verified beyond the point above; if either is also rebuilt per render, the same caveat applies to it.
- None of the 14 consumers are `memo()`-wrapped. That's not a problem once the Provider value itself is stable, and isn't proposed here since it isn't the bottleneck.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
