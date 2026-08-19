Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/components/connection/context/ConnectionGlobalModalContext.tsx:176`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/connection/context/ConnectionGlobalModalContext.tsx#L176)

- Value source: [`ConnectionGlobalModalContext.tsx:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/connection/context/ConnectionGlobalModalContext.tsx#L67)
  — `useConnectionGlobalModal`, returns a new object literal on every call.
- Per-row consumer: [`packages/suite/src/components/suite/bluetooth/BluetoothDeviceListItem.tsx:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/bluetooth/BluetoothDeviceListItem.tsx#L81)
  — one instance per row of the nearby/known device list; also consumed directly by
  `BluetoothScanningList.tsx`, `CantSeeTrezorModal.tsx`, `BluetoothConnectionModal.tsx`, and
  `ConnectDeviceGlobalModal.tsx` (all under `packages/suite/src/components/connection/`).

## Before

```tsx
export const ConnectionGlobalModalProvider = ({ children }: ConnectionGlobalModalProviderProps) => {
    const contextValue = useConnectionGlobalModal();

    return (
        <ConnectionGlobalModalReactContext.Provider value={contextValue}>
            {children}
        </ConnectionGlobalModalReactContext.Provider>
    );
};
```

## After

```tsx
const useConnectionGlobalModal = () => {
    // ...unchanged: dispatch, showHints/shouldPairAgain/showRemoveFromOsBluetooth state,
    // defaultConnectionMode/nearbyDevices/knownDevices selectors, isBluetoothMode...

    const toggleBluetoothMode = useCallback(() => {
        dispatch(setConnectionMode(isBluetoothMode ? 'cable' : 'bluetooth'));
    }, [dispatch, isBluetoothMode]);

    const toggleShowHints = useCallback(() => setShowHints(prev => !prev), []);

    const toggleShouldPairAgain = useCallback(() => setShouldPairAgain(prev => !prev), []);

    const openShowRemoveFromOsBluetooth = useCallback(() => {
        setShouldPairAgain(false);
        setShowRemoveFromOsBluetooth(prev => !prev);
    }, []);

    const closeShowRemoveFromOsBluetooth = useCallback(() => {
        setShowRemoveFromOsBluetooth(false);
        toggleShouldPairAgain();
    }, [toggleShouldPairAgain]);

    // ...unchanged: allDevices/devices, useBluetoothScanning, useBluetoothConnection,
    // shouldShowBluetoothUnPairDeviceList...

    return useMemo(
        () => ({
            shouldPairAgain,
            showHints,
            isBluetoothMode,
            devices,
            selectedDevice,
            allDevices,
            toggleBluetoothMode,
            toggleShowHints,
            toggleShouldPairAgain,
            handlePairingCancel,
            onConnect,
            onReScanClick,
            openShowRemoveFromOsBluetooth,
            closeShowRemoveFromOsBluetooth,
            showRemoveFromOsBluetooth,
            notConnectedKnownDevices,
            shouldShowBluetoothUnPairDeviceList,
            notConnectedNearbyDevices,
            manuallyPairedConnectedDevices,
        }),
        [
            shouldPairAgain,
            showHints,
            isBluetoothMode,
            devices,
            selectedDevice,
            allDevices,
            toggleBluetoothMode,
            toggleShowHints,
            toggleShouldPairAgain,
            handlePairingCancel,
            onConnect,
            onReScanClick,
            openShowRemoveFromOsBluetooth,
            closeShowRemoveFromOsBluetooth,
            showRemoveFromOsBluetooth,
            notConnectedKnownDevices,
            shouldShowBluetoothUnPairDeviceList,
            notConnectedNearbyDevices,
            manuallyPairedConnectedDevices,
        ],
    );
};
```

`ConnectionGlobalModalProvider` itself needs no change — it already just forwards
`useConnectionGlobalModal()`'s return value straight into `.Provider value={contextValue}`.

## Why it matters

`useConnectionGlobalModal` re-runs on every render of the provider — which happens continuously
while a Bluetooth scan is active, since `nearbyDevices`/`knownDevices`/`allDevices` get fresh
references on every device update — and returns a brand-new object every time, bundling
frequently-changing scan state together with per-row data. Every direct consumer of the context,
including `BluetoothDeviceListItem` (one instance per nearby/known device row), re-renders on every
one of those ticks: React re-renders a `useContext` subscriber whenever the Provider value's
reference changes, independent of whether the fields that component actually reads were among the
ones that changed.

## Notes

- Compile requirement: add `useCallback`/`useMemo` to the
  `import { type ReactNode, createContext, useContext, useState } from 'react';` line.
- `toggleShowHints`/`toggleShouldPairAgain`/the toggle inside `openShowRemoveFromOsBluetooth` switch
  to the updater-function form of `setState` (`prev => !prev`) so they can carry an empty
  dependency array without capturing a stale `showHints`/`shouldPairAgain` closure; a naive
  `useCallback(() => setShowHints(!showHints), [showHints])` would defeat its own memoization by
  changing identity on every toggle.
- This memo only fully holds once its own inputs are stable. `onConnect` and `handlePairingCancel`
  (`packages/suite/src/components/connection/hook/useBluetoothConnection.tsx:67` and `:89`) are
  plain, non-`useCallback` async functions in that sibling hook, so they are still fresh on every
  call even after this file's fix — that hook needs the same treatment in the same PR for this
  `useMemo` to actually stop recomputing. `onReScanClick`
  (`packages/suite/src/components/connection/hook/useBluetoothScanning.ts:39`), by contrast, is
  already `useCallback`-wrapped and safe to depend on as-is.
- Correct in-repo sibling for the Provider-value shape:
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetOptionsContext.tsx:26-29`
  already wraps its Provider value in `useMemo` keyed on its real inputs.
- `BluetoothDeviceListItem` is not currently `memo()`-wrapped, so this fix's benefit today is fewer
  unrelated re-renders across the whole connect-flow subtree rather than "restoring a defeated
  memo" — but it also means a future `memo()` on that row would otherwise be silently defeated by
  this same context churn, the same shape as `TransactionItem`/`ScrollContext` in sibling draft
  p1-07 (not yet filed).
- Honest sizing: the fan-out list (nearby/known Bluetooth devices) is inherently small, so the
  absolute cost per tick is modest even though the pattern is the textbook shape.
- `packages/suite` is web/desktop, not React-Compiler-covered — this is a manual fix.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
