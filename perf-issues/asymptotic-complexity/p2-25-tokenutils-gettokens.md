# `getTokens` re-normalises the search query inside the sort comparator — hoist it above the loop

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`suite-common/wallet-core/src/tokens/tokenUtils.ts:63`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L63) (also 58) — `getTokens`

`filteredTokens` = `account.tokens` (minus NFTs, or only NFTs), i.e. every ERC-20/SPL/TRC-20 contract the account has ever been credited with, including the airdrop/spam long tail — this runs BEFORE the coin-definitions bucketing at lines 82-92, so the unfiltered spam list is the input, not the curated subset.

## Before

```ts
const isKnown = isTokenDefinitionKnown(tokenDefinitions?.data, symbol, token.contract);
const isHidden = hiddenTokens.has(token.contract);
const isShown = shownTokens.has(token.contract);

const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

if (searchQuery && !(isNft ? isNftMatchesSearch(token, query) : isTokenMatchesSearch(token, query)))
    return;
```

## After

Hoist the normalisation above the loop and pass the already-normalised value down: `const query = searchQuery ? searchQuery.trim().toLowerCase() : '';` immediately after `const shownTokens = ...` (line 56), then use `query` inside the callback. Also drop the redundant re-lowercasing in `isTokenMatchesSearch` (suite-common/wallet-utils/src/tokenUtils.ts:102 `const search = rawSearch.toLowerCase();`) — every caller already passes a lowercased query — or rename the parameter to make the precondition explicit.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(T^2) key-function invocations with 2 template-string allocations per comparison, T = distinct tickers (accounts + known-definition tokens with balance) across ALL remembered wallets; multiplied by account count during discovery`** — hot path.

`searchQuery` does not change across the loop, so `searchQuery.trim().toLowerCase()` is pure loop-invariant work executed once per token. The search-bearing call sites are the interactive ones: packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx:57, hidden-tokens/HiddenTokensTable.tsx:25 and :31 (two full passes), inactive/defi tables, TokensNavigation.tsx:126, and packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:105 which calls `getTokens` per account inside a filter over the whole account list — so on the accounts-menu search the total is 3 x (sum of tokens over all accounts) throwaway strings per keystroke, and the hidden-tokens tab pays it twice over the spam bucket, which is exactly the largest bucket. n grows with upstream token data and has no ceiling.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Not on either exclusion list — fiatRatesReducer.ts:127 is excluded, this is fiatRatesSelectors.ts:122, a different file and a different defect. The proposed Set-keyed rewrite is behaviour-preserving with two caveats the issue must state: (1) the existing pipeline emits a native ticker for EVERY account and dedupes afterwards, so the rewrite must keep the `seen` set shared across the native and token keys as written or duplicate natives leak through — natives key on bare `account.symbol`, tokens on `symbol-contract`, which cannot collide, so a single Set is safe; (2) `A.sortBy(ticker => tokenAddress ? 1 : 0)` at :125 is a STABLE sort that pushes natives ahead of tokens; the manual loop already emits each account's native before its tokens, but across accounts the interleaving differs from the sorted output (sorted: all natives, then all tokens; loop: acc1-native, acc1-tokens, acc2-native, ...). fetchFiatRatesThunk chunks the result 4 at a time (fiatRatesThunks.ts:380-389) and fetches chunks sequentially, so ordering DOES affect which rates arrive first — natives-first is deliberate for perceived load time. Keep the sort, or emit natives and tokens into two arrays and concat. (3) `new BigNumber(token.balance ?? '0').gt(0)` at :106 also allocates per token per call; the suggested `!token.balance || token.balance === '0'` fast path is NOT equivalent for values like '0.0' or '0x0' — guard with a cheap check then fall back to BigNumber rather than replacing it. Wrapping selectTickerFromAccounts in createWeakMapSelector over selectAccounts is the higher-leverage half of the fix since the middleware fires two dispatches back to back.

- Spans more than one file — see also `suite-common/wallet-utils/src/tokenUtils.ts:102`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
