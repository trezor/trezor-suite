# `sortTokensWithRates` allocates `BigNumber` and `Intl.Collator` per comparison — decorate, sort, undecorate

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Keep a sort comparator to O(1) field reads"_.

## Where

[`packages/suite/src/utils/wallet/tokenUtils.ts:24`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/tokenUtils.ts#L24) (also 27,33) — `sortTokensWithRates`

`account.tokens` (enhanced with fiat rates) — the ERC-20/SPL/TRC-20 token list of one account, or the union across all accounts of a network

## Before

```ts
    fiatRate?: Rate;
}

// sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const balanceSort =
        // Sort by balance multiplied by USD rate
        b.fiatValue.minus(a.fiatValue).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.fiatRate?.rate || -1) - (a.fiatRate?.rate || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '', undefined, { sensitivity: 'base' });

    return balanceSort;
```

## After

Decorate-sort-undecorate: above the sort, build `const key = new Map(tokens.map(t => [t, { fiat: t.fiatValue.toNumber(), rate: t.fiatRate?.rate ?? -1, sym: t.symbol ?? '' }]))`, and hoist one module-level `const collator = new Intl.Collator(undefined, { sensitivity: 'base' })`. The comparator then reads two Map entries and calls `collator.compare(...)` — no allocation per comparison. Also wrap `TokenIconSetWrapper`'s whole derivation in a `useMemo`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(tokens log tokens) BigNumber + Intl.Collator allocations`** — hot path.

Every comparison allocates: `.minus()` builds a fresh BigNumber, and `localeCompare(x, undefined, { sensitivity: 'base' })` allocates an options object and forces V8 to construct a non-default Intl.Collator (the cached default-collator fast path does not apply when options are passed). The collator branch is not rare — it fires exactly for the long tail of zero-balance spam tokens, where fiatValue is 0, rate is missing on both sides, and symbol lengths tie. n is an account's token list, which for EVM accounts is dominated by unsolicited airdrops and reaches hundreds to thousands. Named hot callers: `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:60` sorts on every render with no useMemo at all (the whole component body re-runs `enhanceTokensWithRates` + `getTokens` + `sort` per dashboard asset row); `packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx:53` and `packages/suite/src/views/dashboard/AssetsView/assetsViewUtils.ts:39` re-sort whenever `fiatRates` changes, i.e. on every rate poll.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Correction to the sweeper's caller analysis: TokenIconSetWrapper.tsx:60 sorts `getTokens(...).shownWithBalance`, which EXCLUDES the unverified bucket (suite-common/wallet-core/src/tokens/tokenUtils.ts:85-86) — so that call site is bounded and is only a 'no useMemo at all' smell, not the unbounded one. The unbounded call sites are CoinsTable.tsx:53 and views/wallet/tokens/defi/DefiTokensTable.tsx:45 (both sort pre-categorisation). Fix: hoist one module-level `const collator = new Intl.Collator(undefined, { sensitivity: 'base' })` and precompute `fiatValue.toNumber()` per token above the sort. Behaviour delta to watch: `fiatValue.toNumber()` loses precision beyond 2^53 where `BigNumber.minus` does not — for a tie-break-ordering comparator that is acceptable, but reviewers will ask. Also note `tokensWithRates.sort(...)` mutates the array from enhanceTokensWithRates (freshly built by .map, so safe today). Since the comparator is exported and used by 7 call sites, changing its signature to a factory that closes over a precomputed Map means touching all of them; the cheapest scoped fix is just the hoisted collator.

- Spans more than one file — see also `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:60`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
