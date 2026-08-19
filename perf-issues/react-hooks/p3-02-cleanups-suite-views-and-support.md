Extracted from the `skills/performance-react-hooks/SKILL.md` audit — six small, independent cleanups
across `packages/suite/src/views/wallet/trading`, `views/wallet/{tokens,nfts}`, `views/onboarding`,
`views/suite/notifications`, and `support/suite`. Each is low-severity and self-contained; batched
into one issue because none justifies its own PR. Found by sweep, not named in the doc.

## Where

1. Trading Detail pages scan the full accounts list with a bare `.find()` instead of a keyed
   selector — [`TradingBuyDetailContent.tsx:53,77`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/buy/TradingBuyDetail/TradingBuyDetailContent.tsx#L53),
   [`TradingSellDetailContent.tsx:46,70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/sell/TradingSellDetail/TradingSellDetailContent.tsx#L46),
   [`TradingExchangeDetailContent.tsx:61,108-109`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/exchange/TradingExchangeDetail/TradingExchangeDetailContent.tsx#L61),
   [`TradingOfferSell.tsx:34,43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSell.tsx#L34).
2. `Tokens`/`Nfts` route guards key their redirect effect on the whole `selectedAccount` object —
   [`views/wallet/tokens/index.tsx:24,28-36`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L24-L36),
   [`views/wallet/nfts/index.tsx:16,20-27`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/nfts/index.tsx#L16-L27).
3. `onboarding/index.tsx`'s THP redirect effect depends on `device`, never read in the body —
   [`views/onboarding/index.tsx:37-41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/onboarding/index.tsx#L37-L41).
4. `NotificationsView` re-filters the whole notification list into two buckets every render —
   [`views/suite/notifications/index.tsx:27-32`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/suite/notifications/index.tsx#L27-L32).
5. `useConnectPopupDesktop` hand-rolls `useFreshRef` instead of using the existing helper —
   [`support/suite/useConnectPopupDesktop.tsx:34-36`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/useConnectPopupDesktop.tsx#L34-L36).
6. `AccountHeaderProvider`'s inline Provider value is rebuilt every render —
   [`support/suite/AccountHeaderProvider.tsx:14-26`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/AccountHeaderProvider.tsx#L14-L26).

## Before

### 1. Trading Detail pages: bare `accounts.find()` instead of a keyed selector

```tsx
// TradingSellDetailContent.tsx:46,70 — identical shape in TradingBuyDetailContent.tsx,
// TradingOfferSell.tsx, and twice in TradingExchangeDetailContent.tsx (once per trade side)
const accounts = useSelector(selectAccounts);
// ...
const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);
```

### 2. `tokens/index.tsx` / `nfts/index.tsx`: redirect effect keyed on whole `selectedAccount`

```tsx
// tokens/index.tsx:24,28-36
const selectedAccount = useSelector(state => state.wallet.selectedAccount);
// ...
useEffect(() => {
    if (
        selectedAccount.status === 'loaded' &&
        !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
        routeName !== 'wallet-index'
    ) {
        dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
    }
}, [selectedAccount, dispatch, routeName]);
```

(`nfts/index.tsx:20-27` repeats the same shape against `selectedAccount.network?.features`, deps
`[selectedAccount, dispatch]`.)

### 3. `onboarding/index.tsx`: dead `device` dependency on the THP redirect effect

```tsx
useEffect(() => {
    if (activeStepId !== STEP.ID_FIRMWARE_STEP && thpStep === 'ConfirmOnlyConnection') {
        dispatch(goto({ routeName: 'suite-index' }));
    }
}, [device, thpStep, activeStepId, dispatch]);
```

### 4. `notifications/index.tsx`: re-filters the whole notification list every render

```tsx
const notifications = useSelector(state => state.notifications);
const hasUnseenNotifications = useSelector(selectHasUnseenTransactionNotifications);
const transactionNotifications = notifications.filter(isTransactionNotification);
const activityNotifications = notifications.filter(
    notification => !isTransactionNotification(notification),
);
```

### 5. `useConnectPopupDesktop.tsx`: hand-rolled ref-assign-in-render instead of `useFreshRef`

```tsx
const selectedDevice = useSelector(selectSelectedDevice);
const selectedDeviceRef = useRef(selectedDevice);
selectedDeviceRef.current = selectedDevice;
```

### 6. `AccountHeaderProvider.tsx`: inline Provider value rebuilt every render

```tsx
export const AccountHeaderProvider = ({
    balanceSectionRef: providedBalanceSectionRef,
    children,
}: AccountHeaderProviderProps) => {
    const internalBalanceSectionRef = useRef<HTMLDivElement>(null);
    const balanceSectionRef = providedBalanceSectionRef ?? internalBalanceSectionRef;

    return (
        <AccountHeaderContext.Provider value={{ balanceSectionRef }}>
            {children}
        </AccountHeaderContext.Provider>
    );
};
```

## After

### 1. Trading Detail pages

```tsx
const sendAccount = useSelector(state => selectAccountByKey(state, trade?.sendAccountKey));
```

Drop the `selectAccounts` import and `accounts` variable in all four files — none of them reads
`accounts` for anything besides the `.find()` this replaces. Already-used pattern in this same
feature area: `TradingFormInputCryptoAmount.tsx:186`.

### 2. `tokens/index.tsx` / `nfts/index.tsx`

```tsx
useEffect(() => {
    if (
        selectedAccount.status === 'loaded' &&
        !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
        routeName !== 'wallet-index'
    ) {
        dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
    }
}, [
    selectedAccount.status,
    selectedAccount.account?.symbol,
    selectedAccount.account?.accountType,
    dispatch,
    routeName,
]);
```

(`nfts/index.tsx` analogously narrows to `selectedAccount.status`/`selectedAccount.network?.features`
instead of the whole object.)

### 3. `onboarding/index.tsx`

```tsx
useEffect(() => {
    if (activeStepId !== STEP.ID_FIRMWARE_STEP && thpStep === 'ConfirmOnlyConnection') {
        dispatch(goto({ routeName: 'suite-index' }));
    }
}, [thpStep, activeStepId, dispatch]);
```

### 4. `notifications/index.tsx`

```tsx
const { transactionNotifications, activityNotifications } = useMemo(
    () => ({
        transactionNotifications: notifications.filter(isTransactionNotification),
        activityNotifications: notifications.filter(n => !isTransactionNotification(n)),
    }),
    [notifications],
);
```

### 5. `useConnectPopupDesktop.tsx`

```tsx
const selectedDeviceRef = useFreshRef(selectedDevice);
```

### 6. `AccountHeaderProvider.tsx`

```tsx
export const AccountHeaderProvider = ({
    balanceSectionRef: providedBalanceSectionRef,
    children,
}: AccountHeaderProviderProps) => {
    const internalBalanceSectionRef = useRef<HTMLDivElement>(null);
    const balanceSectionRef = providedBalanceSectionRef ?? internalBalanceSectionRef;
    const value = useMemo(() => ({ balanceSectionRef }), [balanceSectionRef]);

    return <AccountHeaderContext.Provider value={value}>{children}</AccountHeaderContext.Provider>;
};
```

## Why it matters

Six independent, low-severity instances of this skill's two cheapest-to-fix classes — wider-than-needed
hook dependencies and missing memoization — grouped because none is costly enough alone to justify a
standalone issue:

1. **Trading Detail pages** re-scan the full accounts array on every render of a poll-driven trade
   page; a keyed selector already used elsewhere in this feature area removes the scan entirely.
2. **`Tokens`/`Nfts` route guards** re-run their redirect check on every account/blockchain sync tick
   instead of only when the fields the condition reads actually change — the guarded action is
   idempotent and rarely true, so this is wasted comparisons, not a visible bug.
3. **`onboarding/index.tsx`'s THP redirect effect** re-evaluates and potentially redispatches
   `goto('suite-index')` on every device-reference churn for a dependency its body never reads.
4. **`NotificationsView`** re-filters its notification list on every render of the Activity page,
   including tab switches that don't touch `notifications` at all.
5. **`useConnectPopupDesktop`**'s hand-rolled ref assignment is behaviorally identical to
   `useFreshRef` today, but a future "cleanup" could silently turn it into a stale-by-one-render
   `useCurrentRef` shape with no lint error to catch it.
6. **`AccountHeaderProvider`** rebuilds its Provider value on every wallet-page-header render for two
   consumers — same defect class as sibling drafts p1-11/p1-07, at a much smaller consumer count.

None of these sit on a hot, continuously-firing path — the trading pages are polling-driven, the
route guards are idempotent, the onboarding effect's guarded action is very likely a no-op past the
first navigation, and the notification/account-header cases have small consumer counts — which is
why all six are P3 rather than individually filed.

## Notes

- Compile requirements: `useFreshRef` needs importing from `@trezor/react-utils` in
  `useConnectPopupDesktop.tsx`; `useMemo` needs adding to `AccountHeaderProvider.tsx`'s
  `import React, { createContext, useContext, useRef } from 'react';` and to `notifications/index.tsx`'s
  `import { useState } from 'react';`; the four Trading Detail files swap their `selectAccounts`
  import for `selectAccountByKey` (both from `@suite-common/wallet-core`).
- Type nuance on finding 1: `accounts.find(...)` returns `Account | undefined`;
  `selectAccountByKey` returns `Account | null`. Every current use of `sendAccount`/`receiveAccount`
  across the four files is either falsy-checked or passed through an optional prop, except
  `TradingSellDetailContent.tsx:101`'s `account={sendAccount!}` non-null assertion, which strips
  `null` the same way it strips `undefined` — worth a per-file compile check rather than assumed, since
  this wasn't exhaustively traced against every downstream prop type.
- Finding 2's narrowed dependency array includes `selectedAccount.account?.accountType` alongside
  `.symbol`, beyond a purely mechanical narrowing: `hasNetworkFeatures` resolves through
  `getNetworkAccountFeatures({ symbol, accountType })`
  (`suite-common/wallet-utils/src/accountUtils.ts:1036-1043`), and some networks (e.g. Bitcoin's
  `coinjoin` account type) carry a different `features` list than the network's default.
- Finding 5 is a pure style/consistency fix — behaviorally identical before and after, since the
  hand-rolled version already assigns unconditionally in the render body, matching `useFreshRef`'s
  own contract exactly.
- Finding 6 is the same class as sibling drafts p1-11 (`ResponsiveContext`, not yet filed) and p1-07
  (`ScrollContext`, filed), at a much smaller consumer count (2, both in the wallet-page header
  subtree) — grouped here rather than given its own doc for that reason.
- All six files live in `packages/suite`, which is not React-Compiler-covered — every fix above is a
  manual dependency-array narrowing or `useMemo`/helper substitution, not something a compiler would
  otherwise absorb.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
