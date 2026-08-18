# `getLocaleSeparators` constructs an uncached `Intl.NumberFormat` per formatted amount — memoize on locale

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/utils/src/getLocaleSeparators.ts:2`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/getLocaleSeparators.ts#L2) (also 3, 5, 6) — `getLocaleSeparators`

The number of crypto amounts formatted — one per token row, per transaction row, per account row in every balance list.

## Before

```ts
export const getLocaleSeparators = (locale: string) => {
    const numberFormat = new Intl.NumberFormat(locale);
    const parts = numberFormat.formatToParts(10000.1);

    const decimalSeparator = parts.find(({ type }) => type === 'decimal')?.value as string;
    const thousandsSeparator = parts.find(({ type }) => type === 'group')?.value as string;

    return { decimalSeparator, thousandsSeparator };
```

## After

Memoize on `locale` — the key space is the ~20 entries of `LANGUAGES`: Do the same for `getLocaleSeparators.native.ts`, and cache the probe formatter used at `localizeNumberUtils.ts:42` in a `Map<string, Intl.NumberFormat>` rather than constructing it inline.

```ts
const separatorsByLocale = new Map<
    string,
    { decimalSeparator: string; thousandsSeparator: string }
>();

export const getLocaleSeparators = (locale: string) => {
    const cached = separatorsByLocale.get(locale);
    if (cached) return cached;
    // ...existing body...
    const result = { decimalSeparator, thousandsSeparator };
    separatorsByLocale.set(locale, result);

    return result;
};
```

## Why it matters

**`O(formatted amounts) uncached Intl.NumberFormat constructions (constant-factor per row, unbounded row count)`** — hot path.

There is no cache: every call rebuilds `new Intl.NumberFormat(locale)`, runs `formatToParts` (which allocates an array of part objects) and linearly scans it twice, for a value (`10000.1`) that never changes and a `locale` drawn from ~20 possible values. The call chain that makes n large is `suite-common/wallet-utils/src/localizeNumberUtils.ts:22` (`localizeNumber`) -> `suite-common/formatters/src/formatters/prepareCryptoAmountFormatter.ts:71` (`CryptoAmountFormatter`) -> `suite-native/formatters/src/components/TokenAmountFormatter.tsx:33`, rendered per row by `suite-native/transactions/src/components/TokenTransferListItem.tsx` and `suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx`; on web the same formatter backs `packages/suite/src/views/wallet/transactions/TransactionList/TransactionsGroup/DayHeader.tsx`. `localizeNumberUtils.ts:42` then builds a SECOND `Intl.NumberFormat(locale)` per call for the 1000-9999 group-size probe. `makeFormatter` does not memoize, so an EVM account with several hundred tokens pays several hundred Intl constructions per full list render.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- @trezor/utils is a published npm package, so a module-level Map is a process-global cache — acceptable here because Intl.NumberFormat is stateless and the key space is the ~20 LANGUAGES entries, but it must be keyed on `locale` (never on `undefined`/ambient). packages/utils/src/getLocaleSeparators.native.ts is a SEPARATE implementation (iOS cannot use formatToParts) and needs the same cache added independently — it constructs Intl.NumberFormat and then does a character scan of the formatted string. Return the same frozen object from the cache; callers only destructure `{ decimalSeparator, thousandsSeparator }`, so shared identity is safe. The `as string` casts on lines 5-6 stay as-is; a Map-typed cache keeps the return type inferred identically, so no widening at the call sites.

- Spans more than one file — see also `suite-common/wallet-utils/src/localizeNumberUtils.ts:22`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
