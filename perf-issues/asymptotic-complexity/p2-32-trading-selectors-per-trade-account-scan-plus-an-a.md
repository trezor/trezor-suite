# Trading selectors scan the account list per trade, and order trades with an allocating, mutating comparator

Extracted from the `skills/performance-complexity/SKILL.md` audit — sections _"Index by key before iterating, don't scan inside a loop"_ and _"Keep a sort comparator to O(1) field reads"_. Two defects in one file, best fixed together. The second is also a correctness bug.

## Where

[`suite-common/trading/src/selectors/tradingSelectors.ts:422`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/selectors/tradingSelectors.ts#L422) — `selectTradingTradesForSelectedDevice`

[`suite-common/trading/src/selectors/tradingSelectors.ts:456`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/selectors/tradingSelectors.ts#L456) — `selectDeviceTradingTradesOrderedByDate`

`n` is the user's trade history, which only grows; the inner collection is every account across every enabled network and account type.

## Before

### 1. `selectTradingTradesForSelectedDevice` scans all accounts per trade

```ts
export const selectTradingTradesForSelectedDevice = createMemoizedSelectorWithDeviceAndAccounts(
    [selectAccounts, state => state.wallet.selectedAccount, selectTradingTrades],
    (accounts, selectedAccount, trades): TradingTransaction[] =>
        trades.filter(tx => {
            const txDeviceId = accounts.find(account => {
                const transactionAccountKey =
                    'selectedAccountKey' in tx ? tx.selectedAccountKey : tx.sendAccountKey;

                return transactionAccountKey === account.key;
            })?.deviceState;

            return txDeviceId === selectedAccount.account?.deviceState;
        }),
);
```

### 2. `selectDeviceTradingTradesOrderedByDate` allocates per comparison and mutates its input

```ts
export const selectDeviceTradingTradesOrderedByDate: (
    state: TradingRootStateWithDeviceAndAccounts,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [selectDeviceTradingTrades],
    trades => trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);
```

## After

### 1. Index the accounts once

The idiom is already in this file — `selectDeviceTradingTrades`, thirteen lines below, builds `new Set(accounts.map(({ key }) => key))` before filtering. This selector needs the `deviceState` too, so it wants a `Map` rather than a `Set`:

```ts
export const selectTradingTradesForSelectedDevice = createMemoizedSelectorWithDeviceAndAccounts(
    [selectAccounts, state => state.wallet.selectedAccount, selectTradingTrades],
    (accounts, selectedAccount, trades): TradingTransaction[] => {
        const deviceStateByAccountKey = new Map(
            accounts.map(account => [account.key, account.deviceState] as const),
        );

        return trades.filter(tx => {
            const transactionAccountKey =
                'selectedAccountKey' in tx ? tx.selectedAccountKey : tx.sendAccountKey;

            return (
                deviceStateByAccountKey.get(transactionAccountKey) ===
                selectedAccount.account?.deviceState
            );
        });
    },
);
```

### 2. Index the timestamps, and stop mutating

```ts
export const selectDeviceTradingTradesOrderedByDate: (
    state: TradingRootStateWithDeviceAndAccounts,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [selectDeviceTradingTrades],
    trades => {
        const timeByTrade = new Map(
            trades.map(trade => [trade, new Date(trade.date).getTime()] as const),
        );

        return trades.toSorted((a, b) => (timeByTrade.get(b) ?? 0) - (timeByTrade.get(a) ?? 0));
    },
);
```

## Why it matters

**1** is `O(trades × accounts)`. Both grow: trades accumulate for the lifetime of the wallet, and accounts reach 50–150 on a wallet with many networks enabled.

**2** allocates `2·n·log n` `Date` objects — two per comparison, where one indexing pass over `n` would do.

**2 is also a correctness bug, independent of performance.** `Array.prototype.sort` sorts in place, and the array it receives is the memoized output of `selectDeviceTradingTrades` directly above. So this selector reorders another selector's cached array as a side effect. Any consumer of `selectDeviceTradingTrades` that expected insertion order silently gets date order instead, and the mutation persists in the memo until its inputs change. See [`skills/defensive-programming/SKILL.md`](../skills/defensive-programming/SKILL.md) on non-mutating array methods.

No number here is measured. For scale on the allocating-comparator half, #31126 measured 3.6 ms → 1.3 ms at n=2000 from removing a `new BigNumber` pair per comparison — that is that issue's measurement, on UTXOs, not this one.

## Notes

- **File the mutation half even if the perf half is deferred.** It is a one-word change (`sort` → `toSorted`) and it is the part that can produce wrong output rather than merely slow output.
- `toSorted` is safe here: the repo targets ES2023 in `tsconfig.base.json` and `packages/suite` already has ~10 call sites. This file is `suite-common`, so confirm it is not pulled into a Hermes bundle before relying on it; `[...trades].sort(...)` is the equivalent fallback and still fixes the mutation.
- `as const` in both `new Map(...)` builds is load-bearing — without it TypeScript infers an array of unions rather than a tuple, and the `Map` generic comes out wrong.
- Keying the timestamp `Map` on the trade **object** is deliberate: `date` is not unique across trades, so a `Map<string, number>` keyed on the date string would collapse same-timestamp trades. Object identity is stable within the selector body.
- `deviceStateByAccountKey.get(...)` returns `undefined` for an unknown key, which compares unequal to a defined `deviceState` — same result as today's `.find(...)?.deviceState`. If `selectedAccount.account` is undefined, both old and new code compare `undefined === undefined` for trades whose account is missing; behaviour is unchanged, but it is worth a test if that case matters.
- Both selectors are `createMemoizedSelectorWithDeviceAndAccounts`, so the indexes are rebuilt only when accounts or trades change — the index is not per-call overhead.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
