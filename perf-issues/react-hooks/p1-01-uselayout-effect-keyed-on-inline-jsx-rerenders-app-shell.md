Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Keep hook dependencies referentially stable"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/suite/useLayout.tsx:8-10`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useLayout.tsx#L8-L10)

Root cause is in every call site, since none of them memoize the header/footer element they pass, e.g.:

- [`packages/suite/src/views/dashboard/index.tsx:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/index.tsx#L17)
- [`packages/suite/src/components/settings/SettingsLayout.tsx:90`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/settings/SettingsLayout.tsx#L90)
- [`packages/suite/src/views/earn/index.tsx:6`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/earn/index.tsx#L6)
- [`packages/suite/src/views/wallet/trading/common/TradingLayout/useTradingPageHeader.tsx:77`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/trading/common/TradingLayout/useTradingPageHeader.tsx#L77)

Provider that receives the payload and spreads it into its own JSX:
[`packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx:102-103,129`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx#L102-L103)

## Before

```tsx
// packages/suite/src/hooks/suite/useLayout.tsx
export const useLayout = (title?: string, layoutHeader?: ReactNode, layoutFooter?: ReactNode) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, layoutHeader, layoutFooter });
    }, [setLayout, title, layoutHeader, layoutFooter]);
};
```

Every call site passes a freshly created element:

```tsx
// packages/suite/src/views/dashboard/index.tsx:17
useLayout('Home', <PageHeader />, <DashboardFooter />);
```

`SuiteLayout.tsx` holds the payload in state and spreads it into its own JSX. `children` (the routed
page that just called `useLayout`) is passed through as a prop and is shielded from this re-render;
its siblings are not:

```tsx
// packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx
const [{ title, layoutHeader, layoutFooter }, setLayoutPayload] =
    useState<LayoutContextPayload>({});
...
<LayoutContext.Provider value={setLayoutPayload}>
    <Body data-testid="@suite-layout/body">
        <Columns>
            <Sidebar />
            <MainContent>
                {!isBelowTablet && <CoinjoinBars />}
                <SuiteBanners />
                <AppWrapper data-testid="@app" ref={scrollRef}>
                    {layoutHeader}
                    <ContentContainer ...>{children}</ContentContainer>
                    {layoutFooter}
                </AppWrapper>
            </MainContent>
        </Columns>
    </Body>
</LayoutContext.Provider>
```

## After

A `ReactNode` is a plain object, so it needs the same treatment as any other inline object literal
crossing a hook boundary — memoize it at the call site instead of passing it fresh:

```tsx
// packages/suite/src/views/dashboard/index.tsx
import { useMemo } from 'react';
...
export const Dashboard = () => {
    const header = useMemo(() => <PageHeader />, []);
    const footer = useMemo(() => <DashboardFooter />, []);

    useLayout('Home', header, footer);
    useNotificationForDisconnectedDevice();
    ...
```

`useLayout` itself cannot fix this — it receives the element already-fresh and has no way to
deduplicate a `ReactNode` it did not create.

## Why it matters

Every render of a page component that calls `useLayout` with inline JSX recreates the header/footer
element, so the effect's dependency array sees a new reference and `setLayoutPayload` fires again —
for example on a fiat-rate tick on the dashboard, or a keystroke that re-renders a form page. None of
`SuiteLayout`'s own direct JSX children (`Sidebar`, `SuiteBanners`, `ModalSwitcher`,
`DiscoveryProgress`, `PowerMonitorManager`, `CoinjoinBars`, `GuideButton`, `AddPassphraseWalletFlow`,
`SwitchDeviceLayer`, `Metadata`) are wrapped in `memo()`, so all of them re-run their own render bodies
— including their own selectors and hooks, such as `Sidebar`'s accounts list — on every one of those
refires. The routed page itself is shielded by the standard `children`-as-a-prop pattern, so this is
not a loop, but it turns "this page re-rendered" into "the whole chrome re-rendered" on nearly every
route in the app.

## Notes

- Compile requirement: `dashboard/index.tsx` currently has no `'react'` import at all; the fix adds
  `import { useMemo } from 'react';`. The same per-call-site change is needed at every `useLayout(...)`
  call site that passes JSX — about 16 of the ~19 total call sites in the repo.
  [`views/connect-popup/index.tsx:6`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/connect-popup/index.tsx#L6)
  passes `null`, and
  [`views/suite/bridge-deprecated/index.tsx:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/suite/bridge-deprecated/index.tsx#L18)/[`bridge-requested/index.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/suite/bridge-requested/index.tsx#L41)
  pass no header/footer argument at all, so those three are already stable and don't need touching.
- Cheaper, centralized complementary fix worth doing in the same PR: wrap `SuiteLayout.tsx`'s direct
  JSX children other than `children` in `memo()`. That bounds the re-render to a shallow prop-equality
  check at each of those boundaries without depending on every current and future `useLayout` call
  site remembering to memoize its header/footer. It does not by itself stop the `useEffect` from
  refiring — the fix above is still required to eliminate that — but it stops the refire from
  cascading into each child's own render body.
- This is `packages/suite`, not React-Compiler-covered (native's `experiments.reactCompiler: true`
  only applies to `suite-native`), so manual `useMemo` is the correct and only mechanism here.
- Same file, separate defect, not fixed here: `SuiteLayout.tsx:113`'s
  `ScrollContext.Provider value={{ scrollRef, topOffset }}` is also an unmemoized Provider value
  (sibling draft p1-07, not yet filed).
- `Sidebar` renders the accounts list via `AccountsMenu`
  (`packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/Sidebar.tsx:15`), the same
  subtree covered by a separate, independent Provider-value defect (sibling draft p1-02, not yet
  filed) — the two compound but neither depends on the other being fixed.
- Honest sizing: every page in the app calls `useLayout`, so despite each individual call-site fix
  being a one-line `useMemo`, this is the widest-reaching finding in this scan file.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
