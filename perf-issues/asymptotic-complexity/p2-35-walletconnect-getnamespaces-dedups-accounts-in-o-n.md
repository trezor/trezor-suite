# WalletConnect `getNamespaces` dedups the account list in O(n²)

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. A hand-rolled dedup that rescans everything accepted so far for each candidate.

## Where

[`suite-common/walletconnect/src/adapters/index.ts:53`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/walletconnect/src/adapters/index.ts#L53) — `getNamespaces`

`n` is every account the wallet exposes to a dApp session — across every enabled network, account type and passphrase instance.

## Before

```ts
export const getNamespaces = (accounts: Account[]) => {
    const accountsDeduped: Account[] = [];
    accounts.forEach(account => {
        if (
            !accountsDeduped.some(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            )
        ) {
            accountsDeduped.push(account);
        }
    });

    return adapters
```

## After

```ts
export const getNamespaces = (accounts: Account[]) => {
    const seen = new Set<string>();
    const accountsDeduped: Account[] = [];
    accounts.forEach(account => {
        const key = `${account.symbol}:${account.descriptor}`;
        if (!seen.has(key)) {
            seen.add(key);
            accountsDeduped.push(account);
        }
    });

    return adapters
```

## Why it matters

`O(n²)` string comparisons — `accountsDeduped.some(...)` walks every already-accepted account for every candidate, and each visit compares two fields.

`n` reaches the hundreds on a wallet with many networks enabled and several passphrase instances. `getNamespaces` runs on every WalletConnect session proposal and again whenever the account set changes, so it sits on the interactive path of connecting to a dApp.

No number here is measured.

## Notes

- Order is preserved exactly: the `Set` only replaces the membership test, and the first occurrence of each `(symbol, descriptor)` pair is still the one pushed. Downstream `adapters.map(adapter => adapter.getNamespace(accountsDeduped))` is unaffected.
- `${symbol}:${descriptor}` is injective for the pair because `symbol` is a `NetworkSymbol` enum member and therefore never contains `:`. If that assumption ever breaks, a nested `Map<symbol, Set<descriptor>>` is the safe form.
- The `reduce` immediately below this block (`.reduce((acc, val) => { Object.assign(acc, val); return acc; }, {})`) is already correct — it mutates the accumulator rather than spreading it. No change needed there; mentioned only so a reviewer does not "fix" it.
- Adapter count is bounded (one per network type), so the `adapters.map(...)` around it is fine and out of scope.
- No test file covers `getNamespaces`. The fix is behaviour-preserving, but a test asserting dedup order would be cheap to add alongside.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
