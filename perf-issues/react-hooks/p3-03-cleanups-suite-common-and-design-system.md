# P3 hooks cleanups — suite-common and the design system

Extracted from the `skills/performance-react-hooks/SKILL.md` audit — sections _"Keep hook dependencies referentially stable"_ and _"Relocate render-body work before memoizing it, and memoize only what pays"_. Five small, independent cleanups from the `suite-common` and design-system (`packages/components`) areas of the sweep, each too narrow on its own — a cold debug screen, a single-instance hook, or a small consumer count — to carry its own issue. Found by sweep, not named in the doc.

### `suite-common/dependency-injection/src/useServices.tsx`: inline selector literal defeats `useSelectedServices`'s memo at two call sites

**Where:** [`suite-common/dependency-injection/src/useServices.tsx:65-70`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/dependency-injection/src/useServices.tsx#L65-L70) (the pre-existing `eslint-disable` is at line 68 and is not itself the bug — see Notes). Misused at [`packages/suite/src/hooks/suite/useOpenSuiteDesktop.ts:17-19`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useOpenSuiteDesktop.ts#L17-L19) and [`packages/suite/src/views/settings/SettingsDebug/Transport.tsx:59-61`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/settings/SettingsDebug/Transport.tsx#L59-L61).

**Before:**

```ts
// useServices.tsx:65-70
const useSelectedServices = (selectors: ServiceSelector<any>[]) => {
    const services = useServicesContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => selectServices(services, ...selectors), [services, ...selectors]);
};
```

```ts
// useOpenSuiteDesktop.ts:17-19 and Transport.tsx:59-61 — identical inline selector, fresh every render
const { createTransports } = useServices((services): TransportsDep => ({
    createTransports: services.createTransports,
}));
```

**After:** hoist the selector to a module-level constant at each call site, matching the established convention used by the other ~359 `useServices` callers in the repo (e.g. `selectDesktopAnalyticsDep` in `suite/analytics/src/createAnalytics.ts`):

```ts
const selectCreateTransportsDep = (services: any): TransportsDep => ({
    createTransports: services.createTransports,
});
// ...
const { createTransports } = useServices(selectCreateTransportsDep);
```

No change needed in `useServices.tsx` itself — `[services, ...selectors]` is the correct mechanism for a variable-length selector list; it just cannot statically verify that every element is stable, which is exactly what these two call sites violate.

### `suite-common/transaction-search/src/useFilteredUtxos.ts`: default parameter is a fresh array every call

**Where:** [`suite-common/transaction-search/src/useFilteredUtxos.ts:8-19`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/transaction-search/src/useFilteredUtxos.ts#L8-L19). Only current consumer: [`suite-native/module-send/src/screens/SendUtxoScreen.tsx:49`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-send/src/screens/SendUtxoScreen.tsx#L49) (`useFilteredUtxos(account?.utxo ?? [], searchQuery)`).

**Before:**

```ts
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

**After:** module-level constant instead of a fresh `[]` default, matching the skill's own worked example:

```ts
const EMPTY_UTXOS: Utxo[] = [];

export const useFilteredUtxos = (
    utxos: Utxo[] = EMPTY_UTXOS,
    query: string = '',
    outputLabels?: SearchOutputLabels,
) =>
    // ...unchanged
```

### `suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts`: rescans the account's transaction history in the render body

**Where:** [`suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts:50-56`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts#L50-L56) (`trackedTransaction`, computed inline, not memoized); the scan behind it: [`suite-common/wallet-utils/src/wrappedNativePendingTxUtils.ts:19-41`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/wrappedNativePendingTxUtils.ts#L19-L41) (`findTrackedWrappedNativeTransaction`, up to two `Array.prototype.find` passes over `transactions`).

**Before:**

```ts
const trackedTransaction = txid
    ? findTrackedWrappedNativeTransaction({
          transactions,
          txid,
          nonce: trackedNonce?.txid === txid ? trackedNonce.nonce : undefined,
      })
    : undefined;
```

**After:**

```ts
const trackedTransaction = useMemo(
    () =>
        txid
            ? findTrackedWrappedNativeTransaction({
                  transactions,
                  txid,
                  nonce: trackedNonce?.txid === txid ? trackedNonce.nonce : undefined,
              })
            : undefined,
    [transactions, txid, trackedNonce],
);
```

`transactions` (from `selectAccountTransactions`) is already a stable, weak-map-memoized reference that only changes when the account's tx list genuinely changes, so this only recomputes when `transactions`, `txid`, or `trackedNonce` actually change.

### `packages/components`: compound-component `Context.Provider` values are unmemoized object literals across the design system

**Where:** seven Providers, none memoized:

- [`Collapsible/Collapsible.tsx:33-40`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Collapsible/Collapsible.tsx#L33-L40) → consumed at `CollapsibleContent.tsx:30`, `CollapsibleToggle.tsx:25`
- [`Tabs/Tabs.tsx:108`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Tabs/Tabs.tsx#L108) → consumed at `TabsItem.tsx:63`
- [`List/List.tsx:84-86`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/List/List.tsx#L84-L86) → consumed at `ListItem.tsx:62`
- [`SubTabs/SubTabs.tsx:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/SubTabs/SubTabs.tsx#L34) → consumed at `SubTabsItem.tsx:50`
- [`StepList/StepList.tsx:63-72`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/StepList/StepList.tsx#L63-L72)
- [`Banner/Banner.tsx:140`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Banner/Banner.tsx#L140)
- [`Modal/Modal.tsx:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Modal/Modal.tsx#L95), [`Modal/ModalButton.tsx:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Modal/ModalButton.tsx#L15), [`Modal/ModalProvider.tsx:38-43`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Modal/ModalProvider.tsx#L38-L43)

**Before** (two representative examples):

```tsx
// Tabs.tsx:108 — rebuilt on every render, including the ResizeObserver-driven ones (:93-105)
// that fire on window resize with the tab set itself unchanged
<TabsContext.Provider value={{ activeItemId, isDisabled, size, setTabRef }}>
```

```tsx
// Collapsible.tsx:33-40
<CollapsibleContext.Provider
    value={{
        contentId,
        isOpen: isOpen ?? uncontrolledIsOpen,
        toggle: setUncontrolledIsOpen,
        gap,
    }}
>
```

**After:** wrap each Provider's `value` in a `useMemo` keyed on its own primitive fields, e.g.:

```tsx
const tabsContextValue = useMemo(
    () => ({ activeItemId, isDisabled, size, setTabRef }),
    [activeItemId, isDisabled, size, setTabRef],
);
```

Same shape at all seven sites — every field is already a primitive or a stable setter, so this is a pure win with no new dependency wrinkles.

### `packages/components/src/components/Popover/Popover.tsx`: floating-ui `middleware` array is unmemoized, unlike its sibling in the same package

**Where:** [`packages/components/src/components/Popover/Popover.tsx:61-75`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Popover/Popover.tsx#L61-L75); contrast with the already-correct [`packages/components/src/components/Tooltip/TooltipFloatingUi.tsx:86-95`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Tooltip/TooltipFloatingUi.tsx#L86-L95).

**Before:**

```tsx
const data = useFloating({
    placement: calculatedPlacement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
        offset(popoverOffset),
        flip({
            crossAxis: calculatedPlacement.includes('-'),
            fallbackAxisSideDirection: 'end',
            padding: 5,
        }),
        shift({ padding: 5 }),
    ],
});
```

**After:**

```tsx
const middleware = useMemo(
    () => [
        offset(popoverOffset),
        flip({
            crossAxis: calculatedPlacement.includes('-'),
            fallbackAxisSideDirection: 'end',
            padding: 5,
        }),
        shift({ padding: 5 }),
    ],
    [popoverOffset, calculatedPlacement],
);

const data = useFloating({
    placement: calculatedPlacement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware,
});
```

`TooltipFloatingUi.tsx:86-95` already does exactly this for the equivalent array in the same package.

## Why it matters

All five are the same failure mode at different scales: a reference that could be made stable (a default parameter, a selector literal, a render-body computation, a Provider value, a middleware array) isn't, so a `useMemo` downstream — sometimes the same hook's own, sometimes a sibling's — recomputes, or a Provider re-renders its consumers, more than the underlying data requires. None is a loop and none was measured; they are grouped here because each is real but individually small: `useFilteredUtxos`'s one real caller already works around the default with its own `?? []`; `useWrappedNativePendingTx` is a single-instance hook (one active wrap/unwrap flow at a time), not a per-row one; the `useServices` misuse sits behind two cold debug/troubleshooting screens; none of the seven Provider-consuming children (`CollapsibleContent`, `TabsItem`, `ListItem`, `SubTabsItem`, etc.) is wrapped in `memo()` today, so the fix only pays off once the outer component re-renders on its own internal state while `children` is otherwise unchanged (as `Tabs` already does via its `ResizeObserver`); and `Popover` has only two call sites, neither in a per-row hot path. Each fix is a mechanical, low-risk `useMemo` or module-level constant with no new dependency wrinkles.

## Notes

- Compile requirement: none of the `After` snippets need anything beyond `useMemo` from `'react'`. `Tabs.tsx` already imports other hooks from `'react'` (add `useMemo` to that line); `Collapsible.tsx`, `List.tsx`, `SubTabs.tsx`, `Banner.tsx`, `Modal.tsx`, `ModalProvider.tsx`, and `Popover.tsx` already have a `'react'` import to extend. `StepList.tsx` and `Modal/ModalButton.tsx` have no `'react'` import at all today and need one added from scratch.
- Which app: `suite-common/dependency-injection`, `suite-common/transaction-search`, and `suite-common/wallet-core` ship to both `packages/suite` (uncompiled) and `suite-native` (compiled) — per the skill, memoize regardless, since `suite-common` itself is never compiled either way. `packages/components` also ships to native, but per the skill that doesn't change the fix — memoize for the web consumer. `useFilteredUtxos`'s one real caller is itself inside `suite-native` (compiled) and never relies on the hook's own default (it always passes an explicit `account?.utxo ?? []`), so live impact there is likely nil today; the fix matters for a future web caller, or any caller that omits the argument.
- Correct in-repo siblings, the strongest evidence for two of these fixes: `useServices`'s other ~359 call sites already use a module-level `select*Dep` constant (see `selectDesktopAnalyticsDep`); `TooltipFloatingUi.tsx:86-95` already memoizes the equivalent `middleware` array in the same package as `Popover.tsx`.
- Honest sizing: none of these five was individually worth a standalone issue — grouped here as one PR's worth of cleanup rather than five near-empty ones, per this sweep's own severity guidance. The seven Provider-value sites are counted as one entry because they're the same mechanism repeated, not because any one of them is large.
- Same-PR scope: all five findings are independent (different files, no shared code path) — land them together or split arbitrarily with no ordering constraint between them.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
