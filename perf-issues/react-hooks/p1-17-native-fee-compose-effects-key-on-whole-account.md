Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted memo from a render loop"_ (the "silent and unbounded" class). Found by sweep, not named in the doc.

## Where

1. **Yield deposit/withdraw/approval fee-and-allowance chain** — `useResolvedYieldFlowData`'s root memo plus four downstream consumers, all in `suite-native/module-earn/src/hooks/`:
    - [`useResolvedYieldFlowData.ts:240-249`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useResolvedYieldFlowData.ts#L240-L249) — root memo (context; not itself changed, see Notes)
    - [`useYieldApprovalFees.ts:26-57`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldApprovalFees.ts#L26-L57) — consumer 1 (`approvalTransaction` memo)
    - [`useYieldAllowanceFees.ts:95-106`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldAllowanceFees.ts#L95-L106) + [`:174-177`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldAllowanceFees.ts#L174-L177) — consumer 2 (`composeAllowanceFeeParams` memo + the debounce effect that dispatches from it)
    - [`useYieldDepositFees.ts:40-72`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldDepositFees.ts#L40-L72) — consumer 3 (`composeTransaction` callback), feeding the shared debounced compose effect at [`usePreparedTxFees.ts:296-325`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/usePreparedTxFees.ts#L296-L325)
    - [`useRefreshYieldDepositAllowanceOnIdle.ts:13-33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useRefreshYieldDepositAllowanceOnIdle.ts#L13-L33) — consumer 4, the clearest case (whole hook)
2. **Native send form — network fee-info effect** — [`useSendForm.tsx:335-337`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/hooks/useSendForm.tsx#L335-L337)
3. **Native send form — debounced fee-composition effect** — [`useSendForm.tsx:264-276`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/hooks/useSendForm.tsx#L264-L276) (`updateFormState`'s `account` dependency, listed at line 269) feeding [`useSendForm.tsx:319-321`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/hooks/useSendForm.tsx#L319-L321)
4. **Earn/staking fee composition (`useComposeEarnFees`)** — [`useComposeEarnFees.ts:120-199`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useComposeEarnFees.ts#L120-L199)
5. **EVM approval fee composition (`useEvmApprovalFees`)** — [`useEvmApprovalFees.ts:102-112`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/exchange/Approval/useEvmApprovalFees.ts#L102-L112)

## Before

### 1. Yield deposit/withdraw/approval chain

#### Root memo (context — not part of the fix)

```tsx
// useResolvedYieldFlowData.ts:240-249
const resolvedFlowData = useMemo(
    () =>
        resolveYieldFlowData({
            account,
            tokenContract,
            yieldId,
            yieldOpportunities: yieldOpportunities ?? emptyYieldOpportunities,
        }),
    [account, tokenContract, yieldId, yieldOpportunities],
);
```

`resolveYieldFlowData` builds `flowData.token`/`flowData.receiptToken` as **new object literals** on every call, so any blockchain-driven update to `account` (balance tick, new tx, discovery) produces a fresh `resolvedFlowData`/`flowData` here, even when the fields a given consumer actually reads haven't changed. This memo's own dependency on `account` is correct — its output embeds `account.symbol` and token balances read from it — so it is not part of the proposed fix below; the four consumers are.

#### Consumer 1 — `useYieldApprovalFees.ts:26-57`

```tsx
const approvalTransaction = useMemo<YieldAllowanceFeeTransaction | null>(() => {
    if (!amount || !flowData) {
        return null;
    }
    const allowanceAmount = getYieldApprovalAllowanceAmount({
        amount,
        approvalLimitType,
        tokenContract,
        tokenDecimals: flowData.token.decimals,
        tokenSymbol: flowData.token.symbol,
    });
    const contractAddress = getApprovalContractAddress({ flowType: 'deposit', flowData });
    const spender = flowData.vault.outputToken?.address;
    // ...
}, [amount, approvalLimitType, flowData, tokenContract]);
```

#### Consumer 2 — `useYieldAllowanceFees.ts:95-106,174-177`

```tsx
const composeAllowanceFeeParams = useMemo((): ComposeAllowanceFeeParams | null => {
    if (!isEnabled || !flowData || !formDraftKey || !feeInfo || !transaction) {
        return null;
    }
    return { feeInfo, flowData, formDraftKey, transaction };
}, [feeInfo, flowData, formDraftKey, isEnabled, transaction]);

// :174-177 — fires the real dispatch (composeAllowanceFee -> composeAllowanceTransactionThunk)
useEffect(() => {
    setIsComposingAllowanceFee(composeAllowanceFeeParams !== null);
    debounce(composeAllowanceFee);
}, [composeAllowanceFee, composeAllowanceFeeParams, debounce]);
```

#### Consumer 3 — `useYieldDepositFees.ts:40-72`

```tsx
const composeTransaction = useCallback(
    async (composeAmount: string): Promise<ComposeTxResult<ComposedDepositTransaction>> => {
        if (!flowData) {
            return { type: 'error', isFeeEstimationError: false };
        }
        const result = await dispatch(
            composeYieldDepositTransactionThunk({ amount: composeAmount, flowData }),
        ).unwrap();
        // ...
    },
    [dispatch, flowData],
);
```

#### Consumer 4 (clearest case) — `useRefreshYieldDepositAllowanceOnIdle.ts` (whole hook)

```tsx
export const useRefreshYieldDepositAllowanceOnIdle = ({
    allowanceStatus,
    resolvedFlowData,
}: UseRefreshYieldDepositAllowanceOnIdleParams) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (resolvedFlowData.resolutionStatus !== 'resolved' || allowanceStatus !== 'idle') {
            return;
        }

        void dispatch(
            initYieldAllowanceThunk({
                flowData: resolvedFlowData.flowData,
                flowKey: resolvedFlowData.flowKey,
                flowType: 'deposit',
                shouldSkipApprovalStep: false,
            }),
        );
    }, [allowanceStatus, dispatch, resolvedFlowData]);
};
```

The effect body doesn't need the vault/token display fields `resolvedFlowData` drags along — it only ever reads `.resolutionStatus`, `.flowData`, `.flowKey`.

### 2. Native send form — network fee-info effect

```tsx
// useSendForm.tsx:334-337
// TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
useEffect(() => {
    if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
}, [account, dispatch]);
```

This is the skill's own canonical bad example, almost verbatim: `account` is the full Redux object, but the callback only ever reads `account.symbol`.

### 3. Native send form — debounced fee-composition effect

```tsx
// useSendForm.tsx:203-276 (updateFormState) — account is read as a value AND listed as a dep
const updateFormState = useCallback(async () => {
    if (account && network && networkFeeInfo) {
        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft({
                    formValues: getValues(),
                    tokenContract,
                    selectedUtxos,
                }),
                composeContext: { account, network, feeInfo: networkFeeInfo, excludedUtxos },
            }),
        );
        // ...
    }
}, [
    accountKey,
    dispatch,
    getValues,
    tokenContract,
    account,
    network,
    networkFeeInfo,
    setError,
    excludedUtxos,
    selectedUtxos,
    trigger,
]);

// :319-321 — re-arms on every identity change of updateFormState
useEffect(() => {
    debounce(updateFormState);
}, [updateFormState, watchedFormValues, debounce, selectedUtxos, isNetworkReserveEnabled]);
```

### 4. Earn/staking fee composition (`useComposeEarnFees`)

```tsx
// useComposeEarnFees.ts:120-191 (composeFeeLevels) — account read directly, listed at line 190
const composeFeeLevels = useCallback(
    async (requestId: number) => {
        if (!formState || !account || !feeInfo) {
            /* ... */
        }
        const response =
            account.networkType === 'solana'
                ? await dispatch(composeSolanaStakingTransactionFeeLevelsNativeThunk({/* ... */}))
                : await dispatch(
                      composeSendFormTransactionFeeLevelsThunk({
                          formState: mergedFormState,
                          composeContext: { account, feeInfo, network: getNetwork(account.symbol) },
                      }),
                  );
        // ...
    },
    [dispatch, formState, account, feeInfo, saveDraft, accountKey, formDraftPrefix],
);

// :193-199
useEffect(() => {
    if (!isFocused) return;
    // ...
    debounce(() => composeFeeLevels(requestId));
}, [isFocused, account, debounce, composeFeeLevels, feeInfo, formState]);
```

### 5. EVM approval fee composition (`useEvmApprovalFees`)

```tsx
// useEvmApprovalFees.ts:102-112
useEffect(() => {
    composeFeesRef.current();
}, [
    quote?.dexTx?.data,
    quote?.approvalType,
    account,
    feeInfo,
    selectedFeeLevel,
    customFee,
    approvalTypeOverride,
]);
```

This file already uses the ref-read pattern for `composeFees` itself (`composeFeesRef.current = composeFees;`, line 100), but it still lists the whole `account` object directly in the _triggering_ effect's own dependency array — the ref indirection doesn't help here because the effect re-runs (and calls `composeFeesRef.current()`) whenever `account` changes reference, regardless of the ref.

## After

### 1. Yield deposit/withdraw/approval chain

#### Consumer 1 — narrow to the primitives actually read (not a ref-read candidate)

```tsx
const approvalTransaction = useMemo<YieldAllowanceFeeTransaction | null>(() => {
    if (!amount || !flowData) {
        return null;
    }
    // ...body unchanged: still reads flowData.token.decimals/.symbol/.contractAddress and
    // flowData.vault.outputToken?.address...
}, [
    amount,
    approvalLimitType,
    flowData?.token.decimals,
    flowData?.token.symbol,
    flowData?.token.contractAddress,
    flowData?.vault.outputToken?.address,
    tokenContract,
]);
```

#### Consumer 2 — ref-read `flowData`/`feeInfo`

```tsx
const flowDataRef = useFreshRef(flowData);
const feeInfoRef = useFreshRef(feeInfo);

const composeAllowanceFeeParams = useMemo((): ComposeAllowanceFeeParams | null => {
    const currentFlowData = flowDataRef.current;
    const currentFeeInfo = feeInfoRef.current;

    if (!isEnabled || !currentFlowData || !formDraftKey || !currentFeeInfo || !transaction) {
        return null;
    }

    return { feeInfo: currentFeeInfo, flowData: currentFlowData, formDraftKey, transaction };
}, [flowDataRef, feeInfoRef, formDraftKey, isEnabled, transaction]);
```

The effect at `:174-177` is unchanged — it already only depends on `composeAllowanceFeeParams`/`composeAllowanceFee`/`debounce`, so stabilizing the memo's identity is what stops it from re-triggering on background account churn.

#### Consumer 3 — ref-read `flowData`

```tsx
const flowDataRef = useFreshRef(flowData);

const composeTransaction = useCallback(
    async (composeAmount: string): Promise<ComposeTxResult<ComposedDepositTransaction>> => {
        const currentFlowData = flowDataRef.current;

        if (!currentFlowData) {
            return { type: 'error', isFeeEstimationError: false };
        }
        const result = await dispatch(
            composeYieldDepositTransactionThunk({
                amount: composeAmount,
                flowData: currentFlowData,
            }),
        ).unwrap();
        // ... (remaining `flowData.*` reads become `currentFlowData.*`)
    },
    [dispatch, flowDataRef],
);
```

`composeTransaction` now only changes identity when `dispatch` does (never, in practice), which stabilizes the shared debounced compose effect in `usePreparedTxFees.ts:296-325` that consumes it — no separate change needed there.

#### Consumer 4 — ref-read `resolvedFlowData` (full hunk)

```tsx
export const useRefreshYieldDepositAllowanceOnIdle = ({
    allowanceStatus,
    resolvedFlowData,
}: UseRefreshYieldDepositAllowanceOnIdleParams) => {
    const dispatch = useDispatch();
    const resolvedFlowDataRef = useFreshRef(resolvedFlowData);

    useEffect(() => {
        const currentFlowData = resolvedFlowDataRef.current;

        if (currentFlowData.resolutionStatus !== 'resolved' || allowanceStatus !== 'idle') {
            return;
        }

        void dispatch(
            initYieldAllowanceThunk({
                flowData: currentFlowData.flowData,
                flowKey: currentFlowData.flowKey,
                flowType: 'deposit',
                shouldSkipApprovalStep: false,
            }),
        );
    }, [allowanceStatus, dispatch, resolvedFlowDataRef]);
};
```

### 2. Native send form — network fee-info effect

```tsx
useEffect(() => {
    if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
}, [account?.symbol, dispatch]);
```

### 3. Native send form — debounced fee-composition effect

```tsx
const accountRef = useFreshRef(account);

const updateFormState = useCallback(async () => {
    const currentAccount = accountRef.current;

    if (currentAccount && network && networkFeeInfo) {
        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft({
                    formValues: getValues(),
                    tokenContract,
                    selectedUtxos,
                }),
                composeContext: {
                    account: currentAccount,
                    network,
                    feeInfo: networkFeeInfo,
                    excludedUtxos,
                },
            }),
        );
        // ... (remaining `account.*` reads become `currentAccount.*`)
    }
}, [
    accountKey,
    accountRef,
    dispatch,
    getValues,
    tokenContract,
    network,
    networkFeeInfo,
    setError,
    excludedUtxos,
    selectedUtxos,
    trigger,
]);

// unchanged — already reacts correctly once updateFormState stops churning
useEffect(() => {
    debounce(updateFormState);
}, [updateFormState, watchedFormValues, debounce, selectedUtxos, isNetworkReserveEnabled]);
```

### 4. Earn/staking fee composition (`useComposeEarnFees`)

```tsx
const accountRef = useFreshRef(account);

const composeFeeLevels = useCallback(
    async (requestId: number) => {
        const currentAccount = accountRef.current;

        if (!formState || !currentAccount || !feeInfo) {
            /* ... */
        }
        const response =
            currentAccount.networkType === 'solana'
                ? await dispatch(composeSolanaStakingTransactionFeeLevelsNativeThunk({/* ... */}))
                : await dispatch(
                      composeSendFormTransactionFeeLevelsThunk({
                          formState: mergedFormState,
                          composeContext: {
                              account: currentAccount,
                              feeInfo,
                              network: getNetwork(currentAccount.symbol),
                          },
                      }),
                  );
        // ...
    },
    [accountRef, dispatch, formState, feeInfo, saveDraft, accountKey, formDraftPrefix],
);

useEffect(() => {
    if (!isFocused) return;
    // ...
    debounce(() => composeFeeLevels(requestId));
}, [isFocused, debounce, composeFeeLevels, feeInfo, formState]);
```

### 5. EVM approval fee composition (`useEvmApprovalFees`)

```tsx
useEffect(() => {
    composeFeesRef.current();
}, [
    quote?.dexTx?.data,
    quote?.approvalType,
    account?.key,
    account?.symbol,
    feeInfo,
    selectedFeeLevel,
    customFee,
    approvalTypeOverride,
]);
```

`composeFees` itself still closes over the full `account` via its own deps (line 91) and is read through `composeFeesRef`, so the actual compose call keeps getting the current account — only the _trigger_ needed narrowing.

## Why it matters

Every effect in this family dispatches a thunk that ultimately calls into `@trezor/connect`-backed fee estimation, transaction composition, or allowance building — `composeSendFormTransactionFeeLevelsThunk`, `composeYieldDepositTransactionThunk`, `composeAllowanceTransactionThunk`, `initYieldAllowanceThunk`, `composeEvmApprovalFeeLevelsThunk`, `composeSolanaStakingTransactionFeeLevelsNativeThunk`. `account` — and the `flowData`/`resolvedFlowData` wrapper built from it — gets a fresh reference on every blockchain-driven update (balance tick, new pending/confirmed transaction, discovery still running), which has nothing to do with what the user is doing on the send/deposit/withdraw/approval review screen currently open. As written, each of these five hooks re-triggers its own real compose or allowance dispatch on any such background update, not just when the user changes the amount or fee level. `useRefreshYieldDepositAllowanceOnIdle` is the sharpest case: it re-dispatches an on-chain allowance check every time `resolvedFlowData` gets a new identity while `allowanceStatus` happens to still read `'idle'`.

## Notes

- **In-repo fix template (strongest evidence):** [`useYieldWithdrawFees.ts:75-82`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldWithdrawFees.ts#L75-L82) documents and implements exactly this pattern for the same problem (`ComposeWithdrawFeeParams`'s comment: "the fee context ... is read from refs at compose time instead, so it can't re-trigger the effect"), with the ref assigned during render at [`:343-344`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldWithdrawFees.ts#L343-L344) and the real triggering effect narrowed to primitives/content-derived strings at [`:519-531`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldWithdrawFees.ts#L519-L531) (`amount`, `formDraftKey`, `feeInfoRevision`, `hasFeeInfo`, `isEnabled` — never `flowData` or `feeInfo` themselves).
- Second correct sibling in the same module: [`useYieldPendingTransactionTracking.ts:168-169`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts#L168-L169) destructures `accountKey`/`accountSymbol` from `account` immediately, before any effect, so its polling-interval effect at [`:227-237`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts#L227-L237) depends on primitives only (`[accountKey, dispatch, pollIntervalMs, shouldPollPendingTransaction]`).
- Third correct sibling, a different module: [`useComposeTradingTransaction.ts:60-93`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useComposeTradingTransaction.ts#L60-L93) (`module-trading`) reads `store.getState()` imperatively inside its callback instead of subscribing via `useSelector`, so it never depends on `account`/`draft` at all — its own `useCallback` deps (`[dispatch, store, tradeType, getNetworkFeeInfo]`) are stable regardless of account churn.
- Compile requirements: `useFreshRef` needs importing from `@trezor/react-utils` — extend the existing `useDebounce` import in `useYieldAllowanceFees.ts`, `useComposeEarnFees.ts`, and `useSendForm.tsx`; add a fresh import in `useYieldDepositFees.ts` and `useRefreshYieldDepositAllowanceOnIdle.ts`. `useEvmApprovalFees.ts` needs no new import — its fix is dependency-array-only.
- All five files are `suite-native`, compiled by React Compiler: per this repo's native rule, the fix is never "add `useMemo`/`useCallback`" — it's narrowing a dependency array to primitives, or reading the wide value through a ref populated during render, exactly as the three siblings above already do.
- `useYieldApprovalFees.ts`'s `approvalTransaction` memo is the one item in this family that is _not_ a ref-read candidate: unlike the other four, its return value is itself consumed downstream for display/composition (`allowanceAmount`, `contractAddress`, `spender`), so ref-reading `flowData` there would make the returned value stale instead of just delaying a dispatch. Its fix is a plain narrowing to the exact primitive fields the memo body reads — `flowData.token.decimals`/`.symbol`/`.contractAddress` (the last one read internally by `getApprovalContractAddress` for the hardcoded `'deposit'` flow type used here, confirmed at `suite-common/wallet-core/src/stablecoin-yield/thunks/stablecoinYieldApprovalThunks.ts:92-98`) and `flowData.vault.outputToken?.address` — per the skill's "Minimal required dependencies" guidance rather than the ref-read pattern.
- Honest sizing: `useResolvedYieldFlowData` is imported by roughly 20 files across `module-earn` (every yield deposit/withdraw/approval/complete screen), so the underlying account-tick churn is much wider than the four hooks fixed here — only these four were traced in this sweep to a confirmed live compose/allowance dispatch as the consequence.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
