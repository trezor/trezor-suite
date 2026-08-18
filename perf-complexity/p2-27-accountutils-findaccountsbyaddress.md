# `accountUtils` scans addresses and UTXOs per element in three places

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite-common/wallet-utils/src/accountUtils.ts:308`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L308) (also 313,314,315,318,319,320) — `findAccountsByAddress`

n = every address of every same-symbol account in state.wallet.accounts (addresses.used grows with each receive, addresses.change with each send; the account list spans all devices/passphrase wallets, not just the active one); the multiplier is the number of transaction-target rows rendered on the page

[`suite-common/wallet-utils/src/accountUtils.ts:921`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L921) — `findUtxo`, inside `getPendingAccount`

[`suite-common/wallet-utils/src/accountUtils.ts:1018`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L1018) — self-output matching, inside `getPendingAccount`

## Before

```ts
export const findAccountsByDescriptor = (descriptor: string, accounts: Account[]) =>
    accounts.filter(a => a.descriptor === descriptor);

export const findAccountsByAddress = (
    symbol: NetworkSymbol,
    address: string,
    accounts: Account[],
) => accounts.filter(account => account.symbol === symbol);
```

## After

Index the address book once instead of scanning it per row. Add a memoized selector that builds Map<`${symbol}:${address}`, Account[]> from accounts (walking descriptor + addresses.used/unused/change a single time), and have AccountLabelForOwnAddress do one Map.get. Keep findAccountsByAddress for the genuinely one-off callers (SignMessageModal, migrateToV56), but the per-row consumers must go through the index.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### 2. `findUtxo` rescans the composed inputs per UTXO — `accountUtils.ts:921`

O(utxos × inputs). Both peak together: a large consolidation makes `inputs` big at exactly the moment `account.utxo` is big.

```ts
account.utxo?.filter(
    u =>
        !inputs.some(i => i.prev_hash === u.txid && i.prev_index === u.vout) && u.txid !== prevTxid,
) || [];
```

Index the inputs by outpoint once, above the filter:

```ts
const spentOutpoints = new Set(inputs.map(i => `${i.prev_hash}:${i.prev_index}`));

return (
    account.utxo?.filter(u => !spentOutpoints.has(`${u.txid}:${u.vout}`) && u.txid !== prevTxid) ||
    []
);
```

### 3. Self-output matching rescans the address list per output — `accountUtils.ts:1018`

O(outputs × addresses), inside the same `getPendingAccount`.

```ts
tx.outputs.forEach(output => {
    if ('address' in output) {
        // find self address
        if (addresses.find(a => a.address === output.address)) {
            // append self outputs to balance
            availableBalanceBig = availableBalanceBig.plus(output.amount);
        }
    }
});
```

Build the address set once, above the loop:

```ts
const ownAddresses = new Set(addresses.map(a => a.address));

tx.outputs.forEach(output => {
    if ('address' in output && ownAddresses.has(output.address)) {
        // append self outputs to balance
        availableBalanceBig = availableBalanceBig.plus(output.amount);
    }
});
```

## Why it matters

**`O(rendered target rows x same-symbol accounts x addresses per account), plus one intermediate array allocation per call from the leading .filter(symbol)`** — hot path.

This is the two-file case the skill warns about: the list maps rows, the ROW component does the scan. TransactionList renders 25 TransactionItems, each renders TransactionTargetsList (packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTargetsList.tsx:24) which maps allOutputs to TransactionTarget, which for a 'sent' tx renders TargetAddressLabel; that component maps target.addresses and renders <AccountLabelForOwnAddress> per address (TargetAddressLabel.tsx:51), and AccountLabelForOwnAddress.tsx:22 calls findAccountsByAddress(symbol, address, accounts) — a fresh linear scan of used+unused+change of every same-symbol account, per row, with no memo. It is the bitcoin/cardano path that hurts (EVM accounts carry no `addresses` and fall through to the O(1) descriptor compare) — exactly where the address book grows. A user with a handful of BTC accounts of ~1000 addresses each and 30-70 sent-target rows on a page does ~10^5-10^6 string comparisons per render, and it re-runs whenever the accounts array identity changes (every account update).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Correctness constraints for the index: (a) matching is EXACT-case (`u.address === address`, `a.descriptor === address`) — do NOT lowercase the Map key or EVM descriptor matching semantics change; (b) callers take `[0]`/`.at(0)`, so the index must preserve `accounts`-array order (build by walking accounts in order and pushing into the bucket, first-wins on read); (c) an account can match through several lists, so buckets must dedupe by account key or an account could appear twice in the returned array (today the outer `.filter` returns each account at most once) — TransactionReviewOutputList.tsx:120 only checks `.length > 0`, but keeping the array shape identical avoids surprises. Other callers to leave alone (genuinely one-off): SignMessageModal.tsx:81, migrateToV56.ts:50, TransactionReviewOutput.tsx:715, TransactionReviewOutputList.tsx:120. Also worth flagging in the issue body (not as a separate finding): suite-common/wallet-core/src/selectors.ts:245 and suite-common/wallet-core/src/transactions/transactionsThunks.ts:175 call the same helper inside their own loops and would benefit from the same index. AccountLabelForOwnAddress is a plain function component (no React.memo), so under React Compiler the call still re-runs whenever the component renders — the memoized-selector/index route is the fix, not wrapping the call in useMemo.

- Spans more than one file — see also `packages/suite/src/components/suite/labeling/AccountLabelForOwnAddress.tsx:22 (rendered per row from TargetAddressLabel.tsx:51 / TransactionTarget.tsx:183)`.

- ⚠️ `suite-common/wallet-utils/src/accountUtils.ts` already has an anchor filed as **#31131**. Check whether this should extend that issue instead of being filed fresh.

- **Audit guidance.** Bundle THREE anchors in accountUtils.ts: :308 (findAccountsByAddress, wave 2) and the wave-1 pair :921 (findUtxo, O(utxos x inputs)) and :1018 (addresses.find per output) — both inside getPendingAccount. See audit findings #28 and #49.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
