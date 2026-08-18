# `getMyInputsFromTransaction` scans every account address once per transaction input

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. A nested scan inside a nested scan: the `.find()` is per input, and its predicate runs `.includes()` per address.

## Where

[`suite-common/wallet-utils/src/getMyInputsFromTransaction.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/getMyInputsFromTransaction.ts#L17) — `getMyInputsFromTransaction`

`n` is the transaction's input count and `m` is the account's full address list (`change + used + unused`), which is rebuilt by `concat` on every call.

## Before

```ts
export const getMyInputsFromTransaction = ({ account, tx }: GetMyInputsFromTransactionParams) => {
    const changeAddresses = account.addresses ? account.addresses.change : [];
    const allAddresses = account.addresses
        ? changeAddresses.concat(account.addresses.used).concat(account.addresses.unused)
        : [];

    return tx.details.vin.flatMap(input => {
        // find input AccountAddress
        const addr = allAddresses.find(a => input.addresses?.includes(a.address));
        if (!addr) return []; // skip utxo, TODO: set some error? is it even possible?
```

## After

```ts
export const getMyInputsFromTransaction = ({ account, tx }: GetMyInputsFromTransactionParams) => {
    const changeAddresses = account.addresses ? account.addresses.change : [];
    const allAddresses = account.addresses
        ? changeAddresses.concat(account.addresses.used).concat(account.addresses.unused)
        : [];
    const addressByValue = new Map(allAddresses.map(a => [a.address, a] as const));

    return tx.details.vin.flatMap(input => {
        // find input AccountAddress
        const addr = input.addresses
            ?.map(address => addressByValue.get(address))
            .find(isNotNullOrUndefined);
        if (!addr) return []; // skip utxo, TODO: set some error? is it even possible?
```

## Why it matters

`O(vin × addresses × input.addresses)`. The outer `.find()` walks the whole address list for every input, and its predicate walks the input's own address list for every address it visits.

Both outer factors grow with the account. `allAddresses` is the union of change, used and unused addresses — thousands on a long-lived UTXO account, and the `concat` chain allocates two intermediate arrays per call on top. `tx.details.vin` grows with consolidation and batch transactions.

Callers are cold — user-initiated, once per action — which is why this is P2 rather than P1:

- [`suite-common/wallet-core/src/send/composeCancelTransaction/composeCancelTransactionThunk.ts:39`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/composeCancelTransaction/composeCancelTransactionThunk.ts#L39)
- [`suite-common/wallet-utils/src/transactionUtils.ts:1067`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/transactionUtils.ts#L1067)

Both are RBF / cancel-transaction paths, which is precisely where a user is bumping a large consolidation.

No number here is measured.

## Notes

- **Behaviour delta to confirm before filing.** Today's `.find()` returns the first entry of `allAddresses` (change-first, then used, then unused) whose address appears in `input.addresses`. The replacement returns the first entry of `input.addresses` that resolves to a known account address — i.e. the iteration order flips from account-address order to input-address order. In practice a transaction input carries exactly one address for every supported network, so the two are equivalent; if a multi-address input is possible on any backend, keep the original direction and only replace the inner `.includes()` with a `Set`.
- `isNotNullOrUndefined` is exported from `@trezor/utils` and is already the repo idiom for narrowing after a `.map(...).find(...)`. It needs adding to the import list — this file currently imports no runtime values at all, only types, so a new `import { isNotNullOrUndefined } from '@trezor/utils';` is required.
- `as const` in the `Map` build keeps the inferred type `Map<string, AccountAddress>` rather than an array-of-unions.
- The `Map` is built once per call, so a transaction with a single input pays one extra O(addresses) pass it did not before. That is strictly cheaper than the current `.find()` for any input count ≥ 1, since the `.find()` already walks the same list.
- No test file covers this helper today. Worth adding one alongside the fix, covering: input with no matching address (returns `[]`), input matching a change address, and a transaction with several inputs.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
