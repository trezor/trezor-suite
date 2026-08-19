Extracted from the `skills/performance-react-hooks/SKILL.md` audit — ten small, independent cleanups
across `suite-native/device-authorization`, `transaction-management`, `accounts`, `module-trading`,
`module-earn`, `module-send`, `module-accounts-management`, and `module-device-onboarding`. Each is
low-severity and self-contained; batched into one issue because none justifies its own PR. Found by
sweep, not named in the doc.

### 1. `usePinAction.tsx`: `exhaustive-deps` suppression comment no longer matches the code

**Where:** [`suite-native/device-authorization/src/hooks/usePinAction.tsx:137-144`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/device-authorization/src/hooks/usePinAction.tsx#L137-L144) (the suppressed `useFocusEffect`), whose comment refers to `handlePinAction` at [`:86-135`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/device-authorization/src/hooks/usePinAction.tsx#L86-L135).

**Before:**

```tsx
// handlePinAction's only object-shaped input is already narrowed to device?.path (line 135's deps)
const handlePinAction = useCallback(async () => {
    // ...
}, [analytics, type, device?.path, showSuccess, onSuccess, handleError, navigation]);

useFocusEffect(
    useCallback(() => {
        if (!isDeviceConnectionGuardVisible) handlePinAction();

        // handlePinAction is excluded as it depends on device object that could unintentionally trigger the useEffect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDeviceConnectionGuardVisible]),
);
```

**After:**

```tsx
useFocusEffect(
    useCallback(() => {
        if (!isDeviceConnectionGuardVisible) handlePinAction();
    }, [isDeviceConnectionGuardVisible, handlePinAction]),
);
```

Drop the `eslint-disable` and its stale comment — `handlePinAction`'s only object-shaped input is already `device?.path`, a primitive, so nothing here can "unintentionally trigger" the effect the way the comment describes.

### 2. `useMaxSpendableAmount.ts` / `useCustomFee.ts`: whole `formState` object as effect/callback dependency

**Where:** [`suite-native/transaction-management/src/hooks/useMaxSpendableAmount.ts:55-98`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transaction-management/src/hooks/useMaxSpendableAmount.ts#L55-L98) and [`suite-native/transaction-management/src/hooks/fees/useCustomFee.ts:98-162`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transaction-management/src/hooks/fees/useCustomFee.ts#L98-L162) (`handleValuesChange`'s deps include `formState`, feeding the debounce effect at `:151-162`).

**Before:**

```tsx
// useMaxSpendableAmount.ts:98 — formState is a whole externally-supplied object
}, [dispatch, accountKey, tokenContract, formState, tokenBalance, enabled, symbol]);
```

```tsx
// useCustomFee.ts:136-149 — handleValuesChange also takes formState whole, feeding a debounce effect
}, [
    trigger, networkType, isEip1559Fee, customFeePerUnit, formState,
    dispatch, accountKey, customFeeLimit, customMaxPriorityFeePerGas, customMaxFeePerGas, setError, translate,
]);
```

**After:**

```tsx
const formStateRef = useFreshRef(formState);

useEffect(() => {
    // ... unchanged body, replace `formState` reads with `formStateRef.current` ...
}, [dispatch, accountKey, tokenContract, formStateRef, tokenBalance, enabled, symbol]);
```

Same ref-read swap in `useCustomFee.ts`'s `handleValuesChange` — read `formStateRef.current` instead of closing over `formState`, and drop `formState` from its own deps array (the debounce effect at `:151-162` already keys on the `useWatch`-sourced fee fields, not on `formState`).

### 3. `AccountsListWithFilter.tsx`: prop copied into state via effect (currently inert)

**Where:** [`suite-native/accounts/src/components/AccountsListWithFilter.tsx:39,48,55-57`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/accounts/src/components/AccountsListWithFilter.tsx#L39-L57).

**Before:**

```tsx
const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
// ...
useEffect(() => {
    setFilteredNetworks(networksFilter);
}, [networksFilter]);
```

**After:**

```tsx
const [networksFilterOverride, setNetworksFilterOverride] = useState<NetworkSymbol[] | null>(null);
const filteredNetworks = networksFilterOverride ?? networksFilter;
// ... drop the useEffect entirely; handleApplyFilter/handleClearFilters now call
// setNetworksFilterOverride(selected) / setNetworksFilterOverride([]) instead of setFilteredNetworks
```

Derive instead of duplicating: `filteredNetworks` becomes "the user's override if they've set one, else whatever the caller currently passes" — computed during render, so there is no effect left to go stale or discard an in-progress selection.

### 4. `ExchangeApprovalDetails.tsx` / `ExchangeRevokeDetails.tsx`: no-op guard effect keyed on whole account

**Where:** [`suite-native/module-trading/src/components/exchange/Approval/ExchangeApprovalDetails.tsx:31-35`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/components/exchange/Approval/ExchangeApprovalDetails.tsx#L31-L35) and [`ExchangeRevokeDetails.tsx:24-28`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/components/exchange/Approval/ExchangeRevokeDetails.tsx#L24-L28) (identical shape, different message string).

**Before:**

```tsx
useEffect(() => {
    if (!account) {
        console.error('No account selected for exchange approval details');
    }
}, [account]);
```

**After:**

```tsx
useEffect(() => {
    if (!account) {
        console.error('No account selected for exchange approval details');
    }
}, [!!account]);
```

### 5. `useWatchTrade.ts`: analytics effect depends on `account` but never reads it

**Where:** [`suite-native/module-trading/src/hooks/general/useWatchTrade.ts:57-69`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useWatchTrade.ts#L57-L69).

**Before:**

```tsx
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

**After:**

```tsx
}, [trade, analytics]);
```

Body unchanged — `account` and the `previousStatus` ref were never read inside it. (The file's _second_ effect, `:71-85`, legitimately needs `account`; it is separately guarded by `(!hasRefreshed || shouldReload) && shouldRefresh` so account churn alone can't cause a duplicate dispatch there — not filed.)

### 6. `YieldWithdrawCompleteScreen.tsx` / `WrappedNativeTokenCompleteContent.tsx`: complete-screen memos keyed on whole account

**Where:** [`suite-native/module-earn/src/screens/YieldWithdrawCompleteScreen.tsx:117-167`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/screens/YieldWithdrawCompleteScreen.tsx#L117-L167) and [`suite-native/module-earn/src/components/WrappedNativeTokenCompleteContent.tsx:58-79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-earn/src/components/WrappedNativeTokenCompleteContent.tsx#L58-L79).

**Before:**

```tsx
// YieldWithdrawCompleteScreen.tsx — only account.symbol is read (lines 126, 131, 159)
const rows = useMemo(() => {
    // ...
}, [CryptoAmountFormatter, account, isSharesInput, resolutionStatus, session, vault]);
```

```tsx
// WrappedNativeTokenCompleteContent.tsx — only account.symbol is read (line 73)
const rows = useMemo(() => {
    // ...
}, [CryptoAmountFormatter, account, amount, flowType, nativeSymbol, wrappedNative]);
```

**After:**

```tsx
}, [CryptoAmountFormatter, account?.symbol, isSharesInput, resolutionStatus, session, vault]);
```

```tsx
}, [CryptoAmountFormatter, account?.symbol, amount, flowType, nativeSymbol, wrappedNative]);
```

Both `account`s here come from the same `useResolvedYieldFlowData`/`resolveYieldFlowData` chain as the sibling draft p1-17 (not yet filed) — this is a much smaller-consequence instance of the same "whole object where a primitive would do" pattern, on a cold completion screen rather than a live review screen.

### 7. `useSendForm.tsx`: `exhaustive-deps` suppression on mount-only draft prefill

**Where:** [`suite-native/module-send/src/hooks/useSendForm.tsx:291-316`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/hooks/useSendForm.tsx#L291-L316).

**Before:**

```tsx
useEffect(() => {
    const prefillValuesFromStoredDraft = async () => {
        if (sendFormDraft?.outputs) {
            form.reset({/* ... */});
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

**After:**

```tsx
useEffect(() => {
    const prefillValuesFromStoredDraft = async () => {
        if (sendFormDraft?.outputs) {
            form.reset({/* ... */});
            if (!tokenContract) await calculateNormalFeeMaxAmount();
            setTimeout(() => {
                trigger();
            }, 0);
        }
    };

    prefillValuesFromStoredDraft();
    // Mount-only by design: useSendForm(accountKey, tokenContract) takes both as hook params, so a
    // fresh account/token is always a fresh mount of this hook instance, not a param update on it.
    void sendFormDraft;
    void tokenContract;
    void network;
    void calculateNormalFeeMaxAmount;
    void trigger;
    void form;
}, []);
```

Keeps today's behavior (plausibly correct — see the scan's reasoning on the navigation shape) while replacing the blanket disable with the skill's prescribed alternative, so the rule stays live if a future refactor makes any of these six values relevant.

### 8. `SendUtxoScreen.tsx`: `account?.utxo ?? []` crosses the hook boundary — verify first

**Where:** [`suite-native/module-send/src/screens/SendUtxoScreen.tsx:49`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/screens/SendUtxoScreen.tsx#L49), consumed by [`suite-common/transaction-search/src/useFilteredUtxos.ts:8-18`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/useFilteredUtxos.ts#L8-L18).

**Verify first:** confirm there is a real, reachable path where `account.utxo` is nullish while `SendUtxoScreen` is mounted (e.g. a UTXO-based account before its first `utxo` fetch resolves) before filing this as a live defect. The fallback only matters when `account.utxo` is nullish, which should be rare-to-never on a coin-control screen only reachable for UTXO-based accounts — this sweep could not find a concrete trigger, and the one downstream consumer (`filteredUtxos.length > 0 ? <UtxoList /> : ...`) only reads `.length`, not identity, so the practical impact may be zero even if the edge case does occur.

**Before:**

```tsx
const filteredUtxos = useFilteredUtxos(account?.utxo ?? [], searchQuery);
```

**After:**

```tsx
// module-level, outside the component
const EMPTY_UTXOS: Utxo[] = [];

// ...
const filteredUtxos = useFilteredUtxos(account?.utxo ?? EMPTY_UTXOS, searchQuery);
```

A module-level constant closes the gap for free even if the edge case never triggers in practice.

### 9. `useDayCoinPriceChange.ts`: derived percentage computed via a second effect instead of `useMemo`

**Where:** [`suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts:82-88`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts#L82-L88). Sole consumer: [`suite-native/module-accounts-management/src/components/AssetPriceCard.tsx:74-77`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AssetPriceCard.tsx#L74-L77).

**Before:**

```tsx
useEffect(() => {
    if (isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)) {
        setValuePercentageChange(percentageDiff(weekAgoValue, currentValue.toNumber()));
    } else {
        setValuePercentageChange(null);
    }
}, [currentValue, weekAgoValue]);
```

**After:**

```tsx
const valuePercentageChange =
    isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)
        ? percentageDiff(weekAgoValue, currentValue.toNumber())
        : null;
```

Drop the `valuePercentageChange`/`setValuePercentageChange` `useState` and this second effect entirely — the value is a pure function of state already in hand.

### 10. `DeviceTutorialScreen.tsx`: `useFocusEffect` + empty deps array contradicts its own "first render only" comment

**Where:** [`suite-native/module-device-onboarding/src/screens/DeviceTutorialScreen.tsx:22-38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-device-onboarding/src/screens/DeviceTutorialScreen.tsx#L22-L38).

**Before:**

```tsx
useFocusEffect(
    useCallback(() => {
        const showTutorial = async () => {
            await requestPrioritizedDeviceAccess(() =>
                TrezorConnect.showDeviceTutorial({ device }),
            );
            navigation.replace(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        };
        showTutorial();

        // This use effect should be triggered only during the first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
);
```

**After:**

```tsx
useEffect(() => {
    const showTutorial = async () => {
        await requestPrioritizedDeviceAccess(() => TrezorConnect.showDeviceTutorial({ device }));
        navigation.replace(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
    };
    showTutorial();
}, []);
```

Swap `useFocusEffect` for a plain `useEffect` so the hook's own semantics match the comment's stated "first render only" intent, and drop the now-unnecessary disable. (If re-running on every refocus is actually wanted instead, keep `useFocusEffect` and add `device` to the inner `useCallback`'s deps — either reading is a one-line fix, but the code as written asserts both at once.)

## Why it matters

Ten independent, low-severity instances of this skill's cheapest-to-fix classes — wider-than-needed hook dependencies, derived state routed through an effect, and stale `eslint-disable` comments — grouped because none is costly enough alone to justify a standalone issue:

1. **`usePinAction.tsx`** — a lying dependency array: the suppression comment describes code from before `device` was narrowed to `device?.path`; the next person to touch this file has no reliable signal about what's actually being protected against.
2. **`useMaxSpendableAmount.ts`/`useCustomFee.ts`** — both drive "max spendable amount"/custom-fee-preview UI during active typing in a send flow. `useMaxSpendableAmount`'s only current caller never passes `formState` (dormant today), and `useCustomFee`'s `formState` source wasn't traced in this sweep — so treat this as hardening against a reference that _would_ restart the guarded async work on every keystroke if a future caller supplies an unstable one, not a proven hot path today.
3. **`AccountsListWithFilter.tsx`** — not live today (all 3 callers pass a referentially stable `networksFilter`), but the component's own prop contract invites a future caller to pass an inline array literal, which would silently discard a user's in-progress filter selection on every parent re-render.
4. **`ExchangeApprovalDetails.tsx`/`ExchangeRevokeDetails.tsx`** — cheap, bounded re-invocation of a truthiness check on every account update to the exchange's send account; harmless today, included as a clean one-character-diff example of the same "whole object" habit as this sweep's hotter findings.
5. **`useWatchTrade.ts`** — `account` and a ref sit in a dependency array whose body never reads them; a zero-risk removal.
6. **`YieldWithdrawCompleteScreen.tsx`/`WrappedNativeTokenCompleteContent.tsx`** — cold-path completion screens; the recomputed work is string formatting, not a network call, so this rides on the same account-chain family as sibling draft p1-17 at a much smaller consequence.
7. **`useSendForm.tsx`'s mount-only prefill** — plausibly correct given how this screen is navigated to, but the blanket `eslint-disable` gives no signal if that navigation assumption ever changes.
8. **`SendUtxoScreen.tsx`** — verify first: this sweep could not find a live path where `account.utxo` is nullish while the screen is mounted, so this may be a zero-impact defensive cleanup rather than an active defect.
9. **`useDayCoinPriceChange.ts`** — a guaranteed extra render of `AssetPriceCard` on every 30-second price refresh, since the percentage is a pure function of state already in hand.
10. **`DeviceTutorialScreen.tsx`** — `useFocusEffect` and an empty dependency array assert two different lifecycles at once; if a future navigator change ever allows refocusing this screen, `device` would be silently stale with no lint error to catch it.

None of these sit on a hot, continuously re-rendering path — most are cold/one-shot screens, guarded async work, or effects whose bodies don't even read the flagged dependency — which is why all ten are P3 rather than individually filed.

## Notes

- Compile requirements: `useFreshRef` (from `@trezor/react-utils`) needs importing in both files for #2 (neither currently imports from that package). #10 swaps `DeviceTutorialScreen.tsx`'s `import { useCallback } from 'react';` for `import { useEffect } from 'react';` — `useCallback` becomes unused once `useFocusEffect` is dropped. #3 and #8 need no new imports (`useState`/a module-level array are already in scope).
- **F-09-10 is genuinely low confidence** (#8 above) — flagged per the skill's exact "crosses the hook boundary" pattern match, but this sweep could not construct a realistic trigger. Verify the nullish-`utxo` path exists before filing; if it doesn't, this is optional defensive cleanliness rather than a fix.
- All ten files are `suite-native`, compiled by React Compiler: every fix here is a dependency-array narrowing, a derive-instead-of-store rewrite, or an `eslint-disable` replacement — never a manual memo addition.
- #6 cites sibling draft p1-17 ("Native fee-compose effects key on whole account", not yet filed) — same `useResolvedYieldFlowData` root cause, much smaller blast radius (a one-time completion screen vs. a live review screen), which is why it's batched here instead of merged into that doc.
- #5's second effect in `useWatchTrade.ts` (`:71-85`) was checked and is _not_ included — it legitimately needs `account` and is separately guarded against duplicate dispatch.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
