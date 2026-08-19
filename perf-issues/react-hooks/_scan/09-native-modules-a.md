# Area 09 — suite-native/module-trading, module-earn, module-send

Scope: `suite-native/module-trading/**` (~631 files), `suite-native/module-earn/**` (~630 files),
`suite-native/module-send/**` (~130 files). All three are compiled by React Compiler
(`experiments.reactCompiler: true`), so no "missing useMemo/useCallback/memo" findings below —
every finding is a compiler bail-out, an unstable effect/memo dependency, an unstable selector
result, or a derived-state issue, per the native ground rules in `PROGRESS.md`.

**Headline pattern**: five independent hooks across all three modules key a fee/allowance
**composition effect** — the thing that calls `TrezorConnect`/dispatches a compose thunk — on the
_whole_ Redux `account` object instead of `accountKey`/`account?.symbol`. Since `account` gets a
fresh reference on every blockchain-driven update (balance tick, new tx, discovery), each of these
effects refires and re-dispatches its compose/allowance thunk any time the account changes for a
reason that has nothing to do with what the user is doing on screen. This is exactly the skill's
"silent and unbounded" class-2 example, found five times independently (send, earn/staking,
earn/yield deposit, earn/yield approval, trading/exchange EVM approval) — three of the five
authored well after the others sit right next to a **correct** sibling in the same package
(`useYieldWithdrawFees.ts`, `useYieldPendingTransactionTracking.ts`,
`useComposeTradingTransaction.ts`) that explicitly avoids the same trap, so the fix already has an
in-repo template.

No `react-hook-form` bare `.watch()` calls exist anywhere in this area (confirmed by grep across
all three modules) — every form-field read goes through `useWatch`/`useFormContext`, so class-6's
compiler bail-out does not apply here. `useQuery` is not called directly in any of these three
modules either (query hooks are consumed from `@suite-common/*`, out of this area's scope).

---

## F-09-1 — The yield deposit/withdraw/approval fee-and-allowance chain recomputes on every account update because `useResolvedYieldFlowData` keys its memo on the whole `account` object

- **Class:** 1 (unstable dependency crossing a hook boundary) driving class 2 (effect refetch) in
  four downstream consumers
- **Where:**
    - Root: `suite-native/module-earn/src/hooks/useResolvedYieldFlowData.ts:240-249` (the `resolvedFlowData` memo)
    - Consumer 1: `suite-native/module-earn/src/hooks/useYieldApprovalFees.ts:26-57` (`approvalTransaction` memo depends on `flowData`)
    - Consumer 2: `suite-native/module-earn/src/hooks/useYieldAllowanceFees.ts:95-106,174-177` (`composeAllowanceFeeParams` memo + the effect that debounces `composeAllowanceTransactionThunk`)
    - Consumer 3: `suite-native/module-earn/src/hooks/useYieldDepositFees.ts:40-72` (`composeTransaction` callback depends on `flowData`) feeding `suite-native/module-earn/src/hooks/usePreparedTxFees.ts:296-325` (the debounced compose effect that every yield-flow fee hook shares)
    - Consumer 4: `suite-native/module-earn/src/hooks/useRefreshYieldDepositAllowanceOnIdle.ts:19-32` (effect depends on the whole `resolvedFlowData`, dispatches `initYieldAllowanceThunk`)
    - `useResolvedYieldFlowData` is imported by 20 files (`grep -rl useResolvedYieldFlowData suite-native/module-earn/src` — every Yield deposit/withdraw/approval/complete screen plus the four hooks above), so any consumer that puts `flowData`/`resolvedFlowData` in an effect or memo dependency inherits this instability.
- **Trigger cadence:** every Redux update that touches the account backing the open yield flow (balance tick, new pending/confirmed tx, discovery) while any deposit/withdraw/approval screen is mounted — not just when the user changes the typed amount or the vault data actually changes
- **Severity guess:** P1 (hot: this is the entire stablecoin-yield deposit/withdraw/approval review path, and the effects it drives dispatch real compose/allowance thunks, one of which — `useRefreshYieldDepositAllowanceOnIdle` — literally calls `TrezorConnect`-backed allowance-check logic)
- **Confidence:** high for the root memo and the two direct consumers I traced fully
  (`useYieldApprovalFees`/`useYieldAllowanceFees`); medium for the `usePreparedTxFees` fan-out
  (verified the dependency chain, but did not instrument a real re-render count)

### Before (verbatim from the file)

`useResolvedYieldFlowData.ts:230-249` — the root memo takes the raw `useSelector` account, not a key:

```tsx
export const useResolvedYieldFlowData = ({
    accountKey,
    tokenContract,
    displayError = true,
    yieldId,
}: YieldFlowProps) => {
    const { data: yieldOpportunities } = useAllYieldOpportunities();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    ...
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

`resolveYieldFlowData` (same file, ~line 193) builds `flowData.token`/`flowData.receiptToken` as
**new object literals** every time it runs, so even the nested fields are fresh, not just the
top-level `flowData` wrapper.

`useYieldApprovalFees.ts:26-57` — the allowance-transaction memo recomputes on every account tick
even though it only reads vault/token metadata that doesn't change with the account's balance:

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
    ...
    return { allowanceAmount, modalState: { amount, contractAddress, spender, txType: 'approve' } };
}, [amount, approvalLimitType, flowData, tokenContract]);
```

`useYieldAllowanceFees.ts:95-106` and `:174-177` — `composeAllowanceFeeParams` depends on the same
`flowData`, and the effect that fires from it debounces straight into a dispatch:

```tsx
const composeAllowanceFeeParams = useMemo((): ComposeAllowanceFeeParams | null => {
    if (!isEnabled || !flowData || !formDraftKey || !feeInfo || !transaction) {
        return null;
    }
    return { feeInfo, flowData, formDraftKey, transaction };
}, [feeInfo, flowData, formDraftKey, isEnabled, transaction]);
...
useEffect(() => {
    setIsComposingAllowanceFee(composeAllowanceFeeParams !== null);
    debounce(composeAllowanceFee);
}, [composeAllowanceFee, composeAllowanceFeeParams, debounce]);
```

`useYieldDepositFees.ts:40-72` — `composeTransaction`'s identity changes with `flowData`, and it is
itself a dependency of the shared debounce-then-compose effect in `usePreparedTxFees.ts:296-325`:

```tsx
const composeTransaction = useCallback(
    async (composeAmount: string): Promise<ComposeTxResult<ComposedDepositTransaction>> => {
        if (!flowData) {
            return { type: 'error', isFeeEstimationError: false };
        }
        try {
            const result = await dispatch(
                composeYieldDepositTransactionThunk({ amount: composeAmount, flowData }),
            ).unwrap();
            ...
        } catch {
            return { type: 'error', isFeeEstimationError: false };
        }
    },
    [dispatch, flowData],
);
```

`useRefreshYieldDepositAllowanceOnIdle.ts` (whole hook) — the clearest case, the effect body doesn't
even need the vault/token display fields it drags along:

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

### The in-repo fix already exists as a sibling

`useYieldWithdrawFees.ts:75-77` documents and implements the correct pattern for the exact same
problem — narrow the effect's dependencies to only the inputs that should trigger a fresh compose,
and read everything else (including `flowData`) through a ref at call time:

```tsx
// Only the inputs that should trigger a fresh (network) fee composition. The fee context
// (feeInfo, selected/custom fee, flowData) is read from refs at compose time instead, so it can't
// re-trigger the effect — most importantly the fee draft that the compose itself writes.
type ComposeWithdrawFeeParams = {
    amount: string;
    flowType: YieldWithdrawFlowType;
    formDraftKey: string;
};
```

(`flowDataRef.current = flowData` is assigned during render at `useYieldWithdrawFees.ts:344`, then
read inside the async compose function — the `useFreshRef` shape.)

### Proposed fix

Apply the `useYieldWithdrawFees.ts` pattern to the other three hooks: keep `flowData` out of the
`useMemo`/`useCallback`/`useEffect` dependency arrays that only exist to trigger network work, and
read it through a `useRef`/`useFreshRef` at call time instead. Where the memoized _value_ really is
consumed for display (`useYieldApprovalFees`'s `allowanceAmount`/`contractAddress`/`spender`), narrow
the root cause instead: `useResolvedYieldFlowData`'s memo should not need to recompute the whole
`flowData` bundle (vault/APY/display fields) every time `account` ticks for reasons unrelated to the
token balance it actually reads — at minimum, split "vault/display resolution" (stable once loaded)
from "balance-dependent fields" (`token.balance`, `depositedSharesAmount`) so consumers that only need
the former aren't invalidated by every account update.

### Why it matters

Every one of these effects dispatches a thunk that talks to `@trezor/connect` (fee estimation,
allowance-transaction building, or an on-chain allowance read). While a user is reviewing a deposit,
withdrawal, or approval screen, any unrelated background account update (their own balance ticking,
a new incoming transaction, discovery still running) re-fires the relevant compose/allowance thunk —
work that should only happen when the user changes the amount or the fee level. `useRefreshYieldDepositAllowanceOnIdle` is the sharpest case: it re-dispatches an allowance check every time
`resolvedFlowData` gets a new identity while `allowanceStatus` happens to still read `'idle'`.

---

## F-09-2 — Native send form re-fetches network fee info on every account update, not just network-symbol changes

- **Class:** 2 (effect refetch keyed on an unstable — and here, unnecessarily wide — dependency)
- **Where:** `suite-native/module-send/src/hooks/useSendForm.tsx:335-337`
- **Trigger cadence:** every render where the `account` selector returns a new reference — i.e.
  every blockchain-driven update to the account being sent from (balance tick, new tx, discovery) —
  while the Send screen is open, not just when the account's network/symbol actually changes
- **Severity guess:** P1 (hot: this is the plain "send" screen, the single most common wallet action)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
// TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
useEffect(() => {
    if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
}, [account, dispatch]);
```

This is the skill's own canonical bad example, almost verbatim: `account` is the full Redux object,
but the callback only ever reads `account.symbol`.

### Proposed fix

```tsx
useEffect(() => {
    if (account) dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));
}, [account?.symbol, dispatch]);
```

### Why it matters

`account.symbol` essentially never changes for a mounted send-form instance, so this effect should
fire once. As written it re-dispatches `updateFeeInfoThunk` (a network fee-info fetch) on every
account update for the lifetime of the Send screen — e.g. while the user is composing a transaction
and their own balance/transaction list is still syncing in the background.

---

## F-09-3 — The same send form's debounced fee-composition effect refires on background account churn, not just on keystrokes or fee-level changes

- **Class:** 2 (effect refetch keyed on an unstable dependency chain)
- **Where:** `suite-native/module-send/src/hooks/useSendForm.tsx:203-276` (`updateFormState`
  callback, `account` at line 269) feeding the effect at `suite-native/module-send/src/hooks/useSendForm.tsx:319-321`
- **Trigger cadence:** every keystroke in the form (intended) **and** every time the selected
  account's reference changes for any other reason (not intended) — both are debounced together
  through the same 300 ms `useDebounce()` window (`packages/react-utils/src/hooks/useDebounce.ts`)
- **Severity guess:** P1 (hot: same send screen as F-09-2; the debounce narrows frequency but not
  occurrence, and because `useDebounce` cancels-and-restarts on every call, sustained background
  account churn can also delay a real keystroke-driven fee recompute rather than only duplicate it)
- **Confidence:** medium — I traced the dependency chain and confirmed `account` (whole object) is
  both a dep of `updateFormState` and, through it, of the debounced effect; I did not instrument how
  often `account`'s reference actually changes in a live session, so the real-world frequency is an
  estimate, not a measurement

### Before (verbatim from the file)

```tsx
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
        ...
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
...
// Triggered for every change of watchedFormValues.
useEffect(() => {
    debounce(updateFormState);
}, [updateFormState, watchedFormValues, debounce, selectedUtxos, isNetworkReserveEnabled]);
```

### Proposed fix

`composeSendFormTransactionFeeLevelsThunk`'s `composeContext.account` genuinely needs the full
account object (it's passed to the compose call, not just read for a field), so the honest fix is
the ref pattern from `useYieldWithdrawFees.ts`/`useEvmApprovalFees.ts` (read `account` through a ref
inside `updateFormState` instead of listing it as a `useCallback` dependency), so the callback's
_identity_ — and therefore the debounced effect above it — only changes when `watchedFormValues`,
`selectedUtxos`, or `isNetworkReserveEnabled` actually change.

### Why it matters

The comment on the file's other effect ("TODO: Fetch periodically... fee info is updated in the
background") shows the account is expected to update repeatedly while this screen is open. Each such
update currently re-arms the debounce for a full `composeSendFormTransactionFeeLevelsThunk` call —
the same UTXO-selection/fee-composition work the skill and `perf-issues/scheduling` already flag as
expensive — even when the user has typed nothing new.

---

## F-09-4 — Earn/staking fee composition (`useComposeEarnFees`) recomputes and re-dispatches on every account update

- **Class:** 2 (effect refetch keyed on an unstable dependency)
- **Where:** `suite-native/module-earn/src/hooks/useComposeEarnFees.ts:97-199`, specifically the
  effect at `:193-199`; `composeFeeLevels`'s own `account` dependency at `:190` widens the same effect
- **Trigger cadence:** every account update (balance/tx/discovery) while the earn deposit/stake
  fee-review step is open, in addition to the intended triggers (`formState` changes, focus changes)
- **Severity guess:** P1 (dispatches a real compose thunk — `composeSendFormTransactionFeeLevelsThunk`
  or `composeSolanaStakingTransactionFeeLevelsNativeThunk` — behind only a 300 ms debounce)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
const account = useSelector((state: AccountsRootState) =>
    selectAccountByKey(state, accountKey),
);
...
const composeFeeLevels = useCallback(
    async (requestId: number) => {
        if (!formState || !account || !feeInfo) { ... }
        setIsComposingFeeLevels(true);
        try {
            ...
            const response =
                account.networkType === 'solana'
                    ? await dispatch(composeSolanaStakingTransactionFeeLevelsNativeThunk({ ... }))
                    : await dispatch(
                          composeSendFormTransactionFeeLevelsThunk({
                              formState: mergedFormState,
                              composeContext: { account, feeInfo, network: getNetwork(account.symbol) },
                          }),
                      );
            ...
        } finally { ... }
    },
    [dispatch, formState, account, feeInfo, saveDraft, accountKey, formDraftPrefix],
);

useEffect(() => {
    if (!isFocused) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsComposingFeeLevels(!!formState && !!account && !!feeInfo);
    debounce(() => composeFeeLevels(requestId));
}, [isFocused, account, debounce, composeFeeLevels, feeInfo, formState]);
```

Also worth a one-line style note while in this file: `formDraftRef.current = formDraft;` is assigned
directly during render at line 95 — functionally identical to `useFreshRef(formDraft)`
(`packages/react-utils/src/hooks/useFreshRef.ts`), just reimplemented by hand (class 7, "manual
ref-assign-in-render pattern that should be one of the helpers"). Not a bug — `formDraftRef` is only
read later inside the async `composeFeeLevels`, so the render-time-assign semantics are exactly what's
wanted — just worth consolidating onto the shared helper for consistency with the rest of the file's
own imports (`@suite-native/react-utils` isn't even imported here for this purpose).

### Proposed fix

Same shape as F-09-1/F-09-2: `composeFeeLevels` needs `account` as a value (passed whole into the
compose thunk's `composeContext`), so keep reading it, but do so through a ref populated during
render, and drop `account` from both `composeFeeLevels`'s and the effect's dependency arrays. The
effect should key on `formState`, `isFocused`, and `feeInfo` only.

### Why it matters

This is the earn-module twin of F-09-3 — the deposit/stake review screen recomputes and redispatches
fee composition on background account churn instead of only on the inputs the user actually changed
(amount, fee level).

---

## F-09-5 — EVM approval fee composition re-runs on every account update, more directly than the others (whole `account` sits in the effect's own dependency array)

- **Class:** 2 (effect refetch keyed on an unstable dependency)
- **Where:** `suite-native/module-trading/src/hooks/exchange/Approval/useEvmApprovalFees.ts:102-112`
- **Trigger cadence:** every account update to the exchange's selected send account while the DEX
  approval/revoke review screen is open, in addition to the intended triggers (quote/fee-level
  changes)
- **Severity guess:** P1 (dispatches `composeEvmApprovalFeeLevelsThunk`, an actual approve/revoke
  transaction fee estimate, ahead of a swap that requires ERC20 allowance)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
const account = useSelector((state: AccountsRootState) =>
    selectAccountByKey(state, sendAccount?.key),
);
...
const composeFeesRef = useRef(composeFees);
composeFeesRef.current = composeFees;

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

This file already uses the ref-read pattern for `composeFees` itself (so the _callback_ isn't a
dependency), but it still lists the whole `account` object directly in the triggering effect's own
dependency array — the ref indirection doesn't help here because the effect re-runs (and calls
`composeFeesRef.current()`) whenever `account` changes reference, regardless of the ref.

### Proposed fix

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

(`composeFees` itself still closes over the full `account` via its own deps at line 91 and is read
through the ref, so the actual compose call keeps getting the current account — only the _trigger_
needs narrowing.)

### Why it matters

Same shape as F-09-1/F-09-4 one file over: the DEX-swap approval screen recomposes approval fees
(a real `@trezor/connect` fee-estimation round trip) on every background update to the account paying
for the swap, not just when the quote or fee level the user is looking at changes.

---

## F-09-6 — `ExchangeApprovalDetails`/`ExchangeRevokeDetails` re-run a no-op guard effect on every account update

- **Class:** 2 (effect refetch keyed on an unstable dependency — bounded-but-wasteful sub-case, not
  a request loop)
- **Where:** `suite-native/module-trading/src/components/exchange/Approval/ExchangeApprovalDetails.tsx:31-35`
  and `suite-native/module-trading/src/components/exchange/Approval/ExchangeRevokeDetails.tsx:24-28`
  (identical pattern in both files)
- **Trigger cadence:** every account update to the exchange's selected send account, on both the
  approval and revoke review screens
- **Severity guess:** P3 (the effect body is a cheap truthiness check with no dispatch/setState in
  the common case, so this is wasted re-invocation, not a storm)
- **Confidence:** high

### Before (verbatim from the file)

```tsx
const account = useSelector(selectExchangeSelectedSendAccount);
...
useEffect(() => {
    if (!account) {
        console.error('No account selected for exchange approval details');
    }
}, [account]);
```

(`ExchangeRevokeDetails.tsx` is byte-for-byte the same shape with a different message string.)

### Proposed fix

```tsx
useEffect(() => {
    if (!account) {
        console.error('No account selected for exchange approval details');
    }
}, [!!account]);
```

### Why it matters

Low value on its own — included because it's a clean, easy example of the same "whole object where a
primitive would do" habit as the other findings in this file, on a screen (`selectExchangeSelectedSendAccount`
is already a `createWeakMapSelector`-memoized value, so the object only changes when the account
itself actually does) where the fix is a one-character diff.

---

## F-09-7 — `useWatchTrade`'s analytics-tracking effect depends on `account` but never reads it

- **Class:** 6 / minimal-required-dependencies (an effect dependency wider than the closure actually
  needs — `account` isn't referenced in the effect body at all)
- **Where:** `suite-native/module-trading/src/hooks/general/useWatchTrade.ts:57-69`
- **Trigger cadence:** every account update to the account whose trade is being watched, on the
  trade-tracking/order-status screen (buy/sell/exchange order confirmation)
- **Severity guess:** P3 (cheap body — a ref comparison and a conditional analytics call — so this is
  cleanup, not a hot-path fix)
- **Confidence:** high — re-read the full effect body below; `account` genuinely does not appear
  inside it

### Before (verbatim from the file)

```tsx
const account = useSelector((state: AccountsRootState) =>
    selectAccountByKey(state, accountKey),
);
const trade = useSelector((state: TradingRootState) =>
    selectTradingTradeByOrderId(state, orderId),
);
...
useEffect(() => {
    const currentStatus = getTradeStatusStep(trade);
    if (currentStatus !== previousStatus.current) {
        previousStatus.current = currentStatus;

        if (trade && currentStatus) {
            analytics.report({
                type: events.tradingStatusEvent.name,
                payload: { type: trade.tradeType, status: currentStatus },
            });
        }
    }
}, [trade, account, previousStatus, analytics]);
```

The second effect in the same file (`:71-85`, the one that actually dispatches
`tradingThunks.watchTradeThunk`) legitimately needs `account` — I checked it separately and its
`(!hasRefreshed || shouldReload) && shouldRefresh` guard means `account` churn alone can't cause a
duplicate dispatch there, only a harmless extra re-run of the guard check, so I'm not filing that one.

### Proposed fix

Drop `account` (and the always-stable `previousStatus` ref) from this effect's dependency array —
only `trade` and `analytics` are read:

```tsx
}, [trade, analytics]);
```

### Why it matters

Minor on its own (the body is cheap), but it's a clean instance of "wider than the closure" with zero
ambiguity — worth fixing in the same pass as F-09-5 since it's three lines above in a sibling hook of
the same module.

---

## F-09-8 — Two "flow complete" summary screens memoize display rows against the whole `account`, needing only `.symbol`

- **Class:** 1 / minimal-required-dependencies (unstable-by-construction memo dependency)
- **Where:** `suite-native/module-earn/src/screens/YieldWithdrawCompleteScreen.tsx:117-167` and
  `suite-native/module-earn/src/components/WrappedNativeTokenCompleteContent.tsx:58-79`
- **Trigger cadence:** every account update while the post-transaction "complete" screen is mounted
  (which, per F-09-1's chain, includes the account-refresh that happens right after the just-signed
  transaction is picked up — so it recomputes at least once by design — plus any further update while
  the user is still looking at the summary)
- **Severity guess:** P3 (cold path — a one-time completion screen, not a review/edit loop; the
  recomputed work is string formatting, not a network call)
- **Confidence:** high that `account` is over-wide; medium on real-world impact since this screen is
  typically dismissed quickly

### Before (verbatim from the file)

`YieldWithdrawCompleteScreen.tsx:117-167` (only `account.symbol` is read, at lines 126/131/159):

```tsx
const rows = useMemo(() => {
    if (resolutionStatus !== 'resolved' || !session || !vault.outputToken) {
        return [];
    }
    ...
    const underlyingSymbol = hasUnwrappedOutput
        ? toTokenSymbol(getNetworkDisplaySymbol(account.symbol))
        : toTokenSymbol(vault.token.symbol);
    ...
    return getYieldWithdrawCompleteRows({
        accountSymbol: account.symbol,
        ...
    });
}, [CryptoAmountFormatter, account, isSharesInput, resolutionStatus, session, vault]);
```

`WrappedNativeTokenCompleteContent.tsx:58-79` (same shape, only `account.symbol` read at lines 73):

```tsx
const rows = useMemo(() => {
    if (!account || !wrappedNative) {
        return [];
    }
    ...
    return getWrappedNativeCompleteRows({
        accountSymbol: account.symbol,
        ...
    });
}, [CryptoAmountFormatter, account, amount, flowType, nativeSymbol, wrappedNative]);
```

### Proposed fix

Depend on `account?.symbol` in both memos (guarding the early-return with the same `!account` check
before the memo, or moving the null-check into the deps as `account?.symbol` plus a separate boolean).

### Why it matters

Low severity given the screen's lifetime, but grouped with F-09-1 because it's fed by the same
`useResolvedYieldFlowData`/`account` chain — narrowing the deps here is a one-line piece of the same
fix.

---

## F-09-9 — `eslint-disable react-hooks/exhaustive-deps` in native `useSendForm.tsx` (C1 candidate)

- **Class:** 6 (exhaustive-deps suppression)
- **Where:** `suite-native/module-send/src/hooks/useSendForm.tsx:291-316`
- **Trigger cadence:** once per mount of the send-form hook (by design)
- **Severity guess:** P3 (documented intent, plausibly correct given how this screen is navigated to)
- **Confidence:** medium — I could not find a bug this hides, but I also could not fully rule one out
  without live-testing the token/draft-switch navigation path; flagging per the brief's mandate to
  review every C1 site in-area

### Before (verbatim from the file)

```tsx
useEffect(() => {
    const prefillValuesFromStoredDraft = async () => {
        if (sendFormDraft?.outputs) {
            form.reset({
                ...getDefaultValues({
                    tokenContract,
                    isDestinationTagEnabled:
                        network?.networkType === 'ripple' || network?.networkType === 'stellar',
                }),
                ...sendFormDraft,
            });
            if (!tokenContract) await calculateNormalFeeMaxAmount();
            setTimeout(() => {
                trigger();
            }, 0);
        }
    };

    prefillValuesFromStoredDraft();
    // this effect should be triggered only for the first render to fill the form with the stored draft on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Why this is plausibly fine (and what would change my mind)

`useSendForm(accountKey, tokenContract)` takes `accountKey`/`tokenContract` as hook parameters, and
this screen is reached via navigation params rather than by the same hook instance being reused
across a different account/token — so a fresh mount per account/token is the expected shape, and
`sendFormDraft` is sourced from a non-persisted-on-native Redux slice (`wallet.send` is not in
`suite-native/state/src/reducers.ts`'s `persistedKeys: ['accounts', 'transactions']`), so there's no
redux-persist rehydration race to worry about either. What would change my mind: if
`SendStackRoutes.SendOutputs` is ever reachable via a param update on an _already-mounted_ screen
instance (e.g. switching the token for the same account without unmounting), this mount-only draft
prefill would silently skip the new token's stored draft.

### Proposed fix

If the navigation shape above is confirmed (fresh mount per account/token), leave as-is but replace
the blanket `eslint-disable` with the skill's suggested alternative — list the dependencies and
neutralize the ones that are intentionally excluded with a `void` statement so the rule stays live:
`void sendFormDraft; void tokenContract; void network; void calculateNormalFeeMaxAmount; void trigger; void form;`
inside the effect, deps `[]` removed in favor of an explicit comment-per-omitted-value. If the
navigation shape is _not_ guaranteed, key the effect on `accountKey`/`tokenContract` instead of `[]`.

---

## F-09-10 (low confidence) — `SendUtxoScreen` crosses the hook boundary with `account?.utxo ?? []`

- **Class:** 1 (unstable dependency crossing a hook boundary)
- **Where:** `suite-native/module-send/src/screens/SendUtxoScreen.tsx:49`, consumed by
  `suite-common/transaction-search/src/useFilteredUtxos.ts:9-17`
- **Trigger cadence:** every render of `SendUtxoScreen` in which `account.utxo` is nullish
- **Severity guess:** P3 (the fallback only matters when `account.utxo` is undefined, which should be
  rare-to-never on a coin-control screen only reachable for UTXO-based accounts with UTXOs to select)
- **Confidence:** low — flagging the pattern match per the skill's exact "crosses the hook boundary"
  shape, but I could not find a realistic path where `account.utxo` is nullish while this screen is
  mounted, so the practical impact may be zero

### Before (verbatim from the file)

```tsx
const account = useSelector((state: AccountsRootState) => selectAccountByKey(state, accountKey));
const filteredUtxos = useFilteredUtxos(account?.utxo ?? [], searchQuery);
```

`useFilteredUtxos` (`suite-common/transaction-search/src/useFilteredUtxos.ts`, not excluded in
`asymptotic-complexity`/`scheduling`):

```tsx
export const useFilteredUtxos = (
    utxos: Utxo[] = [],
    query: string = '',
    outputLabels?: SearchOutputLabels,
) =>
    useMemo(() => {
        if (!query.trim()) {
            return utxos;
        }
        return utxos.filter(utxo => filterUtxos(utxo, query, outputLabels));
    }, [utxos, query, outputLabels]);
```

### Proposed fix

A module-level `const EMPTY_UTXOS: Utxo[] = [];` fallback instead of `?? []` at the call site would
close the gap for free and costs nothing even if the edge case never triggers.

### Why it matters

Included for completeness/pattern-matching rather than because I found real impact — the memo inside
`useFilteredUtxos` would only fail to hold its reference during whatever render(s) `account.utxo` is
nullish, and downstream (`filteredUtxos.length > 0 ? <UtxoList /> : ...`) only reads `.length`, not
identity, so I did not find a consumer that would actually suffer even in the edge case.

- Note: `SendUtxoScreen.tsx:88` (`onSelectionSubmit`'s `account?.utxo?.filter(...) ?? []`) is already
  drafted as an O(n×m) algorithmic-complexity finding in
  `perf-issues/asymptotic-complexity/p3-04-cleanups-suite-native-mobile-app.md` — that's a different
  defect class (the `?? []` there is a plain event-handler fallback, not a hook dependency), so I did
  not re-file it here, per the brief's instruction to say so when a distinct hooks-class defect
  exists at an already-covered anchor. I did not find a distinct hooks-class defect at that line.

---

## Checked, clean

- `suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx` and
  `.../sell/payment/SellProviderPicker.tsx` — `selectedValue ?? {}` only feeds a primitive
  destructure; the quotes selectors (`selectBuyQuotesByPaymentMethodNative`,
  `selectSellQuotesByPaymentMethod`) are built on `createMemoizedSelector` =
  `createWeakMapSelector.withTypes<TradingRootState>()` (`suite-native/trading-state/src/reducers/index.ts:15`), so they're stable across dispatches.
- `suite-native/module-trading/src/components/exchange/ExchangeProviderPicker.tsx` — same
  `selectedValue ?? {}` primitive-destructure shape, no memo/effect consumes it.
- `suite-native/module-trading/src/components/exchange/Approval/RevokeLimitInfoRow.tsx` and
  `.../exchange/ExchangeFormQuoteDebugView.tsx` — `findToken(...) ?? {}` is render-body work only
  (class 4, web/suite-common only, out of scope for compiled native); `ExchangeFormQuoteDebugView`
  uses `useWatch` (not bare `watch()`) and is a debug-only view.
- `suite-native/module-trading/src/components/general/AccountList/AccountList.tsx` +
  `suite-native/module-trading/src/hooks/general/useReceiveAccountsListData.ts` — the `?? []` on
  the hook's return is dead code (the hook's own `useMemo` always resolves to an array, never
  `undefined`); the `useMemo`'s own deps (`accounts`, `selectedAccount`, `translate`, `mode`) are
  sound.
- `suite-native/module-earn/src/components/EarnDepositsCard.tsx` +
  `EarnActiveItemsBottomSheet.tsx` — the `?? []` fallbacks (`stakingRow?.activeItems ?? []` etc.)
  only feed a `FlashList`'s `data` prop; no effect/memo in `EarnActiveItemsBottomSheet` keys on
  `items`'s identity.
- `suite-native/module-earn/src/components/SolanaStakingRewardsList.tsx` — `rewardsQuery.data?.rewards ?? []` is TanStack Query data (stable while `data` hasn't refetched); `renderItem`'s own deps
  are `[account.symbol]`, not `rewards`.
- `suite-native/module-earn/src/hooks/useMessageSystemYield.ts` (native wrapper) +
  `suite-common/message-system/src/useMessageSystemYield.ts` (core) — the wrapper passes a fresh
  `{ type, vaultContractAddress, locale }` object every render, but the core hook destructures all
  three into primitives immediately and only uses them inside further `useSelector` calls — the
  fresh wrapper object never reaches a memo/effect dependency array.
- `suite-native/module-earn/src/hooks/useStakingListData.ts` — the `.filter()`/`.forEach()` work
  runs inside a `useMemo` keyed on `[accounts, areTestnetsEnabled]`; `accounts` comes from
  `selectVisibleDeviceAccounts` (shared, already-established selector).
- `suite-native/module-earn/src/hooks/useYieldWithdrawFees.ts` — **good pattern**, cited above as
  the fix template for F-09-1: explicitly reads `feeInfo`/`flowData`/fee-draft state through refs at
  compose time (comment at `:75-77`, `flowDataRef.current = flowData` at `:344`) specifically so
  they can't re-trigger the compose effect.
- `suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts` — **good pattern**:
  destructures `accountKey`/`accountSymbol` from `account` immediately (`:168-169`) before any
  selector/effect use; the polling-interval effect (`:227-237`) depends on
  `[accountKey, dispatch, pollIntervalMs, shouldPollPendingTransaction]` — primitives only.
- `suite-native/module-earn/src/hooks/useYieldApprovalLimit.tsx` — trivial `useState`+`useEffect`
  sync from a primitive prop default; no instability.
- `suite-native/module-trading/src/hooks/general/form/useSendAccountChangeEffect.ts`,
  `useReceiveAccountChangeEffect.ts`, `useSendAccountAssetBalance.ts` — these intentionally write
  the _whole_ selected account/receive-account into the form (`setValue('sendAccount', sendAccount)`),
  so depending on the whole object is correct; the account itself comes from
  `createMemoizedSelectorWithAccounts`-built selectors (`selectExchangeSelectedSendAccount` etc.,
  `suite-native/trading-state/src/selectors/exchangeSelectors.ts:35`), so it's stable modulo real
  data changes. `useSendAccountAssetBalance`'s second effect (`:60-71`) is a good minimal-deps
  example (`sendAsset?.contractAddress, sendAccount?.symbol, accountKey` — primitives only).
- `suite-native/module-trading/src/hooks/general/form/useTradeableAssetChange.ts` —
  `options ?? {}` (line 78) is a per-invocation callback parameter (evaluated when the returned
  function is called from a user action), not a render-time hook dependency; `collision` configs
  passed by all four callers (`ExchangeSendAssetPicker.tsx`, `ExchangeTradeableAssetPicker.tsx`, and
  two callers that don't pass `collision` at all) are module-level constants, not inline literals.
- `suite-native/module-trading/src/hooks/general/form/useContextForTradingForm.ts` +
  `suite-native/transaction-management/src/hooks/useMaxSpendableAmount.ts` — the inline
  `{ accountKey, tokenContract, symbol }` object at the call site is fresh every render (crosses the
  hook boundary), but `useMaxSpendableAmount` destructures it into primitives at the parameter list
  and its own effect deps are `[dispatch, accountKey, tokenContract, formState, tokenBalance, enabled, symbol]` — all primitives (the one non-primitive, `formState`, is never passed by this
  module's single caller, confirmed via `grep -rn "useMaxSpendableAmount(" suite-native`).
- `suite-native/module-trading/src/hooks/general/useComposeTradingTransaction.ts` — **good
  pattern**: `composeTradingTransaction` reads `store.getState()` imperatively inside the callback
  instead of subscribing via `useSelector`, so it never depends on `account`/`draft` at all; its
  `useCallback` deps (`[dispatch, store, tradeType, getNetworkFeeInfo]`) are all stable.
- `suite-native/module-trading/src/hooks/general/useTradingTransaction.ts` — `draft ?? {}` (line 105) is sourced from `selectDeepCopyOfFormDraft`, which despite doing a `JSON.parse(JSON.stringify(...))` deep clone internally, _is_ wrapped in `createWeakMapSelector` keyed on the
  underlying `selectFormDraft` result (`suite-common/wallet-core/src/formDrafts/selectors.ts:14-16`)
  — it only re-clones when the stored draft object actually changes, not on every call. Same for the
  shared `useFormDraft` hook (`suite-common/wallet-core/src/formDrafts/useFormDraft.ts`) used by
  `useComposeEarnFees.ts`/`useYieldAllowanceFees.ts`/`usePreparedTxFees.ts`.
- `suite-native/module-trading/src/hooks/buy/useBuyForm.ts`, `hooks/sell/useSellForm.ts`,
  `hooks/exchange/useExchangeForm.ts` (and their `useBuyQuotesChangeEffect`/
  `useSellQuotesChangeEffect`/`useExchangeQuotesChangeEffect`/`useExchangeQuoteChangeEffect`/
  `useDexQuoteApprovalInfoChangeEffect`/`useValidations` sub-hooks) — every selector used
  (`selectValidTradingBuyQuotesNative`, `selectValidTradingSellQuotes`, `selectGroupedExchangeQuotes`,
  `selectExchangeSelectedSendAccount`, `selectExchangeAmountLimits`, `selectTradingExchangeProviders`)
  is either `createWeakMapSelector`-backed or a plain state accessor — traced each definition in
  `suite-common/trading/src/selectors/tradingSelectors.ts` and
  `suite-native/trading-state/src/selectors/exchangeSelectors.ts`.
  `useDexQuoteApprovalInfoChangeEffect` additionally self-guards its prefetch dispatch with
  `pendingPrefetchQuoteIds`/`lastProcessedQuoteId` refs, so `sendAccount` reference churn can't cause
  a duplicate `prefetchDexQuoteApprovalThunk` dispatch even though `sendAccount` is in its deps.
- `suite-native/module-trading/src/hooks/general/form/useCountryChangeEffect.ts` — textbook correct
  previous-value tracking: plain `useRef` assigned at the _end_ of the effect body, matching the
  skill's own "good - `TransactionReviewModalBody.tsx:59`" shape exactly.
- `suite-native/module-trading/src/hooks/general/form/useProviderMetadataChangeEffect.ts` +
  `useReceiveAccountPreselectionEffect.ts` — primitive (`exchange: string`, `isFocused: boolean`) or
  already-memoized-selector deps only.
- `suite-native/module-send/src/components/TronNoteInput.tsx` — `useEffect(() => setLocalNote(value), [value])` seeds an editable local draft buffer from an external `useWatch`-sourced value; this is
  the accepted "sync local edit-state from an external source" exception, not derivable state, since
  the user can diverge from `value` while the bottom sheet is open. Uses `useWatch` (imported directly
  from `react-hook-form`, not `@suite-native/forms` — a minor import-path inconsistency, not a perf
  issue, since both are the same safe hook).
- `suite-native/module-send/src/hooks/useAddressValidationAlerts/useAddressValidationAlerts.ts` +
  `useAddressChecksum.ts` + `useContractAddressCheck.ts` + `useTokenAlert.ts` — the per-keystroke
  effect is intentionally keystroke-driven (real-time inline address validation); the one network
  call in the chain (`TrezorConnect.getAccountInfo` in `useContractAddressCheck.ts`) is gated on
  `isFilledValidAddress` (a _complete_ valid address, not a partial one) and latched by
  `wasContractAlertDisplayed`, so it cannot fire per-keystroke on an incomplete address.
- `suite-native/module-send/src/screens/SendUtxoScreen.tsx:52-62` (the `fetchUtxoTransactionsForAccountThunk` mount effect) — deps `[accountKey, dispatch]`, correct minimal-key shape.
- `suite-native/module-send/src/hooks/useSendForm.tsx` — the excluded-UTXOs `useMemo` (`:146-154`,
  `utxos: account?.utxo ?? []`) is a false positive for class 1: the `?? []` is inside the memo
  _body_ (an argument to `getExcludedUtxos`), not the dependency array, which lists the raw
  `account?.utxo` reference; the memo only recomputes when that reference (or the other two deps)
  actually changes.
- `suite-native/module-trading` test-helper default parameters (`overrides: PreloadedStatePartial<...> = {}` and similar, dozens of hits in C4/C5) — these are `.test.tsx`/`.test.ts` mock-builder
  functions, not render-path hooks; a fresh `{}` per test-helper call has no render/effect
  consequence. Not itemized individually.
