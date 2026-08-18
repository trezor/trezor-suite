# `VirtualizedList` recomputes a prefix sum per rendered row — precompute cumulative offsets and binary-search the start index

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/components/src/components/VirtualizedList/VirtualizedList.tsx:233`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/VirtualizedList/VirtualizedList.tsx#L233) (also 220, 235, 236, 237, 156) — `VirtualizedListComponent`

`items` — the asset/token rows rendered by the virtualized list; every token across every account the user holds (plus each account's native asset). Grows with upstream token data, hundreds to thousands for an active EVM/Solana wallet.

## Before

```tsx
const itemIndex = indexes.startIndex + index;

if (!items[itemIndex]) return null;

const itemTop =
    firstItemTop +
    itemHeights
        .slice(indexes.startIndex, itemIndex)
        .reduce((acc, h) => acc + h, 0);

return (
    <Item
        key={itemIndex}
        style={{
            transform: `translateY(${itemTop}px)`,
```

## After

Compute a cumulative-offset array once, next to `itemHeights`, and index it in O(1): Then `totalHeight = itemOffsets[itemOffsets.length - 1]`, the per-row `itemTop = itemOffsets[itemIndex]` (dropping `firstItemTop` entirely), and the start-index scan at line 156 becomes a binary search over `itemOffsets` for `scrollTop` instead of a linear walk. Whole render drops from O(n + w^2) to O(w + log n).

```tsx
const itemOffsets = useMemo(() => {
    const offsets = new Array<number>(itemHeights.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < itemHeights.length; i++) offsets[i + 1] = offsets[i]! + itemHeights[i]!;
    return offsets;
}, [itemHeights]);
```

## Why it matters

**`O(w^2) prefix-sum work + ~w array allocations per render (w = rendered window, ~70-100 with beforeAfterBufferCount=30), plus O(n) work per scroll event at lines 156 and 220 -> O(n^2) to scroll a list of n items end-to-end`** — hot path.

The only consumer is packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:33, fed by GlobalSendModal.tsx:143 and SelectTokenAssetModal.tsx:212 — both pass the complete cross-account asset+token list, which is exactly the collection that grows with how many tokens a wallet holds. handleScroll fires on every scroll event, calls setIndexes, and the component re-renders; each of those renders recomputes every prefix sum from scratch. Line 220 (`firstItemTop`) allocates a slice of length `startIndex` and sums it, so the per-scroll cost grows linearly as the user scrolls deeper — summed over a full scroll-through that is quadratic in n. Line 233-237 additionally re-sums a growing slice for each of the ~100 rendered rows (beforeAfterBufferCount=30 at the caller, default 100), allocating one intermediate array per row.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Sweeper's consumer list was incomplete: besides AssetsList.tsx:33 <- GlobalSendModal.tsx:143 and SelectTokenAssetModal.tsx:212, AssetsList is also used by packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/AssetPickerModal/AssetListWrapper.tsx:32 and the SellAsset equivalent — the trading currency lists are the largest n. Fix is sound: itemTop at 233 equals firstItemTop + sum(startIndex..itemIndex) = sum(0..itemIndex), so a cumulative `itemOffsets` array gives the identical value in O(1) and lets `firstItemTop` (219-222) and `totalHeight` (141-144) be dropped/derived; the linear start-index scan at 156-165 can become a binary search over the same array. Companion edits: `firstItemTop` useMemo becomes unused, and `getIndexOrThrow` may become unused in the scan if replaced. Two adjacent smells worth mentioning in the issue but not blocking: `setIndexes` at 183 always allocates a fresh object so every scroll event re-renders even when the window did not move, and the file already carries TODOs at 147 and 227 pointing at IntersectionObserver / react-window. Component is wrapped in memo(); no React Compiler caveat since all the arrays are already useMemo'd on [items].

- Spans more than one file — see also `packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:33`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
