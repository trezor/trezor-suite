# `selectHistoricRatesByTransactions` rebuilds the rate-key list once per transaction — hoist the keys and index them by symbol

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Three separate allocations/scans compound inside one `txs.forEach` body, and the innermost of them is provably dead code.

## Where

[`suite-common/wallet-utils/src/fiatRatesUtils.ts:119`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/fiatRatesUtils.ts#L119)

The function narrows an account-wide `historicRates` map down to the (key, timestamp) pairs its transactions actually reference, before the result is written to IndexedDB. The narrowing predicate depends only on `tx.symbol`, but the whole key list is re-materialised and re-scanned for every transaction.

## Before

```ts
export const selectHistoricRatesByTransactions = (
    historicRates: RatesByTimestamps,
    txs: WalletAccountTransaction[],
) => {
    const selectedRates: RatesByTimestamps = {};

    txs.forEach(tx => {
        const { symbol, blockTime, tokens } = tx;
        const timestamp = roundTimestampToNearestPastHour(asTimestamp(blockTime ?? 0));

        typedObjectKeys(historicRates).forEach(fiatRateKey => {
            if (
                fiatRateKey.startsWith(symbol) ||
                tokens.some(token => fiatRateKey.startsWith(`[${symbol}-${token.contract}]`))
            ) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const historicRatesForKey: Record<Timestamp, number> = historicRates[fiatRateKey];
                if (historicRatesForKey[timestamp]) {
                    if (!selectedRates[fiatRateKey]) {
                        selectedRates[fiatRateKey] = {};
                    }
                    const selectedRatesForKey: Record<Timestamp, number> =
                        selectedRates[fiatRateKey];
                    selectedRatesForKey[timestamp] = historicRatesForKey[timestamp];
                }
            }
        });
    });

    return selectedRates;
};
```

## After

```ts
export const selectHistoricRatesByTransactions = (
    historicRates: RatesByTimestamps,
    txs: WalletAccountTransaction[],
) => {
    const selectedRates: RatesByTimestamps = {};

    const fiatRateKeys = typedObjectKeys(historicRates);
    const fiatRateKeysBySymbol = new Map<NetworkSymbol, typeof fiatRateKeys>();

    const getFiatRateKeysForSymbol = (symbol: NetworkSymbol) => {
        const cached = fiatRateKeysBySymbol.get(symbol);
        if (cached) return cached;

        const matching = fiatRateKeys.filter(fiatRateKey => fiatRateKey.startsWith(symbol));
        fiatRateKeysBySymbol.set(symbol, matching);

        return matching;
    };

    txs.forEach(tx => {
        const { symbol, blockTime } = tx;
        const timestamp = roundTimestampToNearestPastHour(asTimestamp(blockTime ?? 0));

        getFiatRateKeysForSymbol(symbol).forEach(fiatRateKey => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const historicRatesForKey: Record<Timestamp, number> = historicRates[fiatRateKey];
            if (historicRatesForKey[timestamp]) {
                if (!selectedRates[fiatRateKey]) {
                    selectedRates[fiatRateKey] = {};
                }
                const selectedRatesForKey: Record<Timestamp, number> = selectedRates[fiatRateKey];
                selectedRatesForKey[timestamp] = historicRatesForKey[timestamp];
            }
        });
    });

    return selectedRates;
};
```

## Why it matters

Today the body is **O(txs × rateKeys × tokens)** comparisons with **O(txs × rateKeys)** allocations layered on top — one fresh `Object.keys` array per transaction, plus one template-literal string per (transaction × key × token transfer). `txs` is the account's _entire_ transaction history (thousands on a real BTC or ETH account); `rateKeys` is every `symbol[-contract]-currency` pair the wallet has ever fetched, so it grows with the number of enabled networks _and_ every ERC-20 the user has touched — an ETH account with 40 tokens across a multi-network wallet is easily 50-100 keys. A 10,000-tx account against 60 keys is 600,000 `startsWith` calls and 10,000 throwaway arrays per invocation, and the tokens branch multiplies the string allocations by the transfer count of each tx.

The single caller is [`saveAccountHistoricRates`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/storageActions.ts#L341), reached from `storageMiddleware.ts:196` on every `updateTxsFiatRatesThunk.fulfilled` — i.e. once per `addTransaction` batch while a remembered device pages through history. So this whole walk repeats once per page of transaction discovery, on the main thread, in the middle of an IDB write.

After the fix the key list is built once, filtered once per _distinct symbol_ (in practice exactly one, since every tx of an account shares its symbol), and the per-tx work drops to the keys that can actually match. #31122 measured 227 ms at n=2000 for a comparably-shaped allocate-inside-the-loop defect; that number is that issue's measurement of its own code, not a benchmark of this one — nothing here was measured.

## Notes

- **The `tokens.some(...)` branch is dead code and the fix deletes it.** `getFiatRateKey` emits `${symbol}-${baseCurrencyCode}` or `${symbol}-${tokenAddress}-${baseCurrencyCode}` — never a leading `[`. The bracketed prefix `` `[${symbol}-${token.contract}]` `` therefore requires `fiatRateKey[0] === '['`, which no real key satisfies; and any key that _did_ start with `[` would already have failed `startsWith(symbol)`. Token rate keys are matched by the plain `startsWith(symbol)` test, since they begin with the symbol too. Deleting the branch is behaviour-preserving for every key the app can produce, and it removes the per-(tx × key × token) string allocation outright. If a reviewer would rather not rely on that argument, keep the branch but hoist ``const tokenPrefixes = tokens.map(t => `[${symbol}-${t.contract}]`)`` out of the key loop — the hoist alone still kills both allocation classes.
- **Behaviour delta:** none intended. The predicate is unchanged (`startsWith(symbol)`), only its evaluation is memoized per symbol, and the memo is scoped to a single call so a mutated `historicRates` between calls cannot go stale.
- **Ordering:** iteration order over `fiatRateKeys` is preserved (`Array.prototype.filter` is stable), and the write into `selectedRates` is idempotent per (key, timestamp) — two txs in the same rounded hour write the same value — so first-wins vs last-wins does not matter here.
- **Companion edits:** `tokens` drops out of the `tx` destructuring. `typedObjectKeys` stays imported (still used by `combineFiatRates` and the merge helper above). `NetworkSymbol` is already imported as a type at line 2, so no new import is needed.
- **TypeScript:** the repo runs `noUncheckedIndexedAccess`, which is why the existing `@ts-expect-error` on `historicRates[fiatRateKey]` is required — it must stay, and it stays on the same expression. Typing the cache as `Map<NetworkSymbol, typeof fiatRateKeys>` deliberately reuses `typedObjectKeys`' inferred `Array<keyof RatesByTimestamps>` element type rather than restating `CryptoBaseCurrencyPair`, so the `filter` result indexes into `historicRates` exactly as the current code does. Worth a `yarn workspace @suite-common/wallet-utils type-check` to confirm; the change was not compiled as part of writing this issue.
- **`startsWith` without a separator is fragile.** No current `NetworkSymbol` is a prefix of another (checked against `networksConfig.ts`: `btc eth pol bsc arb base op rhc hype avax sol trx ada etc xrp xlm ltc bch doge zec test regtest tsep thod dsol txrp txlm ttrx`), so the loose prefix test is correct today. A future symbol that extends an existing one would silently pull the wrong network's rates into the stored record — tightening the test to ``fiatRateKey.startsWith(`${symbol}-`)`` inside the memoized filter would close that, at the cost of a real (if currently unobservable) behaviour change. Flagged, not bundled.
- **Tests:** `suite-common/wallet-utils/src/fiatRatesUtils.test.ts` covers only `getFiatRateKey`, `getFiatRateKeyFromTicker` and `roundTimestampToNearestPastHour`. `selectHistoricRatesByTransactions` has **no** test coverage anywhere in the repo. A test that pins the current output for a mixed coin/token key set is a cheap prerequisite, and doubles as the evidence that the tokens branch never fired.
- **suite-common is not React-Compiler-compiled** (only `suite-native` sets `experiments.reactCompiler`), and this is a plain pure function outside React, so no compiler or Hermes caveats apply.
- **Related issue — the caller is quadratic too.** Fixing this function alone leaves `saveAccountHistoricRates` re-walking the account's full history once per rates batch (O(N) per page ≈ O(N²/perPage) over a full discovery), and fixing the caller alone leaves this O(txs × rateKeys) inner scan. Cross-link with the `storageActions.ts:341` issue and land them together where possible. Note for whoever takes the caller: `removeAccountHistoricRates` + full re-derive is currently what _prunes_ rate entries for transactions that disappeared, so a read-modify-write delta merge must relocate that pruning (e.g. to `removeTransaction` / `fetchAllTransactionsForAccountThunk.fulfilled`) rather than drop it. Both paths are gated on `getIsDeviceRemembered` (`storageMiddleware.ts:320`) — unremembered wallets never reach either.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
