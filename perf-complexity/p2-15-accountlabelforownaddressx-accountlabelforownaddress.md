# `AccountLabelForOwnAddress` scans every account's address list per rendered address — add an address→account selector

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/suite/src/components/suite/labeling/AccountLabelForOwnAddress.tsx:22`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/labeling/AccountLabelForOwnAddress.tsx#L22) (also 16) — `AccountLabelForOwnAddress`

`accounts` is every account in the store (all devices/hidden wallets), and for each same-symbol account findAccountsByAddress scans `addresses.used`, `addresses.unused` and `addresses.change` — arrays that grow monotonically with account usage. The outer collection is every address rendered by the transaction list.

## Before

```tsx
if (!address || !symbol) {
    return null;
}

const relevantAccounts = findAccountsByAddress(symbol, address, accounts);

const firstAccount = relevantAccounts[0];

if (!firstAccount) {
    return !knownOnly ? <Address value={address} isTruncated /> : null;
}
```

## After

Index once, look up per row: add a memoized selector that builds `Map<string, Account>` from address -> account for the given symbol (keyed off `state.wallet.accounts`) and have AccountLabelForOwnAddress do a single `map.get(address)`. The same map removes the per-line scan at TransactionReviewOutput.tsx:715 and TransactionReviewOutputList.tsx:120.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(accountsOfSymbol x addressesPerAccount) per rendered address, per render`** — hot path.

The scan is two files away from the loop that drives it: TransactionList -> TransactionItem -> TransactionTargetsList (allOutputs.map) -> TransactionTarget -> TargetAddressLabel, which maps `target.addresses` at TargetAddressLabel.tsx:42 and renders one <AccountLabelForOwnAddress> per address for every `sent` transaction. It is also rendered per internal transfer (TransactionTarget.tsx:183) and per token transfer (TokenTransferAddressLabel.tsx:19,21). Nothing is memoized: findAccountsByAddress allocates two intermediate arrays and runs three `.some()` passes per account on every render. A page shows 25 transactions, each with one or more targets, so a Bitcoin wallet with a few accounts of a few thousand used+change addresses does millions of string comparisons per render of the transaction list.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Held at P2 rather than P1 deliberately: I could not confirm babel-plugin-react-compiler is wired into the web build (only compiler-era eslint suppressions referencing plans/react-compiler-follow-ups.md exist under packages/suite). If the compiler IS on, the body auto-memoizes on (symbol, address, accounts, knownOnly) and the sweep runs on mount and on every accounts-identity change (each sync/block) rather than every render — still O(rows x addresses) per account update. If it is off, it is per render and this is P1. State that uncertainty in the issue instead of asserting either. The memoized address->Account map must be keyed per symbol and must preserve first-wins: the component uses relevantAccounts[0], today the first match in `state.wallet.accounts` array order, so build the map skip-if-present, not last-writer-wins. The same map removes identical scans at TransactionReviewOutput.tsx:715, TransactionReviewOutputList.tsx:120, SignMessageModal.tsx:81 and suite-common/wallet-core/src/selectors.ts:245 — list them as follow-ups, do not file separately. Do not touch migrateToV56.ts:50 (one-time migration).

- Spans more than one file — see also `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:42`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
