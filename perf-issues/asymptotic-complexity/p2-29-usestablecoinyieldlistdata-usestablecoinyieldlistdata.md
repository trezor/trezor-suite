# `useStablecoinYieldListData` re-normalises every account token contract per vault — index the tokens once

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite-native/module-earn/src/hooks/useStablecoinYieldListData.ts:111`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useStablecoinYieldListData.ts#L111) (also 115, 143) — `useStablecoinYieldListData (listData useMemo)`

`yieldOpportunities` (yield.xyz vault list, fetched with YIELD_OPPORTUNITIES_DEFAULT_LIMIT = 100 in suite-common/earn-stablecoin-api/src/config/index.ts), `accounts` (every visible device account) and `account.tokens` (ERC-20 token list per EVM account, routinely hundreds).

## Before

```ts
    ? toTokenAddress(vault.outputToken.address)
    : null;
const outputTokenAddress = receiptTokenContract?.toLowerCase();

const accountsWithPosition = receiptTokenContract
    ? accounts.filter(
          account =>
              account.symbol === network.symbol &&
              hasPositiveContractTokenBalance(account, receiptTokenContract),
      )
    : [];
```

## After

Index once above the vault loop. Build `accountsBySymbol = Map<NetworkSymbol, Account[]>` from `accounts`, and for each account a `Map<normalizedContract, TokenInfo>` (key with the existing `getContractAddressForNetworkSymbol` helper, computed once per token instead of once per vault-token pair). Then the body becomes `accountsBySymbol.get(network.symbol) ?? []` filtered by an O(1) `tokensByContract.get(receiptTokenContract)` lookup, and line 143's `.find()` becomes the same `Map.get`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(100 vaults x accounts x tokensPerAccount) contract normalisations`** — hot path.

The `for (const vault of yieldOpportunities)` at line 88 re-scans the ENTIRE account list per vault, and `hasPositiveContractTokenBalance` (suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:55) re-scans that account's whole token array, normalising each contract through `getContractAddressForNetworkSymbol` (a `.toLowerCase()` allocation per token) and building `new BigNumber(token.balance)` on every match. Nothing inside the filter depends on the vault except `network.symbol` and `receiptTokenContract`. With 100 vaults x 30 accounts x 100 tokens that is 300k normalisations per recomputation. Line 143 repeats the pattern: `account.tokens?.find(token => token.contract.toLowerCase() === outputTokenAddress)` re-scans the same token array a second time for every (vault, account) pair.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- BigNumber is NOT allocated per token — `isAccountTokenContractMatch(...) && new BigNumber(...)` short-circuits, so it is built only on a contract match; do not repeat that claim in the issue. The fix must key the token map with `getContractAddressForNetworkSymbol(account.symbol, token.contract)`, not a bare `.toLowerCase()` — the helper is symbol-aware (tokenUtils.ts:20) and Cardano policy-id handling depends on it. Building the index inside the same useMemo (above the vault loop) keeps React Compiler out of it; no new hook needed. `accountsWithPosition` currently also filters on `account.symbol === network.symbol`, so an `accountsBySymbol` Map must preserve the original account order to keep the resulting `activeItems` order stable before the two sorts at 171-176. Companion file: suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:56 (hasPositiveContractTokenBalance) and :21 (getAccountTokenByContract) share the same scan.

- Spans more than one file — see also `suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:55`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
