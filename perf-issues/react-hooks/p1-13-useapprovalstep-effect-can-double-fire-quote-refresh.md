Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted memo from a render loop"_. Found by sweep, not named in the doc.

## Where

[`suite-common/trading/src/hooks/useApprovalStep.ts:49-85`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/hooks/useApprovalStep.ts#L49-L85) — the effect that can double-fire; its dependency array is at line 85.

Root cause: [`suite-common/trading/src/hooks/useAllowanceTxTracking.ts:76-80`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/hooks/useAllowanceTxTracking.ts#L76-L80) returns a fresh object literal on every call.

Consumer chain that puts the unstable value behind a Provider (any of these re-rendering re-fires the effect above):

- [`packages/suite/src/hooks/wallet/allowance/useAllowance.ts:15-18`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/allowance/useAllowance.ts#L15-L18) — also returns a plain, unmemoized `{ tx, state }` object
- [`packages/suite/src/views/wallet/trading/exchange/TradingExchangeForm.tsx:27`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/exchange/TradingExchangeForm.tsx#L27)
- [`packages/suite/src/components/earn/yield/deposit/YieldDeposit.tsx:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/yield/deposit/YieldDeposit.tsx#L43)
- [`packages/suite/src/components/earn/yield/withdraw/YieldWithdraw.tsx:39`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/yield/withdraw/YieldWithdraw.tsx#L39)

Effect consumer: [`packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx:45,80-85`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx#L45-L85)

## Before

```ts
// useAllowanceTxTracking.ts:38-81 — return value is a fresh object literal every call
export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

    const status = useMemo<TransactionStatus>(() => {
        // ...status derivation, unchanged
    }, [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
```

```ts
// useApprovalStep.ts:43-85 — effect #1 correctly narrows to tx.approvalTxid; effect #2 depends on
// the whole `tx` object and calls refreshQuotesRef.current() every time it refires while confirmed
useEffect(() => {
    if (tx.approvalTxid && !txApprovalType) {
        setTxApprovalType(currentApprovalType);
    }
}, [tx.approvalTxid, currentApprovalType, txApprovalType]);

useEffect(() => {
    const thisRunId = ++effectRunIdRef.current;

    const { approvalTxid, status, setApprovalTxid } = tx;
    if (!approvalTxid) {
        return;
    }

    if (status.isPending) {
        setApprovalStep('LOADING');

        return;
    }

    if (status.isFailed) {
        setApprovalStep('REQUIRED');

        return;
    }

    if (status.isConfirmed && txApprovalType) {
        setApprovalStep(txApprovalType === 'APPROVE' ? 'APPROVED' : 'REQUIRED');

        refreshQuotesRef
            .current()
            .catch(error => {
                console.error('Failed to refresh quotes after approval:', error);
            })
            .finally(() => {
                if (effectRunIdRef.current !== thisRunId) {
                    return;
                }
                setApprovalTxid(null);
                setTxApprovalType(null);
            });
    }
}, [tx, txApprovalType, refreshQuotesRef]);
```

## After

```ts
// useAllowanceTxTracking.ts — wrap the return in useMemo
export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

    const status = useMemo<TransactionStatus>(() => {
        // ...status derivation, unchanged
    }, [transaction]);

    return useMemo(
        () => ({
            approvalTxid,
            status,
            setApprovalTxid,
        }),
        [approvalTxid, status, setApprovalTxid],
    );
};
```

`setApprovalTxid` is a `useState` setter (stable by React) and `status` is already its own stable memo, so this holds a single reference until `approvalTxid` itself actually changes — which stabilizes `tx` all the way through the `AllowanceContext.Provider` hop and into `useApprovalStep`'s second effect, with no change needed in `useApprovalStep.ts` itself.

## Why it matters

Every re-render of the `AllowanceContext.Provider` owner (`TradingExchangeForm`, `YieldDeposit`, or `YieldWithdraw`) while a token approval sits in the confirmed-but-not-yet-cleared window re-fires `useApprovalStep`'s second effect and calls `refreshQuotesRef.current()` again — a second, concurrent `refreshQuotes()` — because nothing in the dependency array or the effect body deduplicates on `tx`'s _content_, only its reference; `effectRunIdRef` only guards the `.finally()` cleanup racing itself, it does not stop the extra call from being issued. This is the skill's "silent and unbounded" shape — an effect keyed on a fresh whole-object dependency, calling something that talks to the network — landing in a real-money flow: the buy/sell/exchange token-allowance approval and the Earn Yield deposit/withdraw allowance approval.

## Notes

- Compile requirement: none — `useMemo` is already imported in `useAllowanceTxTracking.ts` (`import { useMemo, useState } from 'react';`).
- Which app: `suite-common/trading` ships to both `packages/suite` (uncompiled — manual memoization is the only mechanism) and `suite-native` (compiled). Per the skill, memoize for the web consumer regardless — `suite-common` itself is never compiled either way. `suite-native/module-trading/src/screens/TradingConfirmingScreen.tsx:56-60` also calls `useAllowanceTxTracking` directly, but destructures `status`/`approvalTxid`/`setApprovalTxid` immediately rather than holding the whole `tx` object, so it isn't independently exposed to this defect — it simply benefits from the fix without needing one of its own.
- Alternative/complementary fix, equally valid per the sweep: narrow `useApprovalStep`'s second effect's dependency array (line 85) from `[tx, txApprovalType, refreshQuotesRef]` to the primitives effect #1 already uses correctly (`tx.approvalTxid`, `tx.status.isPending`, `tx.status.isFailed`, `tx.status.isConfirmed`), destructuring them from `tx` inside the effect body instead of relying on `tx`'s own identity. Fixing `useAllowanceTxTracking.ts` is the cheaper of the two because `tx` also flows through the `AllowanceContext.Provider` value, so stabilizing it at the source is a same-PR win for that Provider's identity too, on top of the effect fix.
- Honest sizing: the double-fire needs the Provider owner itself to re-render while `status.isConfirmed && txApprovalType` is true — plausible given its own polling/discovery selectors (`selectHasRunningDiscovery`, `selectAreFeesLoading`, quote polling), but not something this sweep measured. Flagged as P1 because the cost of firing is a real, concurrent network call in a money-moving flow, not because the frequency is proven high.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
