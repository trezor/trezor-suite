Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted memo from a render loop"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:115-120`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts#L115-L120)

[`packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx:83-107`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx#L83-L107)
(this is `useEthereumCancelTxCompose`'s only caller, and carries the same defect a second time for
non-Ethereum accounts)

Co-anchors that manufacture the fresh `account`/`tx`/`chainedTxs` references both effects depend on,
all in the modal's parent:

- [`TxDetailModal.tsx:101`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/TxDetailModal.tsx#L101) — `account`, via `selectAccountByKey`
- [`TxDetailModal.tsx:92-99`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/TxDetailModal.tsx#L92-L99) — `tx`
- [`TxDetailModal.tsx:109-114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/TxDetailModal.tsx#L109-L114) — `chainedTxs`

## Before

### 1. `useEthereumCancelTxCompose.ts` — Ethereum path

```tsx
useEffect(() => {
    if (account.networkType !== 'ethereum' || !feeInfo || tx.rbfParams?.type !== 'ethereum') {
        return;
    }
    mutate();
}, [account, tx, feeInfo, mutate]);
```

### 2. `CancelTransactionModal.tsx` — Bitcoin/UTXO path

```tsx
useEffect(() => {
    if (account.networkType === 'ethereum') return;
    if (tx.vsize === undefined) return;
    if (!isComposeCancelTransactionPartialAccount(account)) return;

    dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
        .unwrap()
        .then(precomposed => {
            setUtxoComposedCancelTx({ ...precomposed, rbfType: 'cancel', prevTxid: tx.txid });
            setUtxoCancelFormState({
                feeLimit: '', // Eth only
                feePerUnit: precomposed.feePerByte,
                hasCoinControlBeenOpened: false,
                isCoinControlEnabled: false,
                options: ['broadcast'],
                outputs: precomposed.outputs.map(output => ({
                    ...DEFAULT_PAYMENT,
                    ...output,
                    amount: output.amount.toString(),
                })),
                selectedUtxos: [],
            });
        })
        .catch(setUtxoError);
}, [account, tx, dispatch, chainedTxs]);
```

Both guard blocks only ever check type tags (`account.networkType`, `tx.rbfParams?.type`) or an
`undefined` check (`tx.vsize`), never a value that changes on an ordinary balance/history refresh.
`account` reaches both effects via `TxDetailModal`'s `selectAccountByKey(state, accountKey)`, memoized
on `[selectAccounts, accountKey]` — `selectAccounts` returns a fresh top-level array on _any_ account
update, and the account this modal is open on is, by definition, the one most likely to be updating
while the modal is open.

## After

### 1. `useEthereumCancelTxCompose.ts`

```tsx
useEffect(() => {
    if (account.networkType !== 'ethereum' || !feeInfo || tx.rbfParams?.type !== 'ethereum') {
        return;
    }
    mutate();
}, [account.key, account.networkType, tx.txid, tx.rbfParams, feeInfo, mutate]);
```

`mutate`'s `mutationFn` closure already reads `account`/`tx`/`feeInfo` fresh from the enclosing hook
scope each time it actually runs (react-query re-creates `mutationFn` every render and always invokes
the latest one), so narrowing the trigger array doesn't lose freshness — it only stops re-triggering on
reference churn that isn't one of the values the guard cares about. `feeInfo` is already a
`createMemoizedSelector`/`createWeakMapSelector`-backed result (`selectConvertedNetworkFeeInfo`), so
it's fine to leave as-is.

### 2. `CancelTransactionModal.tsx`

```tsx
const chainedTxIds = chainedTxs?.map(chainedTx => chainedTx.txid).join();

useEffect(() => {
    if (account.networkType === 'ethereum') return;
    if (tx.vsize === undefined) return;
    if (!isComposeCancelTransactionPartialAccount(account)) return;

    dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
        .unwrap()
        .then(precomposed => {
            setUtxoComposedCancelTx({ ...precomposed, rbfType: 'cancel', prevTxid: tx.txid });
            setUtxoCancelFormState({
                feeLimit: '', // Eth only
                feePerUnit: precomposed.feePerByte,
                hasCoinControlBeenOpened: false,
                isCoinControlEnabled: false,
                options: ['broadcast'],
                outputs: precomposed.outputs.map(output => ({
                    ...DEFAULT_PAYMENT,
                    ...output,
                    amount: output.amount.toString(),
                })),
                selectedUtxos: [],
            });
        })
        .catch(setUtxoError);
}, [account.key, account.networkType, tx.txid, tx.vsize, chainedTxIds, dispatch]);
```

Same reasoning as (1): this effect is a plain component effect (not a memoized custom-hook return
value), so whichever render's closure actually fires already carries that render's own `account`/`tx`/
`chainedTxs` — narrowing the array only changes when it fires, not what it sees. `tx.vsize` is folded
into the array because the guard's own `undefined` check is a real transition condition the account/tx
identity alone wouldn't capture. `chainedTxIds` gives `composeCancelTransactionThunk`'s
`chainedTxs`-dependent fee calculation (`calculateNewFee` → `calculateChainedTransactionsFeeForRbf`) a
primitive that identifies the chained set without retriggering on every unrelated reference churn of
the array itself.

## Why it matters

This is the skill's own "silent and unbounded" shape, occurring twice: every time the pending
transaction's own record refreshes (new confirmation count, mempool update) while this modal is open,
both effects redispatch a real fee-compose operation —
`composeSendFormTransactionFeeLevelsThunk`/`composeCancelTransactionThunk` — for a cancel the user
hasn't asked for again, while they're mid-review of a "cancel this stuck transaction" screen. Unlike
the sibling compose hooks in this same area (`useCompose.ts`, `useStakeCompose.ts`), which both
compare a primitive (`state.feeInfo.blockHeight`) against a ref before calling `composeRequest()`,
neither of these two effects has any such gate — they refire on every reference change of
`account`/`tx` regardless of whether anything the guard checks actually changed.

## Notes

- Same-PR cleanup, same file: `CancelTransactionModal.tsx:110-111`'s own
  `CancelTxContext.Provider value={{ composedCancelTx, cancelFormState: formState, isComposing }}` is
  also unmemoized. Small consumer count (3, all in the same modal subtree), so it isn't worth a
  standalone doc, but since this file is being touched anyway for the fix above:
    ```tsx
    const cancelTxContextValue = useMemo(
        () => ({ composedCancelTx, cancelFormState: formState, isComposing }),
        [composedCancelTx, formState, isComposing],
    );
    ```
    used as `<CancelTxContext.Provider value={cancelTxContextValue}>`. Needs `useMemo` added to this
    file's existing `import { useEffect, useState } from 'react';`.
- No new imports needed for the two effect fixes themselves — `account.key`, `tx.txid`, `tx.rbfParams`,
  `tx.vsize` are all already-accessible properties.
- `packages/suite` is not React-Compiler-covered, so both fixes rely on manual dependency-array
  narrowing rather than a compiler.
- `TxDetailModal.tsx`'s own `tx`/`chainedTxs` `useMemo`s are themselves correctly narrowed to their
  actual inputs (`[resolvedTx, filteredInternalTransfers]` and `[tx, transactions]`) — they are not a
  separate defect; they simply propagate the instability that originates from `resolvedTx`/`accounts`
  being fresh Redux objects on every relevant store update, which is exactly what this doc's fix
  insulates the two compose effects from.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
