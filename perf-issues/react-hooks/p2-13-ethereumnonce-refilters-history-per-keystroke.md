Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx:90-94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx#L90-L94)

Trigger: [`EthereumNonce.tsx:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx#L50) — `useWatch({ name: 'ethereumNonce', control })` re-renders this component on every keystroke in the custom-nonce input.

## Before

```tsx
const transactions = useSelector(state => selectAccountTransactions(state, account.key));
...
const nonceValue = useWatch({ name: 'ethereumNonce', control });
...
const pendingSentTxs = transactions.filter(isPending).filter(isSignedByAccount);

const pendingNonces = pendingSentTxs
    .map(tx => tx.ethereumSpecific?.nonce)
    .filter((nonce): nonce is number => typeof nonce === 'number');
```

## After

```tsx
import { useMemo, useState } from 'react';
...
const { pendingSentTxs, pendingNonces } = useMemo(() => {
    const pending = transactions.filter(isPending).filter(isSignedByAccount);

    return {
        pendingSentTxs: pending,
        pendingNonces: pending
            .map(tx => tx.ethereumSpecific?.nonce)
            .filter((nonce): nonce is number => typeof nonce === 'number'),
    };
}, [transactions]);
```

## Why it matters

`selectAccountTransactions` returns the account's whole transaction list, and `EthereumNonce` re-renders on every keystroke in the custom-nonce field via `nonceValue = useWatch(...)` at line 50. Neither `pendingSentTxs` nor `pendingNonces` reads `nonceValue` — both derive only from `transactions` — so today's unmemoized filter-twice-then-map chain re-runs the full scan on every character typed, purely because it happens to sit in the same render as a field that does need to update per keystroke.

## Notes

- Compile requirement: add `useMemo` to the file's existing `import { useState } from 'react';`.
- `packages/suite` is not React-Compiler-covered, so this manual `useMemo` is the correct mechanism here.
- Pure win, not a tradeoff: neither derived value reads `nonceValue`, `bumpedNonce`, or anything else that changes per keystroke, so the memo can only recompute when the account's transaction list actually changes.
- `applyFeeBump` (further down the same file) reads `pendingSentTxs` via `.find(...)` unchanged, just now sourced from the memoized array instead of a render-body local.
- Related but distinct: `perf-issues/asymptotic-complexity/p2-28-transactionutils-getownevmnoncesets.md` (sibling draft, not yet filed) covers a different whole-history scan in the Ethereum nonce space — `getOwnEvmNonceSets` in `suite-common/wallet-utils/src/transactionUtils.ts`, consumed by `useEvmNonceInfo`/`TransactionItem` for the account's main transaction-list rows, once per rendered row. That doc's fix is caching an expensive scan once per account instead of once per row; this doc's fix is not re-running a cheaper, separate scan on every keystroke in an unrelated field. Different file, different consumer, same general shape (an EVM nonce computation walking the account's whole transaction history) — worth a shared glance if either lands, but neither obsoletes the other, and this doc does not repeat that draft's complexity/big-O claim.
- Confidence caveat carried over from the audit: real-world severity depends on typical EVM account transaction-history sizes, which weren't measured for this doc.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
