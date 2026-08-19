Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:86`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx#L86)

Co-anchor, the function called there (three unmemoized passes per call): [`suite-common/wallet-core/src/transactions/target/createTargets.ts:59`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/target/createTargets.ts#L59)

## Before

```tsx
export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        isActionDisabled,
        isPending,
        network,
        accountType,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);

        const account = useSelector(selectSelectedAccount) || null;

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type } = transaction;

        const allOutputs = account !== null ? createTargets({ transaction, account }) : [];
```

```tsx
// createTargets.ts:59-67 — three .map()/.filter() passes, spread into a new array, every call
export const createTargets = ({ transaction, account }: CreateCombineTargetsParams): Target[] => {
    const { targets, tokens, internalTransfers } = transaction;

    return [
        ...targets.map(createSimpleTarget),
        ...filteredInternalTransfers(internalTransfers, account).map(createInternalTarget),
        ...tokens.filter(token => token.type !== 'self').map(createTokenTarget),
    ];
};
```

## After

```tsx
const EMPTY_TARGETS: Target[] = [];

export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        isActionDisabled,
        isPending,
        network,
        accountType,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);

        const account = useSelector(selectSelectedAccount) || null;

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type } = transaction;

        const allOutputs = useMemo(
            () => (account !== null ? createTargets({ transaction, account }) : EMPTY_TARGETS),
            [account, transaction],
        );
```

## Why it matters

`TransactionItem` is rendered once per transaction row in a list that can be long-running. It's `memo()`-wrapped against unchanged props from its parent, but that doesn't help here: it still re-renders on its own `useSelector` subscriptions (`selectSelectedAccount`, `selectAccountByKey`, `selectIsPhishingTransaction`), and each of those redoes all three `.map()`/`.filter()` passes inside `createTargets` from scratch even though the transaction itself hasn't changed. Cost scales with `targets.length + internalTransfers.length + tokens.length` — small for a plain transfer, larger for coinjoin rounds or batch sends (this same directory has a dedicated `CoinjoinBatchItem.tsx` for that case).

## Notes

- Compile requirement: add `useMemo` to the existing `import { memo } from 'react';`, and add `type Target` to the existing `@suite-common/wallet-core` import in this file (it already pulls in `createTargets`, `selectAccountByKey`, `selectIsPhishingTransaction`, `useDisplayBaseCurrency` from the same package). `Target` is exported from that package's barrel too — confirmed via the sibling consumer `TransactionTargetsList.tsx:1`, `import { type Target } from '@suite-common/wallet-core';`.
- `EMPTY_TARGETS` is a module-level constant, not an inline `: []`, so the `account === null` branch doesn't itself produce a fresh reference on every render.
- Honest sizing: confidence is medium-high, not high — the per-call cost is small for a typical 1-3-target transfer and wasn't measured for coinjoin/batch cases; this is proposed on the shape of the defect (unconditional recompute of derived data on a per-row, self-re-rendering component), not a measured number.
- Adjacent, same component tree, not part of this fix: `TransactionTarget.tsx`'s `outputLabel` lookup has the identical one-line unmemoized-render-body shape one level down (a `.find()` over `suiteSyncOutputLabels` in the render body); tracked separately in sibling draft `p3-01-cleanups-suite-hooks-and-components.md` (not yet filed).

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
