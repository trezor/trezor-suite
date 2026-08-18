# P3 complexity cleanups — suite-common shared packages

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Keep a sort comparator to O(1) field reads"_.

## Where

[`suite-common/address/src/getReceiveAddressHistory.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/address/src/getReceiveAddressHistory.ts#L37) (also 39,102,163) — `sortReceiveAddressesByHighestPath`

[`suite-common/fiat-services/src/coingecko.ts:202`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/fiat-services/src/coingecko.ts#L202) (also 141,146,148,200) — `getFiatRatesForTimestamps / findClosestTimestampValue`

[`suite-common/suite-sync/src/data/account/selectAccountsWithSuiteSyncLabel.ts:29`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-sync/src/data/account/selectAccountsWithSuiteSyncLabel.ts#L29) (also 31,40,52) — `mapAccountsToSuiteSyncLabel (selectAccountsWithSuiteSyncLabel / selectVisibleDeviceAccountsWithSuiteSyncLabel)`

[`suite-common/suite-sync/src/data/address/suiteSyncAddressSelectors.ts:48`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-sync/src/data/address/suiteSyncAddressSelectors.ts#L48) (also 47,42,14) — `selectSuiteSyncAddressLabel`

[`suite-common/trading/src/utils/infoUtils.ts:20`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/utils/infoUtils.ts#L20) (also 15,19,22,28,57) — `getTradingCoinInfoByCryptoId`

[`suite-common/transaction-search/src/simpleSearchTransactions.ts:192`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/simpleSearchTransactions.ts#L192) (also 195,200,201,202,203,216,228) — `simpleSearchTransactions (foundTxsForToken / foundTxsForNativeSymbol / foundTxsForFunctionSelector)`

[`suite-common/wallet-core/src/accounts/accountsThunks.ts:256`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsThunks.ts#L256) (also 254) — `fetchAndUpdateAccountThunk`

[`suite-common/wallet-core/src/fiat-rates/fiatRatesSelectors.ts:122`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesSelectors.ts#L122) (also 106,117,130,138) — `selectTickerFromAccounts (via selectTickersToBeUpdated)`

[`suite-common/wallet-core/src/tokens/tokenSelectors.ts:84`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenSelectors.ts#L84) (also 70) — `selectAccountUnrecognizedTokens (and selectAccountManuallyHiddenTokens)`

[`suite-common/wallet-utils/src/transactionUtils.ts:915`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L915) (also 916) — `getTargetAmountRaw`

`account.addresses.used` concatenated with the visible unused addresses — the derived-address list of a UTXO account

## Before

### `sortReceiveAddressesByHighestPath` — `getReceiveAddressHistory.ts:37`

```ts
    currentFreshAddress?: CurrentFreshAddressInHistory;
    includeCurrentFreshAddress?: boolean;
};

const sortReceiveAddressesByHighestPath = (addresses: AccountAddress[]): AccountAddress[] =>
    addresses.sort(
        (firstAddress, secondAddress) => comparePath(firstAddress.path, secondAddress.path) * -1,
    );

const getPendingUnusedAddresses = (account: Account, pendingAddresses: string[]): ReceiveInfo[] =>
    account.addresses?.unused.reduce<ReceiveInfo[]>((result, { path, address }) => {
```

### `getFiatRatesForTimestamps / findClosestTimestampValue` — `coingecko.ts:202`

```ts
const response = await fetchCoinGecko(url);
if (response?.prices && response.prices.length > 0) {
    const tickers = timestamps.map(ts => ({
        ts,
        rates: { [fiatCurrencyCode]: findClosestTimestampValue(ts, response.prices) },
    }));

    return {
        symbol: ticker.symbol,
        tickers,
        ts: new Date().getTime(),
```

### `mapAccountsToSuiteSyncLabel` — `selectAccountsWithSuiteSyncLabel.ts:29`

```ts
const mapAccountsToSuiteSyncLabel = (
    accounts: readonly Account[],
    suiteSyncAccountLabels: SuiteSyncAccount[],
): AccountWithSuiteSyncLabel[] =>
    accounts.map(account => {
        const label =
            findSuiteSyncAccountLabel({
                accounts: suiteSyncAccountLabels,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            })?.label ?? null;
```

### `selectSuiteSyncAddressLabel` — `suiteSyncAddressSelectors.ts:48`

```ts
        (_state: SuiteSyncDataRootState, _deviceStaticId: StaticSessionId, address: string) =>
            address,
    ],
    (walletAddresses, address) =>
        walletAddresses.find(addr => addr.address === address)?.label ?? null,
);

export const selectSuiteSyncAddressLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
) => {
```

### `getTradingCoinInfoByCryptoId` — `infoUtils.ts:20`

```ts
        return coins[cryptoId];
    }

    const lowerCryptoId = cryptoId.toLowerCase();
    const matchingKey = Object.keys(coins).find(key => key.toLowerCase() === lowerCryptoId);

    return matchingKey ? coins[matchingKey] : undefined;
};

export const getTradingCoinSymbolByCryptoId = (
    coins: Coins,
```

### `simpleSearchTransactions` — `simpleSearchTransactions.ts:192`

```ts
});
txsToSearch.push(...foundTxsForAddress);

// Find by token name, symbol or contract
const foundTxsForToken = transactions.flatMap(transaction => {
    const isNativeSymbolSearch = isNativeDisplaySymbolSearch(
        transaction.symbol,
        search.toLowerCase(),
    );
    const hasMatchingToken = transaction.tokens.some(
        token =>
```

### `fetchAndUpdateAccountThunk` — `accountsThunks.ts:256`

```ts
if (analyze.add.length > 0) {
    // Blockbook returns empty tokens for pending contract calls. Copy them
    // from our fake tx (identified by `deadline`) so RBF on this pending tx still
    // has token + amount.
    const enrichedAdd = analyze.add.map(freshTx => {
        if ((freshTx.tokens?.length ?? 0) > 0) return freshTx;
        const fakeMatch = accountTxs.find(
            t =>
                t.txid === freshTx.txid &&
                'deadline' in t &&
                (t.tokens?.length ?? 0) > 0,
        );

        return fakeMatch ? { ...freshTx, tokens: fakeMatch.tokens } : freshTx;
    });

    dispatch(
```

### `selectTickerFromAccounts` — `fiatRatesSelectors.ts:122`

```ts
            ticker =>
                !ticker.tokenAddress ||
                selectIsSpecificCoinDefinitionKnown(state, ticker.symbol, ticker.tokenAddress),
        ),
        A.uniqBy(ticker =>
            ticker.tokenAddress ? `${ticker.symbol}-${ticker.tokenAddress}` : ticker.symbol,
        ),
        A.sortBy(ticker => (ticker.tokenAddress ? 1 : 0)),
        F.toMutable,
    );
};
```

### `selectAccountUnrecognizedTokens` — `tokenSelectors.ts:84`

```ts
    [selectAccountTokens],
    (tokenCategories): TokenInfoBranded[] => {
        if (!tokenCategories) return [];

        return (
            [
                ...tokenCategories.unverifiedWithBalance,
                ...tokenCategories.unverifiedWithoutBalance,
            ] as TokenInfoBranded[]
        ).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    },
);

export const selectAccountManuallyHiddenTokensCount = createMemoizedSelector(
    [selectAccountManuallyHiddenTokens],
    (tokens): number => tokens.length,
```

### `getTargetAmountRaw` — `transactionUtils.ts:915`

```ts
    return amount;
}

if (
    target === transaction.targets.find(t => t.isAccountTarget) &&
    !transaction.targets.find(t => !t.isAccountTarget) &&
    validTxAmount
) {
    // "sent to self" target, if it is first of its type and there are no other non-self targets show a fee
    return txAmount;
}
```

## After

### `sortReceiveAddressesByHighestPath`

Decorate-sort-undecorate with a single parse per address: `const parsed = new Map(addresses.map(a => [a, getHDPath(a.path)]))` above the sort, then compare the two pre-parsed number arrays element-wise inside the comparator. Note the function also sorts the argument in place; prefer `toSorted` so callers holding the array are not mutated.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getFiatRatesForTimestamps / findClosestTimestampValue`

Sort the timestamps once, then sweep `prices` with a single cursor that never rewinds (classic two-pointer merge), or precompute the price timestamps into a sorted array and binary-search each ts. Either turns the whole map into O(T log P) or O(T + P) instead of O(T x P).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `mapAccountsToSuiteSyncLabel`

Build the index once per label array instead of scanning per account. Either add a memoized selector that returns `Map<`${networkSymbol}:${accountDescriptor}`, SuiteSyncAccount>` next to `selectSuiteSyncAccounts`, or index inline:

const mapAccountsToSuiteSyncLabel = (accounts, suiteSyncAccountLabels) => {
const byKey = new Map<string, SuiteSyncAccount>();
suiteSyncAccountLabels.forEach(a => byKey.set(`${a.networkSymbol}:${a.accountDescriptor}`, a));
return accounts.map(account =>
createAccountWithSuiteSyncLabel(
account,
byKey.get(`${account.symbol}:${account.descriptor}`)?.label ?? null,
),
);
};

Same index also removes the per-call scan in selectSuiteSyncAccountLabel.ts:29.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectSuiteSyncAddressLabel`

Read the dictionary directly: select `selectWalletById(state, walletDescriptor)?.addresses` and return `addressesByAddress?.[address]?.label ?? null` instead of flattening to an array and calling `.find()`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getTradingCoinInfoByCryptoId`

Build the case-insensitive index once per `coins` object and cache it on the object identity, the way tokenDefinitionsUtils.ts:25 already does for token definitions:

const lowerCaseIndex = new WeakMap<Coins, Map<string, CoinInfo>>();
const getLowerCaseIndex = (coins: Coins) => {
let index = lowerCaseIndex.get(coins);
if (!index) {
index = new Map(Object.entries(coins).map(([k, v]) => [k.toLowerCase(), v]));
lowerCaseIndex.set(coins, index);
}
return index;
};

Then `return coins[cryptoId] ?? getLowerCaseIndex(coins).get(cryptoId.toLowerCase());`

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `simpleSearchTransactions`

Hoist once at the top of `simpleSearchTransactions`: `const lowerCaseSearch = search.toLowerCase();` and substitute it at :195, :200, :201, :202, :203, :216 and :228 (lines :159, :170 and :181 have the same defect inside their `typedObjectKeys(...).flatMap` callbacks and should be converted in the same pass).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `fetchAndUpdateAccountThunk`

Index the (tiny) set of fake pending txs once, above the map:

const fakeTxTokensByTxid = new Map(
accountTxs
.filter(t => 'deadline' in t && (t.tokens?.length ?? 0) > 0)
.map(t => [t.txid, t.tokens]),
);
const enrichedAdd = analyze.add.map(freshTx => {
if ((freshTx.tokens?.length ?? 0) > 0) return freshTx;
const tokens = fakeTxTokensByTxid.get(freshTx.txid);
return tokens ? { ...freshTx, tokens } : freshTx;
});

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectTickerFromAccounts`

Replace the ts-belt pipeline tail with an explicit Set-keyed dedupe and hoist the balance test off BigNumber:

const seen = new Set<string>();
const tickers: TickerId[] = [];
for (const account of accounts) {
const symbolKey = account.symbol;
if (!seen.has(symbolKey)) { seen.add(symbolKey); tickers.push({ symbol: account.symbol }); }
for (const token of account.tokens ?? []) {
if (!token.balance || token.balance === '0') continue; // avoids the BigNumber alloc for the common case
if (!selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract as TokenAddress)) continue;
const key = `${account.symbol}-${token.contract}`;
if (seen.has(key)) continue;
seen.add(key);
tickers.push({ symbol: account.symbol, tokenAddress: token.contract as TokenAddress, protocols: token.protocols });
}
}
// natives already precede tokens, so the A.sortBy is unnecessary
return tickers;

That is O(T) with one string per ticker instead of O(T^2) with two strings per comparison. Separately, wrapping `selectTickerFromAccounts` in `createWeakMapSelector` on `selectAccounts` would stop the whole pipeline re-running for the two dispatches the middleware fires back to back.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectAccountUnrecognizedTokens`

Extract the collation key once per element, then compare primitives (RULE 2 — index once above the sort):

const collator = new Intl.Collator(); // module scope
...
const tokens = [...unverifiedWithBalance, ...unverifiedWithoutBalance] as TokenInfoBranded[];
return tokens
.map(token => ({ token, name: token.name ?? '' }))
.sort((a, b) => collator.compare(a.name, b.name))
.map(({ token }) => token);

A hoisted `Intl.Collator` alone already removes the per-call collator lookup; apply the same change at line 70.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getTargetAmountRaw`

Compute the two lookups once per transaction and pass them in: `const firstAccountTarget = transaction.targets.find(t => t.isAccountTarget); const hasExternalTarget = transaction.targets.some(t => !t.isAccountTarget);` above the map, then have getTargetAmountRaw take them as arguments (or expose a getTargetAmountsForTransaction helper that does the hoist and maps internally, which is what getTargetAmounts.ts already wants).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(n log n) with ~10 allocations per comparison (2 full BIP-path re-parses); order unchanged`** — warm path.

`comparePath` re-parses BOTH derivation-path strings on every comparison. Each `getPathParts` call runs `getHDPath`, which does `path.toLowerCase()`, `.split('/')`, `.filter(...)`, builds a `number[]`, and wraps it in an `ok()`/`err()` Result object — roughly 5 allocations, so ~10 per comparison, i.e. 2*n*log2(n) full path parses where n parses would do. n is the account's address list: `getReceiveAddressHistoryList` sorts `used.concat(visibleUnusedAddresses)` (line 163), and a well-used BTC/LTC account has hundreds to thousands of used addresses. Runs on the Receive tab list build and via `getFirstFreshAddress` (line 102) on every receive-address request.

**`~O(T*P/2) — findClosestTimestampValue breaks early (:157) once the delta stops shrinking, so each call costs O(index of closest price point) rather than O(P), but the cursor still never carries between calls; T = deduped hourly timestamps, P = CoinGecko price points over the account's history range`** — warm path.

findClosestTimestampValue (:141) always seeds `closestTimestamp = prices[0]` (:146) and walks forward from index 1 (:148) until the delta stops shrinking, so the scan position is never carried between calls even though both arrays are monotonic in time. The caller chain is suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:160-170 (`timestamps = txs.map(tx => tx.blockTime)`, one entry per transaction) -> suite-common/wallet-utils/src/fiatRatesUtils.ts:152 fetchTransactionsRates -> rates.ts:259 coingeckoService.getFiatRatesForTimestamps, taken whenever the network is not blockbook-backed or an Electrum backend is selected. Both factors grow together: more transactions means more timestamps and a longer requested range, which means more CoinGecko price points, so the product is genuinely superlinear in account history (5k txs x ~2k daily points ≈ 10M iterations on the main thread).

**`O(transactions + sum of token transfers) redundant String.prototype.toLowerCase allocations per keystroke, all of one loop-invariant value`** — hot path.

`findSuiteSyncAccountLabel` (suite-common/suite-sync/src/data/account/findSuiteSyncAccountLabel.ts:10) is a bare `params.accounts.find(a => a.accountDescriptor === ... && a.networkSymbol === ...)`, executed once per account inside the `.map`. Nothing in the callback is hoisted. The memo is keyed on the `accounts` array identity, and `selectAllAccountsToList` / `selectVisibleDeviceAccounts` are rebuilt whenever `state.wallet.accounts` changes -- i.e. on every `updateAccount` from a blockchain sync tick -- so the full A x L pass reruns each tick. Consumers are the always-mounted sidebar (AccountsMenu/AccountsList.tsx:74), the global send and receive modals (GlobalSendModal/hooks/useAccountWithTokensOptions.ts:47, GlobalReceiveModal/hooks/useAccountsOptions.ts), the trading asset picker, and suite-native/accounts/src/selectors.ts. This is the same defect already filed for suiteSyncOutputSelectors.ts:56 and suiteSyncAddressSelectors.ts:48, on a third collection.

**`O(rendered rows x address labels), where an O(1) dictionary read already exists`** — hot path.

Same shape as the output-label selector: suiteSyncDataReducer.ts:14 stores `addresses: Record<SuiteSyncAddress['address'], SuiteSyncAddress>`, keyed by exactly the address being searched, and selectAllAddressesForWallet (suiteSyncWalletSelectors.ts:42) flattens it with typedObjectValues so the selector can linear-scan it. It runs once per row from suite-native/address/src/AddressLabel.tsx:26 and AddressLabelEditable.tsx:40, which render the receive-address history list. Address labels grow with usage and arrive in bulk through the BIP-329 import (suite-common/bip329/src/suiteSync/createBip329ToSuiteSync.ts).

**`O(catalogue size) with one Object.keys array allocation and one toLowerCase allocation per key, paid on every cache MISS (exact-key hits at :15 are O(1)); multiplied by rendered rows on the unmemoized useTradingUtils path`** — hot path.

The exact-key hit at :15 only fires when the caller's cryptoId matches Invity's key byte-for-byte. Suite builds token cryptoIds via getCryptoId -> getContractAddressForNetworkSymbol, which lowercases EVM contract addresses; the case-insensitive fallback exists precisely because that does not always match the catalogue's casing, so for EVM tokens the slow path is the normal path, not the exception. The scan is invoked per row and is not memoized: useTradingUtils (suite-common/trading/src/hooks/useTradingUtils.ts:38-48) only wraps the call in useCallback, so packages/suite/src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts.tsx:22,41,43 runs it once or twice per trade-history row on every render, and TradingCryptoAmount.tsx:29 runs it per offer/quote row. suite-common/trading/src/utils/tradeHistoryExportUtils.ts:129 runs it twice per trade during CSV export. Each miss also allocates a fresh array of every catalogue key.

**`O(sum of tokens over all listed accounts) recomputed per render while a search or coin filter is active; result does not depend on the search string`** — hot path.

`search.toLowerCase()` is evaluated inside the `.flatMap` over the whole history at :195 and :216 and :228, and again 4 times inside the `.some` over each transaction's token transfers at :200-:203. None of it depends on the callback parameter, so every one of these is a fresh string allocation of a value that is constant for the entire call. The function runs on each keystroke in the transaction search box (and `advancedSearchTransactions` calls it once per `&`/`|` term, multiplying the waste). For an EVM account with a few thousand transactions carrying token transfers this is tens of thousands of throwaway strings per keypress, on top of the O(n^2) `groupTransactionIdsByAddress` already filed at :29.

**`O(analyze.add x accountTxs), but analyze.add is 0-2 in steady state and capped at pageSize (max(account.history.unconfirmed, 25)); effectively one O(accountTxs) scan per sync tick that has new txs`** — hot path.

The `.find` scans the account's entire transaction history once per added transaction, even though it can only ever match a _fake pending_ tx (one carrying `deadline`), of which there are at most a handful. `fetchAndUpdateAccountThunk` is the app's main sync path: dispatched per visible account by `syncAccountsWithBlockchainThunk` on the 40-60s timer chain and on every mined block (blockchainThunks.ts:301-309), per blockchain notification (blockchainThunks.ts:451-453), and on account selection (accountsMiddleware.ts:26). `pageSize` is `max(account.history.unconfirmed, 25)`, so `analyze.add` is ~25 and `accountTxs` is the full loaded history — 25 x 10,000 = 250k string compares per sync tick for a heavy EVM/BTC account, on top of the reducer cost above.

**`O(A x L) string comparisons per sync tick, A = visible accounts, L = Suite Sync account label rows (L ~ A, so effectively O(A^2))`** — hot path.

`A.uniqBy` in @mobily/ts-belt is NOT Set-based: node_modules/@mobily/ts-belt/dist/cjs/Array/index.js:1644 `_uniqBy` walks the input and for every element runs `someU(arr, x => caml_equal(uniqFn(x), uniqFn(value)))` over the already-accumulated unique array, re-invoking the key function on BOTH sides of every comparison. Here the key function builds a template string, so each comparison allocates 2 strings. The repo already knows this -- suite-common/graph/src/graphDataFetching.ts:462 carries the comment "Using Set is faster than A.uniq because it's O(n) instead of O(n^2)". `selectTickerFromAccounts` is a PLAIN function, not memoized. Its only caller `selectTickersToBeUpdated` is called from `fetchFiatRatesThunk` (fiatRatesThunks.ts:369), which prepareFiatRatesMiddleware dispatches on EVERY `accountsActions.updateAccount` and `accountsActions.createAccount`, and again on every `blockchainActions.connected` -- and on non-native it dispatches TWICE each time (rateType 'current' and 'lastWeek', fiatRatesMiddleware.ts:32-47, 95-110). discoveryThunks.ts:468-473 dispatches `createAccount` once per discovered account, and blockchainThunks/accountsThunks.ts:313 dispatch `updateAccount` per sync tick that changed anything, so the per-call O(T^2) is multiplied by the account count exactly during discovery, when the UI most needs the main thread. A heavy multi-wallet EVM/Solana user reaches T in the low hundreds (T=300 => ~45k comparisons => ~90k template strings per call, x2 per account event). The per-token `new BigNumber(token.balance ?? '0').gt(0)` at :106 adds one BigNumber allocation per token per call on top.

**`O(n log n) localeCompare invocations where n = the account's unrecognized (spam/airdrop) token bucket; reducible to O(n) key extraction + O(n log n) primitive compares`** — warm path.

`getTokens` (tokenUtils.ts:85-86) routes every token missing from the definitions list into the `unverified*` buckets, and blockbook returns the account's complete token list — an EVM address that has been airdrop-spammed carries hundreds to low thousands of unrecognized contracts, and that bucket only ever grows. `String.prototype.localeCompare` runs a full ICU collation per comparison (roughly an order of magnitude slower than a primitive compare) and is invoked ~n log n times inside the comparator. The selector is read directly by `HiddenTokensTab.tsx:99-101` and by `selectAssetTabOfAccountToken` (suite-native/module-accounts-management/src/selectors.ts:82); its memo input is the `account` object, which gets a new reference on every sync that changes the account, so it recomputes while the tab is mounted.

**`O(targets^2) per transaction, and only on the self/zero-amount branch — external targets with a positive amount return before the scans`** — warm path.

Both `.find()` calls are invariant with respect to the caller's iteration but sit inside the per-target callee, so mapping the whole target list rescans it twice per element. suite-common/transaction-search/src/getTargetAmounts.ts:9 does exactly `targets.flatMap(target => getTargetAmount(target, transaction))`, and simpleSearchTransactions.ts:146 calls that for every transaction of the account history on every search keystroke; packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx:93 and suite-native/module-transactions/src/components/TransactionDetailTargets.tsx:44,86 do the same per rendered target row. Typical sends keep targets in the single digits, which is why this is a P3 — but a consolidation or batch-payout transaction pushes targets into the hundreds and the cost is squared there.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Should be folded into the fix for the already-filed :142/:150 finding rather than filed separately — one hoisted `Map<AccountAddress, number[]>` of pre-parsed paths serves both the `.some()` scan and this comparator. The other call site (:102, via getFirstFreshAddress) is bounded by the gap limit (~20 fresh addresses), so only :163 matters. CAUTION on the sweeper's `toSorted` suggestion: `addresses.sort()` currently mutates, and :163 passes a freshly built `used.concat(visibleUnusedAddresses)` while :102 passes a freshly built array too — so switching to toSorted is safe but is a behaviour change unrelated to perf; keep it out of a perf PR or call it out explicitly. `toSorted` also needs an ES2023 lib target — already used elsewhere in the repo (useAgregatedAccountsWithTokens.ts:163), so that is fine.

- Spans more than one file — see also `packages/crypto-utils/src/bipPath/comparePath.ts:10`.

- Call chain confirmed: fiatRatesMiddleware.ts:57 / fiatRatesThunks.ts:341 -> updateTxsFiatRatesThunk (fiatRatesThunks.ts:145) -> timestamps at :160-162 (one per tx with a blockTime, plus one pass per token contract group at :185-190) -> fetchTransactionsRates (fiatRatesUtils.ts:141) -> getFiatRatesForTimestamps (:172). Async, post-fetch, once per account load — cold/warm, not a render or reducer path, which is why P3 rather than P2. CRITICAL constraint on any fix: the returned `tickers` array order must stay identical to the input `timestamps` order, because fiatRatesUtils.ts:163-165 pairs `results.tickers` with `uniqueTimestamps` BY INDEX. A two-pointer merge requires sorting, so the implementation must sort indices and write results back into an array indexed by the original position — a naive `timestamps.sort()` silently mis-assigns every historical rate. Note getFiatRatesForTimestamps already builds its own sorted copy at :182 for the range params (`[...timestamps].sort(...)`), which can be reused for the sweep as long as the mapping back to original order is kept. P is bounded by CoinGecko market_chart/range granularity (5-min under 1 day, hourly for 1-90 days, daily beyond), so for a multi-year account P is roughly the number of days, i.e. low thousands — real but not the 10M figure the sweeper quoted. findClosestTimestampValue is exported and also unit-tested, so a rewrite must keep its signature/behaviour (including the two @ts-expect-error noUncheckedIndexedAccess casts at :145 and :150) or update the callers and tests together.

- Spans more than one file — see also `suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:164`.

- Fix is a one-liner hoist at the top of simpleSearchTransactions — `const lowerCaseSearch = search.toLowerCase();` — substituted at :159, :170, :181, :195, :200, :201, :202, :203, :216, :228. Zero behaviour delta: every substitution site already calls .toLowerCase() on the same value. Do NOT substitute at :240, where `search` is used raw in `t.txid.includes(search)` — txids are hex and that comparison is intentionally case-sensitive against the un-normalised input; blanket find/replace of `search` would change matching there. IMPORTANT for the issue writer: :240 in the SAME function is the already-filed O(n^2) `unique(txsToSearch).includes(t.txid)` recomputed per transaction, which dominates this finding by orders of magnitude. File this as a fold-in note on that existing issue rather than as a competing standalone one — a reviewer who fixes :240 will be looking at these exact lines. Multiplied by advancedSearchTransactions.ts:36, which calls simpleSearchTransactions once per '&'/'|' term.

- Spans more than one file — see also `suite-common/suite-sync/src/data/account/findSuiteSyncAccountLabel.ts:10`.

- P3 is the right grade: the rendered row count here (receive-address history) is far smaller than the UTXO list that drives the sibling output-label selector, so this is mostly a consistency/cleanup fix that should ship in the same PR as suiteSyncOutputSelectors.ts:56. Fix: select `selectWalletById(state, walletDescriptor)?.addresses` and return `addressesByAddress?.[address]?.label ?? null`. Exact-match semantics are preserved because the record key is the address string itself — but flag one behaviour caveat for the writer: the current `.find()` compares raw strings with no case normalisation, and so does a record lookup, so there is no delta; do NOT 'improve' it with toLowerCase, that would change matching behaviour for EVM addresses. Leave selectAllAddressesForWallet and selectSuiteSyncAccountAddressesByAccount (:13-35) alone — they need the array. Also reached from createSuiteSyncWriteLabels.ts:33 as getAddressLabel.

- Spans more than one file — see also `suite-native/address/src/AddressLabel.tsx:26`.

- n = Invity /info coin catalogue, stored whole in state at tradingCommonReducer.ts:132 and read via selectTradingInfo -> useCoinsAndPlatforms; it grows with upstream listings (hundreds to low thousands of entries), so it is an upstream-grown collection, not a bounded enum — but it is not per-account data. Callers split into two classes: the Redux selectors (tradingSelectors.ts:472, :483, :510, :520) are createMemoizedSelector-wrapped, so they only pay on cache miss; the hook path (useTradingUtils.ts:25/:40/:46) is only useCallback-wrapped, so it re-runs per render per row — TradingTransactionAmounts.tsx:22 (sell), :41/:43 (exchange) and TradingCryptoAmount.tsx. tradeHistoryExportUtils.ts:129 is export-time, cold. Proposed WeakMap<Coins, Map<string, CoinInfo>> index is sound: `coins` is a stable object reference in the reducer between INFO fetches, so the WeakMap key stays valid and is invalidated automatically when a new catalogue lands. Behaviour delta to flag: `Object.keys().find()` returns the FIRST key in insertion order when two keys differ only in case, while `new Map(Object.entries(...))` keeps the LAST — collisions are unlikely but the fix should build the map with a `if (!map.has(k)) map.set(k, v)` guard to preserve first-wins. Also worth noting for the writer: getTradingCoinSymbolByCryptoId (:28) and getTradingSymbolAndContractAddressByCryptoId (:57) both funnel through this function, so one fix covers all call sites.

- Spans more than one file — see also `packages/suite/src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionAmounts.tsx:22`.

- Reclassify the rule from index-before-iterate to loop-invariant-recompute / missing memo when filing. The proposed useMemo keyed on [accounts, tokenDefinitions] producing a Map<AccountKey, TokenInfo[]> is correct and compiles, but note the hook ordering hazard: the early `if (!device) return null;` at :89-91 sits ABOVE :93, so a new useMemo must be placed with the other hooks BEFORE that return or it violates the rules of hooks — this is the one thing that will break the patch if done naively. `accounts` at :74 already comes from selectAccountsWithSuiteSyncLabel, which is candidate #5's O(A x L) selector, so the two findings sit on the same data path and share a PR naturally. The secondary suggestion to skip the block entirely when searchString is empty is the cheapest real win and should be stated first: `searchableTokens` is only consumed after the `if (!searchString) return true` short-circuit, so with a coin filter alone the whole getTokens pass is dead work today. `accountSearchFn`'s per-address `.toLowerCase()` in matchAddressFn (accountUtils.ts:845) is a separate pre-existing linear cost, not caused by this line.

- Spans more than one file — see also `suite-common/transaction-search/src/advancedSearchTransactions.ts:36`.

- ⚠️ `suite-common/transaction-search/src/simpleSearchTransactions.ts` already has an anchor filed as **#31124**. Check whether this should extend that issue instead of being filed fresh.

- FIX CAVEAT: `new Map(entries)` is LAST-WINS while `.find` is FIRST-WINS. Two fake pending txs sharing a txid is practically impossible here, but if you want strict parity build the map with `if (!m.has(t.txid)) m.set(t.txid, t.tokens)`. `accountTxs` is `getAccountTransactions(account.key, ...)` from line 206 and is already in scope, so the hoist is a pure local edit with no new imports. Type note: `t.tokens` is `TokenTransfer[] | undefined`, so type the Map value accordingly or the `tokens ? ... : freshTx` guard widens. Same file, same block: `analyzeTransactions` itself sorts the full known history (`knownRest.filter(...).sort(sortByBlockHeight)` at transactionUtils.ts:738) on every sync - that is the actually expensive line in this path and is a separate, larger finding not claimed by this candidate.

- Two selectors share the helper — `selectAccountsWithSuiteSyncLabel` (:40) and `selectVisibleDeviceAccountsWithSuiteSyncLabel` (:52) — so a single edit inside `mapAccountsToSuiteSyncLabel` fixes both call paths. The Map key must combine networkSymbol AND accountDescriptor, matching findSuiteSyncAccountLabel.ts:10 which requires both to match; keying on descriptor alone changes behaviour for accounts sharing a descriptor across networks. Keep the `createAccountWithSuiteSyncLabel` weakMapMemoize wrapper (:21) — it is what preserves referential stability of the returned account objects for downstream consumers, and dropping it while restructuring would cause spurious re-renders in AccountsMenu/AccountsList.tsx:74, the global send/receive modals and suite-native/accounts/src/selectors.ts. The candidate's claim that this is 'already filed' for suiteSyncOutputSelectors.ts:56 / suiteSyncAddressSelectors.ts:48 is NOT verified against the exclusion lists — neither anchor appears there; treat this as its own finding and mention the siblings only as a suggested same-PR sweep.

- Spans more than one file — see also `suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:32`.

- FIX CAVEATS. (1) Hermes/React Native: both call sites are suite-native, and suite-native/app is the one package with React Compiler enabled. A module-scope `new Intl.Collator()` requires Intl on Hermes - verify the app's Hermes build ships Intl (or guard/lazily construct) before introducing it, otherwise this 'optimisation' becomes a crash. (2) Ordering delta: `Intl.Collator()` with default options and `''.localeCompare(x)` with no arguments use the same default collation, so sort order is preserved; passing any options would change it. (3) The decorate-sort-undecorate variant allocates two extra arrays of length n, which on small buckets is a net loss - the honest minimal fix is just hoisting the collator (or `sortByName` helper) and applying it at BOTH line 70 and line 84. (4) Do not change the return type: these selectors are cast `as TokenInfoBranded[]` and feed `selectAccountManuallyHiddenTokensCount` (line 88), so any map/unmap must return the original token objects by identity.

- Spans more than one file — see also `suite-native/module-accounts-management/src/components/AccountAssets/HiddenTokensTab.tsx:99`.

- Behaviour: `target === transaction.targets.find(...)` is a reference-identity check for 'is this the FIRST account target'; a hoisted `const firstAccountTarget = transaction.targets.find(t => t.isAccountTarget)` preserves it exactly, and `!transaction.targets.find(t => !t.isAccountTarget)` is equivalent to `!transaction.targets.some(...)` since targets are objects (never falsy). Signature change is not free: getTargetAmountRaw is exported and has three external callers — suite-native/module-transactions/src/components/TransactionDetailTargets.tsx:44 and :86, plus getTargetAmount at :927-933 — so adding required params means editing all of them; the lower-risk shape is a new `getTargetAmountsForTransaction(transaction)` helper that hoists once and maps internally (which is exactly what getTargetAmounts.ts:9 wants) while leaving getTargetAmountRaw's signature intact, or optional pre-computed params defaulted to the current lookups. Note TransactionDetailTargets.tsx:44 uses getTargetAmountRaw as a `.find()` predicate over targets, which is the same squared shape on the native detail screen. Low value — bundle it into a larger transactionUtils cleanup rather than filing alone.

- Spans more than one file — see also `suite-common/transaction-search/src/getTargetAmounts.ts:9 (driven per transaction from simpleSearchTransactions.ts:146)`.

- ⚠️ `suite-common/wallet-utils/src/transactionUtils.ts` already has an anchor filed as **#31131**. Check whether this should extend that issue instead of being filed fresh.

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
