# Scan area 05 — packages/suite/src/views (rest) + packages/suite/src/support

Area: `packages/suite/src/views/**` except `views/wallet` (dashboard, settings, onboarding, suite,
earn, firmware, backup, recovery, view-only, password-manager, start, connect-popup — 250 files) plus
`packages/suite/src/support/**` (34 files: Preloader-adjacent app shell, connect-popup bridges,
router/theme/intl/responsive providers, event listeners). Verified against `issues/perf-react-hooks`
@ `9e0d5b6a45`. Web/desktop, not React-Compiler-covered — manual memoization findings are valid
throughout.

Excluded per the agent brief / `PROGRESS.md` (skipped as exact defects, not re-filed below):
`perf-issues/asymptotic-complexity/p2-26-transactionsselectors-selectanyaccountisstakingactive.md`
already covers `selectAnyAccountIsStakingActive`'s array-argument memo-key problem and the
`AssetsView.tsx:156` loop-invariant `stakingAccounts` hoist (see F-05-2's relationship note — that
doc's fix does not fully resolve the broader memo-defeat this file reports separately).
`perf-issues/react-hooks/_scan/01-suite-hooks.md` F-01-6 already covers `useTotalFiatBalance.ts`
being unmemoized, citing `WalletInstance.tsx:69` (this area) as one of its two call sites — not
re-filed. `01-suite-hooks.md` F-01-1 already covers the sibling `LayoutContext.Provider` (in
`hooks/suite/useLayout.tsx`, not this area) being an unmemoized value with many consumers — the
context _declaration_ lives in `support/suite/LayoutContext.ts` (this area) but carries zero logic,
so nothing to add there. `02-suite-components.md` F-02-9 already covers `AccountName.tsx`'s own
`exhaustive-deps` suppression (a ref-staleness bug, different mechanism from this doc's F-05-8, which
is about the Provider's inline value object).

---

## F-05-1 — `ResponsiveContext.tsx`'s Provider value is a fresh object every render, re-rendering the entire app shell on every pixel of sidebar/window resize

- **Class:** 5 (missing memoization on a context Provider value, many consumers)
- **Where:** `packages/suite/src/support/suite/ResponsiveContext.tsx:75-92` (the
  `ResponsiveContextProvider` component); consumed via `useResponsiveContext()` in 14+ files across
  `components/wallet/WalletLayout/AccountsMenu/*`, `components/suite/layouts/SuiteLayout/*`
  (`Sidebar.tsx`, `Navigation.tsx`, `NavigationItem.tsx`, `DeviceSelector.tsx`,
  `SidebarDeviceStatus.tsx`, `ExpandedSidebarOnly.tsx`, `CollapsedSidebarOnly.tsx`,
  `useResponsiveContextOnChange.tsx`), `components/guide/GuideRouter.tsx`, and this area's own
  `support/suite/ContentFlex.tsx` / `ConditionalRender.tsx`. Mounted once at the app root
  (`support/suite/Main.tsx:36`, inside `<ConnectedThemeProvider>`, wrapping every route for the whole
  session).
- **Trigger cadence:** every pointer-move event while the user drags the sidebar's resize handle
  (`components/suite/layouts/SuiteLayout/Sidebar/Sidebar.tsx:179` —
  `onWidthResizeMove={handleSidebarWidthUpdate}` calls `setSidebarWidth` on every move tick of the
  drag), and on every debounced `ResizeObserver` tick of the main content area
  (`components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:33,39` —
  `setContentWidth`). Also on `setAutoCollapsed`/`setForcedSidebarWidth`/`setUserResizingSidebar`/
  `setAutoCollapseSuppressed`, all called from `Sidebar.tsx`'s resize lifecycle.
- **Severity guess:** P1 — hottest finding in this area. The Provider wraps literally the whole app
  for the whole session (support/ mounts app-wide per this sweep's brief), the trigger is a
  continuous high-frequency pointer interaction (not a rare event), and the fan-out is 14+ files
  including the sidebar, navigation, account list rows, and device selector — every one of them
  re-renders on every drag tick regardless of which single field it actually reads.
- **Confidence:** high — read the Provider, confirmed no `useMemo` wraps `value`; confirmed the
  consumer count via `grep -rl useResponsiveContext`; confirmed `setSidebarWidth`/`setContentWidth`
  are wired to continuous-motion handlers (`onWidthResizeMove`, a debounced `ResizeObserver`), not
  one-shot events.

### Before (verbatim from the file)

```tsx
// packages/suite/src/support/suite/ResponsiveContext.tsx
export const ResponsiveContextProvider = ({ children }: { children: React.ReactNode }) => {
    const sidebarWidthFromRedux = useSelector(selectSidebarWidth);
    const dispatch = useDispatch();
    const initialSidebarWidth = normalizePersistedSidebarWidth(sidebarWidthFromRedux);

    const [sidebarWidthManual, setSidebarWidthManual] = useState<number>(initialSidebarWidth);
    const [sidebarWidthRaw, setSidebarWidthRaw] = useState<number>(initialSidebarWidth);
    const [forcedSidebarWidth, setForcedSidebarWidth] = useState<number | undefined>(undefined);
    const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);
    const [autoCollapsed, setAutoCollapsed] = useState<boolean>(false);
    const [userResizingSidebar, setUserResizingSidebar] = useState<boolean>(false);
    const [autoCollapseSuppressed, setAutoCollapseSuppressed] = useState<boolean>(false);
    // ...effectiveWidth/isSidebarCollapsed useMemo'd correctly...

    const setSidebarWidth = (width: number) => {
        /* ... */
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
};
```

Note that `effectiveWidth` and `isSidebarCollapsed` _are_ correctly `useMemo`'d a few lines above
(`:52-60`) — the component clearly has memoization awareness, it just wasn't applied to the object
that actually matters (the Provider `value` itself, which wraps them and 12 other fields in a fresh
literal).

### Proposed fix

Wrap `value` in `useMemo`, depending on all 14 fields (or split the context into two — a rarely-
changing "capabilities" context and a frequently-changing "dimensions" context — if per-field
granularity is wanted later, but a single `useMemo` is the immediate, low-risk fix):

```tsx
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
        sidebarWidthManual,
        forcedSidebarWidth,
        isSidebarCollapsed,
        contentWidth,
        autoCollapsed,
        userResizingSidebar,
        autoCollapseSuppressed,
    ],
);
```

The setters (`setSidebarWidth`, `setForcedSidebarWidth`, etc.) are plain closures redefined every
render too — `setSidebarWidth` should become a `useCallback`, the `useState` setters
(`setForcedSidebarWidth` etc.) are already stable by React's contract.

### Why it matters

Every consumer of `useResponsiveContext()` re-renders whenever _any_ field changes, because the
context value's reference changes as a whole. During a sidebar drag or a window resize, that's
dozens of re-renders per second propagated to the sidebar itself, every navigation item, the account
list, the device selector, and the guide router — most of which only read one field (e.g.
`isSidebarCollapsed`) that may not even have changed on that particular tick.

---

## F-05-2 — `AssetsView.tsx` builds every prop of `AssetRow`/`AssetCard` fresh on every render, so `AssetRow`'s `memo()` wrap is comprehensively defeated on the dashboard's hot path

- **Class:** 4 (render-body work that belongs elsewhere) + 5 (unstable props defeating a `memo()`'d
  child)
- **Where:** `packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:110-165` (the `assets` /
  `assetSymbols` / `assetsData` construction, entirely inline in the render body, no `useMemo`
  anywhere in this component) and `:167-172` (`useAssetsFiatBalances(...)`, a plain function called
  directly in render, not a real hook — it calls no hooks itself); consumed by
  `AssetTable.tsx:49-63` (`assetsData.map(...)` spreading fresh props onto `<AssetRow memo .../>`)
  and `AssetCard.tsx:78-90` (same shape, though `AssetCard` itself isn't `memo()`'d so this half is
  moot). `AssetRow` is `memo()`-wrapped at `AssetTable/AssetRow.tsx:48`.
- **Trigger cadence:** every render of `AssetsView` — driven by `useSelector(selectAllAccountsToList)`,
  `useDiscovery()`/`isDiscoveryRunning`, `useSelector(selectDiscoveryOverallStatus)`,
  `useSelector(selectCurrentFiatRates)`, all of which change during active discovery/sync (the
  scenario this sweep's brief calls out as the dashboard's heaviest dispatch traffic).
- **Severity guess:** P1 — this is the dashboard's main asset table/card grid, exactly the component
  the brief flags as rendering during discovery, and the memo wrap around each row is currently
  providing close to zero protection.
- **Confidence:** high on the mechanism for `assetTokens` and `assetsFiatBalances` specifically (read
  both computations, confirmed no memoization anywhere in the chain, confirmed `getNetwork()` at
  least _is_ reference-stable so `network` isn't also a culprit, confirmed `selectAllAccountsToList`
  is a `createMemoizedSelector` so the `accounts` field is stable). Medium on total real-world
  render-storm size since I did not profile it.

### Relationship to `perf-issues/asymptotic-complexity/p2-26`

`p2-26` already documents that `AssetsView.tsx:156`'s `stakingAccounts: accounts.filter(...)` is a
loop-invariant fresh array feeding `selectAnyAccountIsStakingActive`'s memo, and proposes hoisting it
plus memoizing `stakingAccountsForAsset` in `AssetRow`/`AssetCard`. That fix is real but **narrower
than the actual defect**: `AssetRow` is `memo()`-wrapped, and `memo()` does a shallow comparison of
_every_ prop — fixing only `stakingAccounts` still leaves `assetTokens` (built via a fresh
`.reduce()` per asset, below) and `assetsFiatBalances` (a fresh array from a plain function call,
shared across siblings but new every `AssetsView` render) as independently-fresh props. Either one
alone is sufficient to defeat the whole memo. This finding is scoped to those remaining fields, which
`p2-26`'s fix does not touch.

### Before (verbatim from the file)

```tsx
// AssetsView.tsx:92 (component start) ... 110-165 (relevant excerpt)
const assets: PartialRecord<NetworkSymbol, Account[]> = {};
accounts.forEach(account => { /* groups accounts by symbol into `assets`, fresh object every render */ });

const assetSymbols = typedObjectKeys(assets).filter(symbol => isNetworkSymbol(symbol));

const assetsData: AssetData[] = assetSymbols.map((symbol): AssetData => {
    const network = getNetwork(symbol);
    // ...
    const assetTokens = assets[symbol]?.reduce((allTokens: TokenInfo[], account) => {
        if (account.tokens) {
            allTokens.push(...account.tokens);
        }

        return allTokens;
    }, []);

    const assetFailed = accounts.find(f => f.symbol === network.symbol && f.failed);

    return {
        network,
        failed: !!assetFailed,
        assetNativeCryptoBalance: /* ... */,
        assetTokens: assetTokens?.length ? assetTokens : [],
        stakingAccounts: accounts.filter(/* p2-26's territory */),
        accounts,               // stable — passthrough of the memoized selector result
        isStakeNetwork: getNetworkFeatures(symbol).includes('staking'),
    };
});

const assetsFiatBalances = useAssetsFiatBalances(assetsData, assets, baseCurrencyCode, currentFiatRates);
// useAssetsFiatBalances (line 72-90) is a plain `.reduce()` — not a hook, calls no hooks, allocates
// a fresh array on every call
```

```tsx
// AssetTable.tsx:49-63 — spreads the fresh assetTokens/assetsFiatBalances straight onto memo(AssetRow)
{
    assetsData.map((asset, i) => (
        <AssetRow
            key={asset.network.symbol + i}
            assetTokens={asset.assetTokens}
            stakingAccounts={asset.stakingAccounts}
            assetsFiatBalances={assetsFiatBalances}
            accounts={asset.accounts}
            /* ...+ 5 more props... */
        />
    ));
}
```

### Proposed fix

Wrap the `assets` / `assetSymbols` / `assetsData` pipeline in a single `useMemo` keyed on
`[accounts]` (everything downstream — `getNetwork`, `getNetworkFeatures`, `isSupported*StakingNetworkSymbol`
— is a pure function of `accounts` plus static config), and wrap `useAssetsFiatBalances`'s call site
(or the hook itself) similarly, keyed on `[assetsData, assets, baseCurrencyCode, currentFiatRates]`.
With `assetsData` itself memoized, `asset.assetTokens` and `asset.accounts` become stable references
across renders where `accounts` hasn't changed, which is the common case during a discovery tick that
only touches one account.

### Why it matters

`AssetRow` (table view) is explicitly `memo()`-wrapped specifically to avoid re-rendering every asset
row when unrelated state changes — but because `AssetsView` hands it a brand-new `assetTokens` array
and a brand-new shared `assetsFiatBalances` array on every single render, that memo currently never
holds. Every fiat-rate tick or account-sync tick during discovery re-renders every asset row in full,
which is precisely the scenario this sweep was asked to weight heavily.

---

## F-05-3 — `AssetCoinLogo` recomputes the whole portfolio's percentage breakdown once per asset row/card instead of once per table

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/views/dashboard/AssetsView/AssetCoinLogo.tsx:26-29`; rendered once
  per row from both `AssetTable/AssetRow.tsx` (table view) and `AssetCard/AssetCardInfo.tsx:18-22`
  (card view) — i.e. every asset on the dashboard, in either view mode.
- **Trigger cadence:** every render of every `AssetCoinLogo` instance, which is every render of its
  parent row/card (see F-05-2 — currently every `AssetsView` render, once memoized there will still
  be at least once per genuine asset-list change).
- **Severity guess:** P2 — real and scales quadratically with the number of enabled assets (each of
  N rows recomputes percentages for all N assets, i.e. O(N²) work per table render instead of O(N)),
  but the practical N (distinct networks with a visible balance) is usually small enough that this is
  "real but colder" rather than an immediate hot-path fire.
- **Confidence:** high that the recomputation is unmemoized and repeated per row; medium on
  real-world cost since `calculateAssetsPercentage`'s own complexity wasn't profiled.

### Before (verbatim from the file)

```tsx
export const AssetCoinLogo = ({ symbol, assetsFiatBalances, index }: AssetCoinLogoProps) => {
    const locale = useSelector(selectLanguage);
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);

    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;
    // ...
};
```

### Proposed fix

Move `calculateAssetsPercentage(assetsFiatBalances)` up one level — compute it once in
`AssetsView`/`AssetTable` (memoized on `[assetsFiatBalances]`) and pass each row its own
`percentageShare: number | undefined` directly, instead of passing the whole `assetsFiatBalances`
array down to every row for it to re-derive and re-search.

### Why it matters

Not currently flagged by the asymptotic-complexity audit (checked — no hit for
`calculateAssetsPercentage`/`AssetCoinLogo`). The fix is a relocation, not an algorithm change, which
is why it's reported here rather than there.

---

## F-05-4 — `PinStep.tsx`'s status-detection effect depends on the whole `device` object, so it can re-fire `goToNextStep()` on unrelated device updates after PIN setup already succeeded

- **Class:** 1 (unstable/wider-than-necessary hook dependency) with a class-2 flavor (the effect
  dispatches a step-advance action, not just a wasted memo)
- **Where:** `packages/suite/src/views/onboarding/steps/PinStep.tsx:49-70`
- **Trigger cadence:** every store update that gives the currently-onboarding `device` a fresh object
  reference (any feature/state field changing, not just `buttonRequests`/`features.pin_protection`)
  while `PinStep` is still mounted — which includes the window between `goToNextStep()` being
  dispatched and the parent's `activeStepId`-keyed `useMemo`
  (`packages/suite/src/views/onboarding/index.tsx:56-88`) actually swapping the rendered step
  component out.
- **Severity guess:** P2 — a real, if narrow-window, wrong-dependency bug in a flow every onboarding
  user passes through once; not P1 because the window during which `PinStep` stays mounted after
  success is normally short.
- **Confidence:** medium — high confidence the dependency is provably wider than what the body reads
  (`device.buttonRequests`, `device.features.pin_protection`); medium on whether `goToNextStep()`
  and/or the onboarding step reducer are idempotent against being dispatched multiple times in a row
  for the same transition (did not trace that reducer) — if they are, this degrades to wasted work
  rather than a skip-ahead bug.

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (device?.features) {
        const buttonRequests = device.buttonRequests.map(r => r.code);
        if (buttonRequests.includes('PinMatrixRequestType_NewFirst')) {
            if (buttonRequests.includes('PinMatrixRequestType_NewSecond')) {
                setStatus('repeat-pin');
            } else {
                setStatus('enter-pin');
            }
        }

        if (device?.features.pin_protection) {
            setStatus('success');
            goToNextStep();
        }
    }
}, [device, goToNextStep]);
```

### Proposed fix

Derive the three booleans the body actually branches on in the render body (already reading
`device.buttonRequests`/`device.features` there anyway) and depend on those primitives instead of
`device`:

```tsx
const hasNewFirst = !!device?.buttonRequests.some(r => r.code === 'PinMatrixRequestType_NewFirst');
const hasNewSecond = !!device?.buttonRequests.some(
    r => r.code === 'PinMatrixRequestType_NewSecond',
);
const hasPinProtection = !!device?.features?.pin_protection;

useEffect(() => {
    if (!device?.features) return;
    if (hasNewFirst) setStatus(hasNewSecond ? 'repeat-pin' : 'enter-pin');
    if (hasPinProtection) {
        setStatus('success');
        goToNextStep();
    }
}, [device?.features, hasNewFirst, hasNewSecond, hasPinProtection, goToNextStep]);
```

(`device?.features` alone, as a presence check, is still acceptable here since the guard is boolean;
narrowing further isn't necessary once the two content-bearing conditions are primitives.)

### Why it matters

Nothing in this effect guards against re-invoking `goToNextStep()` once `status` is already
`'success'`. As written, every device-reference churn while `pin_protection` remains `true` calls
`goToNextStep()` again for as long as `PinStep` stays mounted, which — if the onboarding step
reducer isn't itself idempotent against repeat "advance" dispatches — risks skipping past the
following step during exactly the frequent-device-update window that PIN setup itself creates.

---

## F-05-5 — `onboarding/index.tsx`'s THP redirect effect depends on `device`, which the effect body never reads

- **Class:** 1 (unstable/dead hook dependency)
- **Where:** `packages/suite/src/views/onboarding/index.tsx:37-41`
- **Trigger cadence:** every store update that gives the onboarding `device` a fresh reference while
  `activeStepId !== STEP.ID_FIRMWARE_STEP && thpStep === 'ConfirmOnlyConnection'` holds (i.e. while
  waiting on a THP-only-connection confirmation outside the firmware step).
- **Severity guess:** P3 — the dependency is provably dead (not referenced in the body at all), but
  the guarded action is `dispatch(goto({ routeName: 'suite-index' }))`, which is very likely a no-op
  once already on that route, so the realistic cost is a handful of redundant dispatches rather than
  a visible loop.
- **Confidence:** high that `device` is unused in the effect body (only `activeStepId`/`thpStep` are
  read); low-to-medium on real severity since I did not trace whether the router thunk short-circuits
  a `goto` to the current route.

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (activeStepId !== STEP.ID_FIRMWARE_STEP && thpStep === 'ConfirmOnlyConnection') {
        dispatch(goto({ routeName: 'suite-index' }));
    }
}, [device, thpStep, activeStepId, dispatch]);
```

### Proposed fix

Drop `device` from the dependency array — it isn't read anywhere in the effect.

### Why it matters

Listed for completeness: a dead dependency here means the effect re-runs (and re-evaluates the
condition, redispatching `goto` if still true) on every device-reference churn instead of only when
`activeStepId`/`thpStep` actually change, for no benefit.

---

## F-05-6 — `NotificationsView` re-filters the whole notification list into two buckets on every render

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/views/suite/notifications/index.tsx:27-32`
- **Trigger cadence:** every render of the Activity/Notifications page (tab switches, debug-mode
  toggle, any `notifications` state change) — both `.filter()` calls run regardless of which tab is
  active or whether `notifications` itself changed.
- **Severity guess:** P3 — `NotificationGroup` (the consumer) isn't `memo()`-wrapped, so there's no
  memo being defeated, and this page is visited occasionally rather than being an always-mounted
  hot path; the notification list does grow over a long session, but the recompute is a single-pass
  filter, not a nested scan.
- **Confidence:** high that both filters are unmemoized; low confidence this is worth prioritizing
  over other findings in this file — included for completeness since it matches the class cleanly and
  the fix is a one-line `useMemo`.

### Before (verbatim from the file)

```tsx
const notifications = useSelector(state => state.notifications);
const hasUnseenNotifications = useSelector(selectHasUnseenTransactionNotifications);
const transactionNotifications = notifications.filter(isTransactionNotification);
const activityNotifications = notifications.filter(
    notification => !isTransactionNotification(notification),
);
```

### Proposed fix

`const { transactionNotifications, activityNotifications } = useMemo(() => ({ transactionNotifications: notifications.filter(isTransactionNotification), activityNotifications: notifications.filter(n => !isTransactionNotification(n)) }), [notifications]);`

### Why it matters

Minor — grouped here because it is a clean instance of the class and cheap to fix, not because it is
a hot path.

---

## F-05-7 — `useConnectPopupDesktop` hand-rolls `useFreshRef` instead of using the existing helper

- **Class:** 7 (wrong ref hook / manual ref-assign-in-render pattern that should be one of the
  helpers — the "reverse" case the skill names explicitly)
- **Where:** `packages/suite/src/support/suite/useConnectPopupDesktop.tsx:34-36`
- **Trigger cadence:** N/A — this is a style/consistency finding, not a bug. The ref is read inside an
  async event-listener callback (`desktopApi.on('connect-popup/call', async params => { ... const
device = selectedDeviceRef.current; ... })`) registered once inside a `useEffect`, which needs the
  _latest_ device at call time — exactly `useFreshRef`'s contract.
- **Severity guess:** P3 (cleanup) — behaviorally correct as written (assignment happens
  unconditionally in the render body, so `.current` is always fresh), just not using the sanctioned
  helper.
- **Confidence:** high — `packages/react-utils/src/hooks/useFreshRef.ts` does exactly this pattern
  (assign during render).

### Before (verbatim from the file)

```tsx
const selectedDevice = useSelector(selectSelectedDevice);
const selectedDeviceRef = useRef(selectedDevice);
selectedDeviceRef.current = selectedDevice;
```

### Proposed fix

`const selectedDeviceRef = useFreshRef(selectedDevice);` (import from `@trezor/react-utils`).

### Why it matters

No functional difference today, but hand-rolling the pattern means a future edit (e.g. someone
"cleaning up" by moving the assignment into a `useEffect`) would silently change it into the
`useCurrentRef` shape and introduce a one-render staleness bug — using the named helper makes the
intent self-documenting and removes that risk.

---

## F-05-8 — `AccountHeaderProvider`'s inline Provider value is rebuilt every render

- **Class:** 5 (missing memoization on a context Provider value)
- **Where:** `packages/suite/src/support/suite/AccountHeaderProvider.tsx:22`; consumed by
  `AccountName.tsx` (via `useOptionalAccountHeaderContext`) and
  `views/wallet/transactions/components/AccountOverviewBalance.tsx:56` (via
  `useAccountHeaderContext`), both mounted for the wallet page's header — provider itself instantiated
  per-wallet-page-render from `components/wallet/WalletLayout/WalletLayout.tsx:23,90`.
- **Trigger cadence:** every render of `WalletLayout`/`WalletPageHeader` (essentially every account
  view render), even though the wrapped `balanceSectionRef` is a stable `useRef` that never itself
  changes identity.
- **Severity guess:** P3 — same mechanism as F-05-1, but only two real consumers (not "many"), and
  one of them (`AccountName`) only reads through `.current` inside an effect dependency rather than
  reacting to the object identity directly, so the practical churn cost is much smaller.
- **Confidence:** high on the mechanism; low on real-world visible cost given the small consumer
  count and their low render cost.

### Before (verbatim from the file)

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

### Proposed fix

`const value = useMemo(() => ({ balanceSectionRef }), [balanceSectionRef]);` then
`<AccountHeaderContext.Provider value={value}>`.

### Why it matters

Cheap, correct fix for the same class of bug as F-05-1, at much smaller scale — included so the
pattern is caught here rather than only at the one file where it happens to matter a lot.

---

## Checked, clean

- `packages/suite/src/support/suite/useConnectPopup.tsx:152` — the `eslint-disable
react-hooks/exhaustive-deps` suppressing `onMessagesConsumed` looked like a Class-6 candidate (C1
  harvest), but both call sites (`useConnectPopupWeb.tsx:57-59`, `useConnectPopupWebextension.tsx:63-65`)
  pass a `useCallback(() => setIncomingMessages(prev => prev.slice(1)), [])` — a genuinely stable,
  never-changing reference. Per the skill's own guidance ("confirm the dependency is genuinely
  unstable at its declaration first"), omitting a provably-stable dependency doesn't hide any
  staleness here. Good contrast case for F-05-7/Class 7's "reverse" pattern — this one is a
  correctly-inert suppression, not a lying array.
- `packages/suite/src/support/suite/useConnectPopupDesktop.tsx:40-165` (main init effect) — deps
  `[dispatch, analytics, lifecycle.status]`; registers/cleans up `desktopApi.on(...)` listeners each
  run, cleanup always runs before the next registration. No stacking-listener or loop risk found.
- `packages/suite/src/support/suite/RouterHandler.tsx`, `Protocol.tsx`, `Resize.tsx`,
  `OnlineStatus.tsx`, `Autodetect.tsx`, `ConnectedIntlProvider.tsx`, `ConnectedThemeProvider.tsx`,
  `ThemeProvider.tsx`, `ErrorBoundary.tsx`, `useTor.tsx`, `useTorReconnectionLifecycle.ts`,
  `useConnectPopupModals.tsx`, `useConnectPopupWeb.tsx`, `useConnectPopupWebextension.tsx`,
  `ConditionalRender.tsx`, `ContentFlex.tsx` — all effects/memos/callbacks keyed on primitives or
  provably-stable refs/DI services; `Protocol.tsx` in particular is a clean worked example of wrapping
  handlers in `useCallback` before depending on them. `extraDependencies.ts`,
  `createConnectInitHooks.ts`, `createConnectLoggerFactory.ts`, `createGetBinFilesBaseUrl.ts`,
  `preloadStore.ts`, `screens/*`, `styles/*`, `test-utils/*` — zero React hooks in any of these;
  nothing in this skill's scope to check.
- `packages/suite/src/support/suite/LayoutContext.ts` — just a `createContext` type + no-op default,
  zero logic; the actual unmemoized-Provider-value bug for this context is in `hooks/suite/useLayout.tsx`
  (area 01's territory, already filed as F-01-1).
- `packages/suite/src/views/dashboard/AssetsView/AssetActionButton.tsx:36` — `accounts.find(...)` runs
  only inside a click handler (`onClick`), not the render body; not a render-loop concern.
- `packages/suite/src/views/dashboard/PortfolioCard/PortfolioCard.tsx` — exemplary: `memo()`-wrapped,
  `isDeviceEmpty`/`failedAccounts`/`hasLoadedNonEmptyAccount` all correctly `useMemo`'d on `[accounts]`.
- `packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx` — main effect
  (`:94-114`, deps `[graph, selectedDeviceState]`) legitimately needs several fields of `graph`
  (`.isLoading`, `.selectedRange.label/startDate/endDate`), so depending on the container object is
  the idiomatic choice, not a bug. `failedAccounts = graph.error?.filter(...)` at `:61` is unmemoized
  but bounded by the (usually zero) count of sync-failed accounts — too small/cold to be worth a
  separate finding.
- `packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:83` (`accounts[asset.network.symbol]
?? []`) and `assetsViewUtils.ts:29,34` (`?? []` fallbacks) — both fallbacks are read once inline,
  not stored across renders or fed into a memo/effect dependency; not a Class-1 instance, and already
  covered as part of F-05-2's broader "this whole pipeline needs one `useMemo`" fix.
- `packages/suite/src/views/dashboard/OnboardingFeedbackBanner/OnboardingFeedbackBanner.tsx`,
  `AssetCoinName.tsx`, `AssetCoinLogo.tsx` (aside from F-05-3), `DashboardFooter.tsx`,
  `BannerCarousel.tsx` (previous-index tracking is a plain `useRef` mutated inside a click handler and
  reset inside an effect — correct pattern, not a Class-7 candidate), `EmptyWallet.tsx`,
  skeleton components — no unstable deps or unmemoized unbounded-list scans found.
- `packages/suite/src/views/suite/SwitchDevice/DeviceItem/DeviceItem.tsx:60`
  (`instances.filter(i => i.state)`) and `AddWalletButton.tsx:28` (`instances.find(...)`) — both
  render-body list ops, but `instances` (hidden-wallet count per physical device) doesn't meet the
  "unbounded/user-scaling" bar; `DeviceItem`'s own effect (`:62-79`) already depends on narrow
  primitives (`device.id`, `device.connected`), a good contrast to F-05-4.
- `packages/suite/src/views/suite/SwitchDevice/DeviceItem/WalletInstance.tsx:67,69`
  (`getAllAccounts(instance.state, accounts)` fed into `useTotalFiatBalance`) — already covered by
  area 01's F-01-6, which explicitly names this call site.
- `packages/suite/src/views/suite/SwitchDevice/DeviceItem/DeviceStatusTextThp.tsx:47-56` — effect
  keyed on `[isLoading]`, a derived boolean primitive; correct.
- `packages/suite/src/views/suite/SwitchDevice/SwitchDevice.tsx`, `SwitchDeviceModal.tsx`,
  `SmallDeviceItem.tsx`, `bridge/index.tsx` — plain, non-derived `useSelector` reads only, no
  effects/memos to check.
- `packages/suite/src/views/suite/bridge-requested/index.tsx:26-33` — `goToWallet` is a
  `useCallback(..., [dispatch])`; effect deps `[popupCall, goToWallet]` — `popupCall` comes straight
  from a plain state-slice selector, not a derived one; no evidence of over-triggering found.
- `packages/suite/src/views/onboarding/steps/BackupTypeStep.tsx:57-61`, `DeviceTutorialStep.tsx:19-21`,
  `earn/tron/EarnTronRedirect.tsx`, `earn/yield/unwrap/index.tsx`, `earn/yield/wrap/index.tsx`,
  `earn/yield/useEarnLayout.tsx:168-192` — all effects keyed on primitives/stable callbacks; no
  wide-object or fresh-array dependencies found.
- `packages/suite/src/views/onboarding/steps/DeviceAuthenticityStep/SecurityCheck.tsx:193-199` —
  `humanizedModelColor = useMemo(..., [device])` is wider than needed (only reads
  `device.features.internal_model`/`.unit_color`), but the memoized work is an O(1) object-lookup
  chain — per the skill, not worth its own finding outside a batch cleanup doc. Same file's other
  effect (`:185-191`) is correctly narrow.
- `packages/suite/src/views/onboarding/steps/FirmwareStep/FirmwareInitialStep.tsx:122-123` and
  `packages/suite/src/views/firmware/Steps/StepInitial.tsx:33-34` (`devices.filter(d =>
d?.connected)` + `unique(...).length`) — `devices` is bounded by physical-device count (typically
  1-3), not unbounded/user-scaling; too cold/small for a finding.
- `packages/suite/src/views/settings/SettingsCoins/SettingsCoins.tsx`,
  `SettingsCoins/useNetworkSettingsSearch.ts` — `allSearchableNetworks` correctly `useMemo`'d with a
  narrow dep list; the four `filterNetworks(...)` calls in the render body operate on the fixed
  Trezor-supported-coin list (~30-60 items, not user-scaling) — below the Class-4 bar.
- `packages/suite/src/views/settings/SettingsGeneral/{DustPhishing,Experimental,BaseCurrency,Language,
AutoStart,ShowOnTray,McpServer}.tsx`, `SettingsDevice/{ChangeLanguage,ForgetDevice/ForgetDeviceModal,
ForgetDevice/UnplugDeviceModal}.tsx`, `SettingsConnectedApps/SettingsConnectedApps.tsx`,
  `SettingsDebug/{Backends,CoinjoinApi}.tsx` — all effects/memos have narrow, stable, or provably-
  bounded dependencies. Two good worked examples worth naming: `DustPhishing.tsx:23-25`
  (`useEffect(() => setDustThreshold(dustPhishingThreshold), [dustPhishingIsEnabled,
dustPhishingThreshold])`) is the correct "sync local editable copy when the source of truth
  changes" pattern; `SettingsConnectedApps.tsx:36-40` depends on `tabs.length` rather than the fresh
  `tabs` array itself, exactly the primitive-narrowing the skill recommends.
  `ForgetDeviceModal.tsx:76-88`'s `if (initialDeviceStateRef.current === null) { ... }` guard is a
  deliberate "capture once, ever" pattern (not `useFreshRef`/`useCurrentRef` territory — those assign
  every render/effect; this assigns exactly once by design) — correct, not a Class-7 finding.
- `packages/suite/src/views/recovery/index.tsx:45` (`usePin(device?.buttonRequests ?? [], ...)`) —
  the `?? []` fallback crosses a hook boundary (matches the Class-1 harvest shape), but
  `usePinHook.ts`'s only effect depends on `buttonRequests.length` (a primitive), not the array
  itself, so the fresh reference never defeats anything. Confirmed by reading `usePinHook.ts:33-35`.
  Good example of the pattern being safe in this specific case.
- `packages/suite/src/views/view-only/**`, `password-manager/**`, `connect-popup/index.tsx`,
  `start/**`, `backup/**` — no `useEffect`/`useMemo`/`useCallback` at all (grep-confirmed); the few
  `useSelector` calls present are plain, non-derived state reads used only for conditional rendering.
  Nothing in this skill's scope to check.
- No inline `Provider value={{...}}` literal exists anywhere in this area besides
  `AccountHeaderProvider.tsx` (F-05-8) and `ResponsiveContext.tsx`'s variable-form value (F-05-1) —
  confirmed via `grep -rn "Provider value=" `across the whole area; `LayoutContext.ts` has no
  Provider at all (declared elsewhere, area 01's territory).
- No `react-hook-form` `watch()` call (bare or scoped) exists anywhere in this area — grep-confirmed
  across all `views/*` (non-wallet) and `support/*`; Class 2/2b/6-watch does not apply here.
- No `useFreshRef`/`useCurrentRef` call sites exist anywhere in this area (grep-confirmed) besides the
  one hand-rolled equivalent reported as F-05-7.
