Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body
work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/support/suite/ResponsiveContext.tsx:68-92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/ResponsiveContext.tsx#L68-L92)
— `ResponsiveContextProvider`'s `setSidebarWidth` closure and its Provider `value` object, both
rebuilt every render.

Mounted once at the app root, wrapping every route for the whole session:

- [`packages/suite/src/support/suite/Main.tsx:36`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/Main.tsx#L36) — inside `<ConnectedThemeProvider>`.

Trigger-cadence co-anchors:

- [`packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/Sidebar.tsx:179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/Sidebar.tsx#L179) — `onWidthResizeMove={handleSidebarWidthUpdate}`, wired to a `requestAnimationFrame`-throttled `window` `mousemove` listener inside `ResizableBox` (`packages/components/src/components/ResizableBox/ResizableBox.tsx:347,392,415`) while the user drags the sidebar's resize handle.
- [`packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:33`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx#L33) and [`:39`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx#L39) — a debounced `ResizeObserver` on the main content area.

16 consumer files call `useResponsiveContext()`, including `Sidebar.tsx`, `Navigation.tsx`,
`NavigationItem.tsx`, `DeviceSelector.tsx`, `SidebarDeviceStatus.tsx`, `SuiteLayout.tsx`,
`AccountsMenu.tsx`, `AccountsList.tsx`, `AccountItemsGroup.tsx`, `AccountItemSkeleton.tsx`,
`GuideRouter.tsx`, `ConditionalRender.tsx`, and `ContentFlex.tsx`.

## Before

```tsx
// packages/suite/src/support/suite/ResponsiveContext.tsx
const setSidebarWidth = (width: number) => {
    if (typeof forcedSidebarWidth === 'number' && !userResizingSidebar) return;
    const clamped = Math.max(width, SIDEBAR_MIN_WIDTH);
    setSidebarWidthRaw(clamped);
    setSidebarWidthManual(clamped);
};

const value: ResponsiveContextType = {
    sidebarWidth: effectiveWidth,
    setSidebarWidth,
    lastManualSidebarWidth: sidebarWidthManual,
    forcedSidebarWidth,
    setForcedSidebarWidth,
    isSidebarCollapsed,
    contentWidth,
    setContentWidth,
    autoCollapsed,
    setAutoCollapsed,
    userResizingSidebar,
    setUserResizingSidebar,
    autoCollapseSuppressed,
    setAutoCollapseSuppressed,
};

return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
```

No `useMemo`/`useCallback` appears anywhere in this component for either `setSidebarWidth` or
`value`, even though `effectiveWidth` and `isSidebarCollapsed` a few lines above (`:52-60`) are
already correctly `useMemo`'d.

## After

```tsx
const setSidebarWidth = useCallback(
    (width: number) => {
        if (typeof forcedSidebarWidth === 'number' && !userResizingSidebar) return;
        const clamped = Math.max(width, SIDEBAR_MIN_WIDTH);
        setSidebarWidthRaw(clamped);
        setSidebarWidthManual(clamped);
    },
    [forcedSidebarWidth, userResizingSidebar],
);

const value = useMemo<ResponsiveContextType>(
    () => ({
        sidebarWidth: effectiveWidth,
        setSidebarWidth,
        lastManualSidebarWidth: sidebarWidthManual,
        forcedSidebarWidth,
        setForcedSidebarWidth,
        isSidebarCollapsed,
        contentWidth,
        setContentWidth,
        autoCollapsed,
        setAutoCollapsed,
        userResizingSidebar,
        setUserResizingSidebar,
        autoCollapseSuppressed,
        setAutoCollapseSuppressed,
    }),
    [
        effectiveWidth,
        setSidebarWidth,
        sidebarWidthManual,
        forcedSidebarWidth,
        isSidebarCollapsed,
        contentWidth,
        autoCollapsed,
        userResizingSidebar,
        autoCollapseSuppressed,
    ],
);

return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
```

Wrapping `value` alone would not be sufficient: `setSidebarWidth` is itself a fresh closure every
render, and it's one of `value`'s own fields, so the `useMemo` would still miss on every render
unless `setSidebarWidth` is stabilized first.

## Why it matters

React re-renders every `useContext` subscriber whenever the Provider's `value` reference changes,
regardless of which single field that subscriber actually reads. `ResponsiveContextProvider` wraps
the whole app for the whole session, and its 16 consumers include the sidebar itself, every
navigation item, the account list rows, and the device selector. Two triggers make the churn
continuous rather than occasional: the sidebar's resize handle re-invokes `setSidebarWidth` on every
animation-frame tick of a `mousemove`-driven drag, and the content area's `ResizeObserver` invokes
`setContentWidth` on every qualifying width change (window resize, sidebar collapse/expand, DevTools
panel toggle). Each of those ticks currently re-renders the full 16-file consumer set, not just the
one or two components that actually read the field that changed.

## Notes

- Compile requirement: add `useCallback` to the file's existing
  `import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';` —
  `useMemo` is already imported.
- The `useState` setters used as-is in the object (`setForcedSidebarWidth`, `setContentWidth`,
  `setAutoCollapsed`, `setUserResizingSidebar`, `setAutoCollapseSuppressed`) are already
  reference-stable for the component's lifetime per React's contract, so they need no `useCallback`
  of their own and `exhaustive-deps` won't ask for them in the `useMemo` array above.
- Correct in-repo sibling for the Provider-value shape:
  [`AssetOptionsContext.tsx:26-29`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetOptionsContext.tsx#L26-L29)
  already wraps its Provider value in `useMemo` keyed on its real inputs.
- `effectiveWidth`/`isSidebarCollapsed` (`ResponsiveContext.tsx:52-60`) are already correctly
  `useMemo`'d — this file has memoization awareness, it just wasn't applied to the object that
  actually crosses the Provider boundary.
- Splitting the context into a rarely-changing "capabilities" half and a frequently-changing
  "dimensions" half would cut fan-out further, but a single `useMemo` is the minimal, low-risk fix
  proposed here.
- `packages/suite` is web/desktop, not React-Compiler-covered — this is a manual fix and the only
  mechanism available at runtime.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
