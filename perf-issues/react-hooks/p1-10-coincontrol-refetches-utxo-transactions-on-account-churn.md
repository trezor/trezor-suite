Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted memo from a render loop"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:144-155`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx#L144-L155)

## Before

```tsx
// fetch all transactions so that we can show a transaction timestamp for each UTXO
useEffect(() => {
    const promise = dispatch(
        fetchUtxoTransactionsForAccountThunk({
            accountKey: account.key,
        }),
    );

    return () => {
        promise.abort();
    };
}, [account, dispatch]);
```

## After

```tsx
// fetch all transactions so that we can show a transaction timestamp for each UTXO
useEffect(() => {
    const promise = dispatch(
        fetchUtxoTransactionsForAccountThunk({
            accountKey: account.key,
        }),
    );

    return () => {
        promise.abort();
    };
}, [account.key, dispatch]);
```

## Why it matters

The effect body only ever reads `account.key` — the thunk call and the abort cleanup don't touch any other field of `account` — so this is the skill's own "silent and unbounded" shape: it re-fires on every store update that gives the open account a fresh reference, not only once when the Coin Control panel mounts. Composing a Bitcoin-like transaction is precisely when the account is actively syncing (new blocks, balance/UTXO-set updates), so each of those ticks aborts the in-flight `fetchUtxoTransactionsForAccountThunk` promise and redispatches it while the user is mid-selection.

## Notes

- Dependency-array-only change; nothing else in the effect needs to move, and no new import is required.
- `packages/suite` is not React-Compiler-covered, so this dependency has to be narrowed by hand.
- Correct in-repo sibling for the identical shape, in this same scan area: `AdaStakingDashboard.tsx:43-52` and `EthStakingDashboard.tsx:59-68` already depend on `accountKey` rather than `account` for their own `fetchAllTransactionsForAccountThunk` effect (verified: both list `[accountKey, dispatch]`) — `AdaStakingDashboard.tsx:52` is also the skill's own named "good" worked example for this exact pattern.
- Additive, not duplicate, alongside drafts on this same coin-control path in `perf-issues/asymptotic-complexity/` (sibling drafts, not yet filed): `p1-01-addtransaction-reducer-scans-the-whole-account-history-onc.md` documents that this same thunk's reducer path (the `unshift` branch of `addTransaction`, taken because this call passes no `page`/`perPage`) is itself O(m²) per dispatch — narrowing this dependency doesn't touch that reducer cost, it only stops multiplying it by however many times `account` churns while the panel stays open, instead of paying it once per mount. `p1-09-coin-control-the-remaining-o-n-squared-utxo-scans-in-useut.md` (which proposes extending filed #31125) and `perf-issues/scheduling/p2-05-coin-control-rescans-the-utxo-set-per-keystroke.md` are about a different hook entirely — `useUtxoSelection.ts`'s own UTXO-array scans and the search box's keystroke-driven rescan — neither touches this fetch effect's dependency array, so this doc doesn't duplicate either.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
