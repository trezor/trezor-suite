Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required dependencies"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts:232`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts#L232)

Correct in-repo sibling: [`packages/suite/src/components/earn/staking/tron/hooks/useTronStakePendingTransactionTracking.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/staking/tron/hooks/useTronStakePendingTransactionTracking.ts#L56)

## Before

```tsx
useEffect(() => {
    if (!isCurrentlyPending) {
        return;
    }

    const interval = setInterval(() => {
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    }, pollIntervalMs);

    return () => clearInterval(interval);
}, [account, dispatch, isCurrentlyPending, pollIntervalMs]);
```

## After

```tsx
useEffect(() => {
    if (!isCurrentlyPending) {
        return;
    }

    const interval = setInterval(() => {
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    }, pollIntervalMs);

    return () => clearInterval(interval);
}, [account.key, dispatch, isCurrentlyPending, pollIntervalMs]);
```

The Tron staking sibling already implements this exact interval with the narrow dependency — matched line for line:

```tsx
// useTronStakePendingTransactionTracking.ts:46-56 — correct
useEffect(() => {
    if (!isCurrentlyPending) {
        return;
    }

    const interval = setInterval(() => {
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    }, pollIntervalMs);

    return () => clearInterval(interval);
}, [account.key, dispatch, isCurrentlyPending, pollIntervalMs]);
```

## Why it matters

This is the skill's own documented flagship shape — "`account` is a new object after every blockchain update" — recurring in the yield module while its Tron staking sibling already carries the fix. While a yield deposit/withdraw/wrap/unwrap/claim tx is pending, any unrelated mutation of `account` (including the poll tick this same effect fires) tears down and restarts the `setInterval` instead of letting it run to term, which can delay or disrupt detection of the pending transaction's own confirmation — the one thing this hook exists to track.

## Notes

- The callback body already only reads `account.key`; this is a dependency-array-only change, nothing else in the effect needs to move.
- No new import required.
- `packages/suite` is not React-Compiler-compiled, so this dependency has to be narrowed by hand — the compiler wouldn't fix it even if it ran here, since the defect is an unstable `useEffect` dependency, not a missing memo.
- Cite `useTronStakePendingTransactionTracking.ts:56` when filing — same poll pattern, same file tree, already correct, and the strongest available evidence that the narrower dependency is sufficient and intended here.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
