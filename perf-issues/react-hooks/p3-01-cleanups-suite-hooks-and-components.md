Extracted from the `skills/performance-react-hooks/SKILL.md` audit — ten small, independent cleanups across `packages/suite/src/hooks/{wallet,earn}` and `packages/suite/src/components/{suite,wallet}`. Each is low-severity and self-contained; batched into one issue because none justifies its own PR. Found by sweep, not named in the doc.

### `useSendForm.ts`: "handle draft change" effect can never fire

**Where:** [`packages/suite/src/hooks/wallet/useSendForm.ts:409-416`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendForm.ts#L409-L416), contrasted with the only writer of `draft.current` at [lines 376-401](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendForm.ts#L376-L401).

**Before:**

```tsx
useEffect(() => {
    const loadDraftValues = async () => {
        const storedState = await dispatch(getSendFormDraftThunk()).unwrap();
        // ...
        if (storedState) {
            draft.current = storedState;
            composeDraft(storedState); // already called directly here
        }
    };
    // ...
}, [dispatch, getLoadedValues, findNetworkSymbolForProtocol, reset]);

// handle draft change
useEffect(() => {
    if (!draft.current) return;
    composeDraft(draft.current);
    draft.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [draft]);
```

**After:** `useRef()`'s return value is the same object every render, so `[draft]` behaves like `[]` — this effect runs once, immediately after mount, before the async `loadDraftValues` above can ever set `draft.current`. It is dead code today. Delete it:

```tsx
// deleted — the direct composeDraft(storedState) call above, plus the feeInfo-driven
// effect two lines below (useEffect(() => composeDraft(getValues()), [composeDraft, getValues])),
// already cover recomposing once a fresher composeDraft is available
```

### `useExchangeDexQuote.ts`: `fromAddress` effect keyed on the whole `account` object

**Where:** [`packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts:80-88`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts#L80-L88).

**Before:**

```tsx
useEffect(() => {
    if (!account) {
        return;
    }
    const fromAddress = isAccountBasedNetwork(account.symbol) ? account.descriptor : undefined;
    setValue('fromAddress', fromAddress);
}, [account, setValue]);
```

**After:**

```tsx
}, [account?.symbol, account?.descriptor, setValue]);
```

Both fields read in the body are already primitives. The same hook already uses `useCurrentRef` twice elsewhere (`accountRef`, `fetchFeesAndComposeRef` at line 130) to avoid this exact shape for its fee-fetch effect — this is the one place that didn't get the same treatment.

### Earn/staking form family (`useStakeForm.ts`, `useWithdrawalForm.ts`, `useClaimForm.ts`, `useChangeDelegateForm.ts`, `useRbfForm.ts`): `defaultValues`/`state` memoized on the whole `account` prop

**Where:** [`useStakeForm.ts:66-76`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useStakeForm.ts#L66-L76) + [`:81-93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useStakeForm.ts#L81-L93), [`useWithdrawalForm.ts:86-96`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useWithdrawalForm.ts#L86-L96) + [`:104-112`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useWithdrawalForm.ts#L104-L112), [`useClaimForm.ts:35-44`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useClaimForm.ts#L35-L44) + [`:46-58`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/earn/useClaimForm.ts#L46-L58), [`useChangeDelegateForm.ts:48-57`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useChangeDelegateForm.ts#L48-L57) + [`:59-68`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useChangeDelegateForm.ts#L59-L68), [`useRbfForm.ts:183-277`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useRbfForm.ts#L183-L277) (`useRbfState`'s single larger `useMemo`, folding the same idea plus more).

**Before** (`useStakeForm.ts`; the other three form hooks are structurally identical):

```tsx
const defaultValues = useMemo(() => {
    const stakingContractAddress = getStakingContractAddress(account, 'stake');

    return {
        ...getStakeFormsDefaultValues({ address: stakingContractAddress, stakeType: 'stake' }),
        setMaxOutputId: undefined,
    } as StakeFormState;
}, [account]);

const state = useMemo(() => {
    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: networkFees,
    });

    return { account, network, feeInfo, formValues: defaultValues };
}, [account, defaultValues, networkFees, network]);
```

**After:**

```tsx
}, [account.descriptor, account.symbol, account.networkType]);
```

`getStakingContractAddress` only switches on `account.networkType` and reads `account.symbol`/`account.descriptor` (verified in `suite-common/staking/src/staking.ts:24-34`); `getStakeFormsDefaultValues` takes no account fields at all. So `defaultValues` narrows safely in all four form hooks (`useWithdrawalForm.ts` additionally keeps its existing `autocompoundBalance` dependency). `state`'s own memo returns the live `account` object verbatim, so — unlike `defaultValues` — its array can't be narrowed away from `account` without freezing `state.account` stale; leave `state` as-is. `useRbfForm.ts`'s single combined memo builds a derived `rbfAccount` genuinely reading `utxo`/`addresses`/`balance`/`accountType` off the live object, so the same fix doesn't apply there either — no concrete change proposed for that file.

### `useGlobalSendReceiveModal`: stores router-derived state instead of deriving it in render

**Where:** [`packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/hooks/useGlobalSendReceiveModal.ts:44-49`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/hooks/useGlobalSendReceiveModal.ts#L44-L49).

**Before:**

```tsx
const routerParams = useSelector(selectRouterParams);
const [activeModal, setActiveModal] = useState<GlobalSendReceiveType>(null);

useEffect(() => {
    setActiveModal(getDashboardParamModal(routerParams));
}, [routerParams]);
```

**After:**

```tsx
export function useGlobalSendReceiveModal() {
    const dispatch = useDispatch();
    const goToWithAnalytics = useGoToWithAnalytics();
    const routerParams = useSelector(selectRouterParams);
    const activeModal = getDashboardParamModal(routerParams);

    const openModal = (modal: NonNullable<GlobalSendReceiveType>) => {
        dispatch(goto({ routeName: 'suite-index', params: { modal } }));
    };

    const closeModal = (routeName?: Route['name'], account?: Account) => {
        if (routeName && account) {
            goToWithAnalytics({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            });
        } else {
            dispatch(goto({ routeName: 'suite-index' }));
        }
    };

    return { activeModal, openModal, closeModal };
}
```

`getDashboardParamModal` is a pure, cheap parse of the already-available `routerParams`, so no `useState`/`useEffect` is needed; this also drops the two now-redundant `setActiveModal(...)` calls from `openModal`/`closeModal`.

### `TransactionReviewOutputList`: re-scans the whole accounts list in its render body

**Where:** [`packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx#L81), [`:117-120`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx#L117-L120).

**Before:**

```tsx
const accounts = useSelector(state => state.wallet.accounts);
// ...
const isInternalTransfer =
    isFirstOutputAddress &&
    typeof outputs[0]?.value === 'string' &&
    findAccountsByAddress(symbol, outputs[0]?.value, accounts).length > 0;
```

**After:**

```tsx
const isInternalTransfer = useMemo(
    () =>
        isFirstOutputAddress &&
        typeof outputs[0]?.value === 'string' &&
        findAccountsByAddress(symbol, outputs[0]?.value, accounts).length > 0,
    [isFirstOutputAddress, outputs, symbol, accounts],
);
```

### `AddCoinjoinAccountButton`: filters the full accounts list on every render

**Where:** [`packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx#L58), [`:65-70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx#L65-L70).

**Before:**

```tsx
const accounts = useSelector(state => state.wallet.accounts);
// ...
if (!device) {
    return null;
}

const coinjoinAccounts = accounts.filter(
    a =>
        a.deviceState === device?.state?.staticSessionId &&
        a.symbol === network.symbol &&
        a.accountType === selectedAccount.accountType,
);
```

**After:**

```tsx
const coinjoinAccounts = useMemo(
    () =>
        accounts.filter(
            a =>
                a.deviceState === device?.state?.staticSessionId &&
                a.symbol === network.symbol &&
                a.accountType === selectedAccount.accountType,
        ),
    [accounts, device?.state?.staticSessionId, network.symbol, selectedAccount.accountType],
);

if (!device) {
    return null;
}
```

The `useMemo` has to move above the existing `if (!device) return null` guard — hooks can't follow a conditional return; `device?.state?.staticSessionId` stays optional-chained so this is safe before the null check.

### `CoinProtocolRenderer`: chains `.filter()` onto a `useSelector` result, discarding the selector's own memoization

**Where:** [`packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx:45-47`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx#L45-L47).

**Before:**

```tsx
const networkAccounts = useSelector(state =>
    selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
).filter(a => new BigNumber(a.balance).gt(0));
```

**After:**

```tsx
const networkAccounts = useSelector(state =>
    selectDeviceAccountsByNetworkSymbol(state, networkSymbol).filter(a =>
        new BigNumber(a.balance).gt(0),
    ),
);
```

Moves the filter inside the selector callback so it runs against the selector's own result in one pass instead of chaining a fresh `.filter()` after every `useSelector` re-check.

### `CustomFeeTron.tsx`: mount-only effect can miss the async `estimatedFeeLimit`

**Where:** [`packages/suite/src/components/wallet/Fees/CollapsibleFees/CustomFee/CustomFeeTron.tsx:23-30`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/Fees/CollapsibleFees/CustomFee/CustomFeeTron.tsx#L23-L30).

**Before:**

```tsx
const estimatedFeeLimit = getValues('estimatedFeeLimit');

useEffect(() => {
    if (getValues(FEE_LIMIT) === '' && estimatedFeeLimit) {
        setValue(FEE_LIMIT, estimatedFeeLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**After:**

```tsx
useEffect(() => {
    if (getValues(FEE_LIMIT) === '' && estimatedFeeLimit) {
        setValue(FEE_LIMIT, estimatedFeeLimit);
    }
}, [estimatedFeeLimit, getValues, setValue]);
```

Drop the disable comment; the field's own emptiness check already prevents clobbering a value the user typed, so no extra re-entry guard is needed. Sibling `CustomFeeEthereum.tsx` avoids this class of bug entirely by only reading `getValues('estimatedFeeLimit')` inside `onClick` handlers, never in a mount effect.

### `TargetAddressLabel`: feeds a fresh `[]` into a `createWeakMapSelector`, defeating its cache

**Where:** [`packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:28-34`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx#L28-L34) (+ [`suite/address/src/labels/selectAddressLabelsForAccount.ts:47-50`](https://github.com/trezor/trezor-suite/blob/develop/suite/address/src/labels/selectAddressLabelsForAccount.ts#L47-L50), the weak-map-memoized selector's `addresses` passthrough input).

**Before:**

```tsx
const addressLabels = useSelector(state =>
    selectAddressLabelsForAccount(state, {
        addresses: target.addresses ?? [],
        accountKey,
        deviceStaticId: deviceStaticSessionId,
    }),
);
```

**After:**

```tsx
const EMPTY_ADDRESSES: string[] = [];
// ...
const addressLabels = useSelector(state =>
    selectAddressLabelsForAccount(state, {
        addresses: target.addresses ?? EMPTY_ADDRESSES,
        accountKey,
        deviceStaticId: deviceStaticSessionId,
    }),
);
```

Restores the weak-map cache hit for every target lacking a resolved address — same shape as the skill's own `useAccounts.ts` worked example.

### `TransactionTarget`: linear-scans the account's full Suite-Sync output-label list, unmemoized

**Where:** [`packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx:79-83`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx#L79-L83), [`:193-195`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx#L193-L195).

**Before:**

```tsx
const suiteSyncOutputLabels = useSelector(state =>
    isSuiteSyncEnabled
        ? selectSuiteSyncOutputLabels(state, transaction.deviceState)
        : returnStableArrayIfEmpty<SuiteSyncOutput>(),
);
// ...
const outputLabel =
    suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)
        ?.label ?? (isLegacyLabelingVisible ? targetMetadata : undefined);
```

**After:**

```tsx
const matchedOutputLabel = useMemo(
    () =>
        suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)
            ?.label,
    [suiteSyncOutputLabels, transaction.txid, targetId],
);
const outputLabel = matchedOutputLabel ?? (isLegacyLabelingVisible ? targetMetadata : undefined);
```

Matches the file's own pattern — `amount`/`amountComponent`/`fiatAmountComponent`/`label` a few lines above are already carefully `useMemo`'d with narrow deps; this is the one line that fell through.

## Why it matters

None of these ten sit on a hot, continuously-firing path — that's why all are P3 rather than individually filed:

1. **`useSendForm.ts`** — dead code today, not a runtime cost; the `eslint-disable` masks the missing-dependency warning that would have caught it at review time.
2. **`useExchangeDexQuote.ts`** — every account-reference churn (any balance/tx update) while the DEX exchange path is active re-runs a cheap `setValue` call with an almost-always-identical value.
3. **Earn/staking form family** — every account-reference churn while a stake/withdraw/claim/delegate/RBF form is open re-derives `defaultValues` and reallocates `state`; each hook's compose sub-hook already gates its actual dispatch behind a primitive `feeInfo.blockHeight` comparison, so this is wasted recomputation, not a request loop.
4. **`useGlobalSendReceiveModal`** — every navigation currently costs an extra render cycle (state set in an effect, not the triggering render) and a one-frame window where the open/closed state of the global Send/Receive modal can disagree with the URL.
5. **`TransactionReviewOutputList`** — re-scans the full accounts list on every render of the review modal (a handful of times per sign flow); cold, but the same unmemoized-scan shape as the three findings below.
6. **`AddCoinjoinAccountButton`** — re-filters the full accounts list on every re-render of the button (driven by its own `isLoading` state), despite being a single button instance, not a per-row list.
7. **`CoinProtocolRenderer`** — the chained `.filter()` reruns on every unrelated store dispatch that changes any of this toast's ~4 other selector values, discarding the selector's own memoization.
8. **`CustomFeeTron.tsx`** — if `estimatedFeeLimit` resolves after this panel mounts (it's written later by async compose thunks), the fee-limit field is never autofilled with the recommended value for the rest of the session.
9. **`TargetAddressLabel`** — react-redux re-invokes every `useSelector` callback on every store dispatch, so this recomputes the labeling combiner far more often than the underlying data changes, for every transaction target lacking a resolved address; pure waste absorbed by `packages/suite`'s `shallowEqual` wrapper rather than a visible re-render.
10. **`TransactionTarget`** — re-scans the account's full Suite-Sync output-label list on every render, including every time a sibling row's label enters or exits edit mode (the global `selectLabelingValueBeingEdited` flag re-renders every mounted target row at once).

## Notes

- All ten sites are in `packages/suite`, which is **not** React-Compiler-covered — every fix above is a manual `useMemo`/dependency-array change, not something a compiler would otherwise absorb.
- Compile requirements: add `useMemo` to the existing `'react'` import in `TransactionReviewOutputList.tsx` (currently `import { useEffect, useRef } from 'react';`) and in `AddCoinjoinAccountButton.tsx` (currently `import { useState } from 'react';`); `TransactionTarget.tsx` already imports `useMemo`. `useGlobalSendReceiveModal.ts`'s `import { useEffect, useState } from 'react';` becomes entirely unused after the fix and should be deleted (verified: neither hook is used anywhere else in the file). `TargetAddressLabel.tsx` needs a new module-level `EMPTY_ADDRESSES: string[] = []` constant, no import change. The remaining findings (`useSendForm.ts`, `useExchangeDexQuote.ts`, the earn/staking family, `CustomFeeTron.tsx`, `CoinProtocolRenderer.tsx`) need no import changes.
- `useSendForm.ts`: deleting the effect also leaves `draft.current = storedState` (line 384) and the `draft` ref declaration itself (line 110) with no remaining reader anywhere in the file (confirmed by grepping every `draft` occurrence) — remove those two in the same change rather than leaving an unread write behind.
- `useGlobalSendReceiveModal.ts`: `goto` is a `createThunk` (`suite/router/src/routerThunks.ts:84-114`) whose body dispatches `onLocationChange` synchronously with no `await` beforehand, so `routerParams` updates in the same tick as the `dispatch(goto(...))` call — confirmed removing the optimistic `setActiveModal` calls does not introduce a visible open/close lag.
- F-02-14 (`TransactionRenderer.tsx`, same scan batch) is intentionally **not** included here — see the standalone note at the end of this doc.

### Excluded finding: `TransactionRenderer.tsx` (F-02-14)

The scan's F-02-14 flagged `packages/suite/src/components/suite/notifications/NotificationRenderer/TransactionRenderer.tsx:37-38,46-47,52-54` for the same class of defect as this doc (unmemoized `findAccountsByNetwork`/`findAccountsByDescriptor`/`getAccountTransactions`/`findTransaction` lookups re-run every render), with a proposed fix of wrapping the lookup chain in a `useMemo` keyed on `[symbol, descriptor, txid, accounts, transactions]`.

`perf-issues/asymptotic-complexity/p2-16-transactionrendererx-transactionrenderer.md` already drafts a fix for the exact same lines: replace the scanning lookups entirely with the memoized keyed selectors `selectAccountByKey`/`selectTransactionByAccountKeyAndTxid`, consumed directly via `useSelector`. That rewrite doesn't just fix the O(n) scan — it also eliminates the render-body re-derivation this finding describes, since a `useSelector`-backed weak-map selector only produces a new reference when the underlying entity actually changes, which is strictly better than memoizing the old scan on `[accounts, transactions]` (both of which are whole-store arrays that change reference on any unrelated account/transaction update, so that `useMemo` would rarely have hit anyway). Proposing a `useMemo` around code that the sibling doc replaces outright would just create a merge conflict with no independent benefit, so F-02-14 is dropped from this batch with nothing additive left to add.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
