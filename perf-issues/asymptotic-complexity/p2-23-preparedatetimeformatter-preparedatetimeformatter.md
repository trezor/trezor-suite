# `prepareDateTimeFormatter` constructs a new `Intl.DateTimeFormat` per rendered row — cache the formatters

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`suite-common/formatters/src/formatters/prepareDateTimeFormatter.ts:16`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/formatters/src/formatters/prepareDateTimeFormatter.ts#L16) (also 9) — `prepareDateTimeFormatter (format callback)`

The number of transaction rows rendered/re-rendered — i.e. the account's transaction list.

## Before

```ts
        minute: '2-digit',
        hour12: !config.is24HourFormat,
    };

    return new Intl.DateTimeFormat(undefined, options).format(value);
}, 'DateTimeFormatter');
```

## After

Cache the constructed formatters. `config.is24HourFormat` has two values and the locale is the ambient default, so a module-level `Map` keyed on `is24HourFormat` suffices: Apply the same to `prepareDateFormatter.ts:12`, where `dateFormatterOptions` is already a module constant so a single hoisted instance is enough.

```ts
const dateTimeFormatters = new Map<boolean, Intl.DateTimeFormat>();
const getDateTimeFormatter = (is24HourFormat: boolean) => {
    let formatter = dateTimeFormatters.get(is24HourFormat);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(undefined, {
            ...dateFormatterOptions,
            hour: '2-digit',
            minute: '2-digit',
            hour12: !is24HourFormat,
        });
        dateTimeFormatters.set(is24HourFormat, formatter);
    }

    return formatter;
};
```

## Why it matters

**`O(rendered rows) Intl.DateTimeFormat constructions + O(rendered rows) options-object allocations`** — hot path.

`makeFormatter` (suite-common/formatters/src/makeFormatter.tsx) does not memoize anything: it just wraps the raw callback, so every `.format()` call and every `<DateTimeFormatter>` render runs the body verbatim. The concrete caller is `suite-native/transactions/src/components/TransactionListItemContainer.tsx:195` (`{DateTimeFormatter.format(transactionBlockTime)}`), which is the per-row container of the mobile transaction SectionList — so one `new Intl.DateTimeFormat` per transaction row, re-paid on every scroll-driven re-render. `prepareDateFormatter.ts:12` has the identical defect and is called per row from `suite-native/module-send/src/components/CoinControl/UtxoCard.tsx:159` (per UTXO) and `suite-native/module-activity-center/src/components/notifications/TransactionNotificationItem.tsx:133` (per notification). On Hermes/RN, Intl construction is materially more expensive than on V8, and the fresh `options` object also defeats any engine-side internal cache.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Prefer the simpler fix over the proposed module-level boolean Map: `prepareDateTimeFormatter(config)` is already called once per FormatterConfig, so build the formatter in the prepare function's body — above the makeFormatter callback — and just call `.format(value)` inside. That closes over `config.is24HourFormat` correctly with no cache key and no stale-config risk, and prepareDateFormatter.ts:12 needs only a single module-level instance since its options are already the module constant `dateFormatterOptions`. Caveat against a module-level cache: the locale argument is `undefined` (ambient host locale), so a process-global cache would survive a runtime locale change on Android/iOS; a per-prepare closure is re-created when the formatter provider re-runs and avoids that. `if (!value) return null;` at line 7 must stay before the format call.

- Spans more than one file — see also `suite-native/transactions/src/components/TransactionListItemContainer.tsx:195`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
