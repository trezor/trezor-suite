# Solana token-account selection allocates two `BigNumber` per sort comparison

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Keep a sort comparator to O(1) field reads"_. The same defect shape the skill names in `utxoSortingUtils.ts:33`.

## Where

[`networks/solana/network-solana/src/runtime/connect.ts:223`](https://github.com/trezor/trezor-suite/blob/develop/networks/solana/network-solana/src/runtime/connect.ts#L223) — `getMinimumRequiredTokenAccountsForTransfer`

`n` is the number of token accounts holding one SPL mint for the sending account.

## Before

```ts
export const getMinimumRequiredTokenAccountsForTransfer = (
    tokenAccounts: TokenAccount[],
    requiredAmount: string,
) => {
    // sort the tokenAccounts from highest to lowest balance
    let accumulatedBalance = new BigNumber('0');
    const sorted = [...tokenAccounts].sort(
        (a, b) => new BigNumber(b.balance).comparedTo(new BigNumber(a.balance)) ?? 0,
    );
```

## After

```ts
export const getMinimumRequiredTokenAccountsForTransfer = (
    tokenAccounts: TokenAccount[],
    requiredAmount: string,
) => {
    // sort the tokenAccounts from highest to lowest balance
    let accumulatedBalance = new BigNumber('0');
    const balanceByAccount = new Map(
        tokenAccounts.map(tokenAccount => [tokenAccount, new BigNumber(tokenAccount.balance)] as const),
    );
    const sorted = [...tokenAccounts].sort(
        (a, b) => balanceByAccount.get(b)?.comparedTo(balanceByAccount.get(a) ?? 0) ?? 0,
    );
```

## Why it matters

The comparator allocates and parses two `BigNumber` instances on every comparison — `2·n·log n` allocations where `n` parses would do. `BigNumber` construction from a string is not cheap: it validates and decomposes the decimal representation.

`n` is the sending account's token-account list for one mint. It is usually small, but it is set by upstream chain data rather than by anything Suite controls: an account that has received the same SPL token through many different programs accumulates token accounts, and this function exists precisely because that list can need consolidating.

This is graded P2 rather than P1 because `n` is typically tens, not thousands. It is worth taking because it is a two-line change and it is the exact pattern the skill documents.

No number here is measured. #31126 measured the identical defect — two `new BigNumber` per comparison — at **3.6 ms → 1.3 ms at n=2000**; that is that issue's measurement, on UTXOs, and `n` here is far smaller.

## Notes

- ⚠️ **`toSorted` was deliberately not used.** `networks/solana/network-solana` is reachable from `suite-native`, and Hermes support for `Array.prototype.toSorted` must be confirmed before it is introduced there — #31126 flags the same caveat. `[...tokenAccounts].sort(...)` already copies, so the non-mutating requirement from `skills/defensive-programming` is satisfied without it.
- Keying the `Map` on the `TokenAccount` object rather than on `balance` is deliberate: two accounts can hold identical balances, and a string key would collapse them and corrupt the sort.
- `comparedTo` returns `number | null`; the existing `?? 0` handles the `null` case and is preserved. The added `?? 0` inside `comparedTo(...)` handles a `Map` miss, which cannot happen in practice since the map is built from the same array — it is there to satisfy `noUncheckedIndexedAccess`-style strictness rather than to encode real behaviour.
- Sort stability and result are unchanged: the same comparisons produce the same ordering, only the operand construction moves.
- `getMinimumRequiredTokenAccountsForTransfer` is exported for testing (the comment says so), so there is an existing test file to extend with a same-balance case that would catch a key-collision regression.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
