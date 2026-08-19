# Scan area 02 — packages/suite/src/components/suite + small dirs

Area: `packages/suite/src/components/suite/**` (387 files) plus `components/{connection,guide,onboarding,
firmware,tx-simulation,backup,recovery,dashboard,settings}` (79 files). Verified against
`issues/perf-react-hooks` @ `9e0d5b6a45`. Web/desktop, not React-Compiler-covered — manual memoization
findings are valid throughout this area.

Excluded per `PROGRESS.md`: `TransactionsGraph.tsx` `setWidth`/`GraphYAxisTick` (#31137), `FiatValue`/
fiat-rate storm (#28880). Neither is re-filed below; other graph-dir defects are reported since the
exclusion is scoped to those two symbols only.

---

## F-02-1 — `CancelTransactionModal.tsx` recomposes the cancel tx on every unrelated account/tx refresh

- **Class:** 2 (effect refetch / render loop — silent, unbounded)
- **Where:** `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx:83-107`
  (+ co-anchors that manufacture the unstable props: `TxDetailModal.tsx:92-99` builds `tx` with
  `useMemo(..., [resolvedTx, filteredInternalTransfers])`, `TxDetailModal.tsx:109-114` builds
  `chainedTxs` with `useMemo(..., [tx, transactions])`, `TxDetailModal.tsx:101` selects
  `account` via `selectAccountByKey` (memoized in `suite-common/wallet-core/src/accounts/accountsSelectors.ts:123`
  on `[selectAccounts, accountKey]` — `selectAccounts` gets a fresh top-level array reference on
  _any_ account update, and for the account this modal is open on, that account's own object is
  exactly what's changing while a cancel is pending))
- **Trigger cadence:** every store update that gives the open account (or its pending tx) a fresh
  object reference — i.e. every relevant blockchain sync tick while this modal is open, not per
  render/keystroke
- **Severity guess:** P1 (hot for its scenario: an actively-monitored pending tx is by definition
  the record most likely to keep changing reference while the modal is open)
- **Confidence:** high — traced `account`/`tx`/`chainedTxs` back through `TxDetailModal.tsx` to
  their Redux sources; each is rebuilt whenever the underlying pending-tx/account record updates,
  which is the exact condition under which a user opens this modal

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (account.networkType === 'ethereum') return;
    if (tx.vsize === undefined) return;
    if (!isComposeCancelTransactionPartialAccount(account)) return;

    dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
        .unwrap()
        .then(precomposed => {
            setUtxoComposedCancelTx({ ...precomposed, rbfType: 'cancel', prevTxid: tx.txid });
            setUtxoCancelFormState({
                feeLimit: '', // Eth only
                feePerUnit: precomposed.feePerByte,
                hasCoinControlBeenOpened: false,
                isCoinControlEnabled: false,
                options: ['broadcast'],
                outputs: precomposed.outputs.map(output => ({
                    ...DEFAULT_PAYMENT,
                    ...output,
                    amount: output.amount.toString(),
                })),
                selectedUtxos: [],
            });
        })
        .catch(setUtxoError);
}, [account, tx, dispatch, chainedTxs]);
```

### Proposed fix

Depend on stable identifiers instead of the records: `account.key`, `tx.txid`, and something that
identifies the chained set (e.g. a joined list of txids, or `chainedTxs?.length` if only the count
matters for composition) — mirrors the skill's `AdaStakingDashboard.tsx:52` fix. Read `account`/`tx`/
`chainedTxs` fresh inside the effect body via a `useFreshRef` (or just re-select by key) rather than
closing over the possibly-stale outer values once the deps are narrowed.

### Why it matters

Every time the pending transaction's own record refreshes (new confirmation count, mempool update),
this effect redispatches `composeCancelTransactionThunk`, re-running UTXO selection/fee composition
for a cancel the user hasn't asked for again — while they're mid-review of a "cancel this stuck
transaction" screen. Matches the skill's canonical "silent and unbounded" shape exactly, just with
`composeCancelTransactionThunk` in place of the worked example's transaction fetch.

---

## F-02-2 — `AddTokenModal.tsx` re-fetches account info from the device on every account refresh

- **Class:** 2 (effect refetch / render loop — silent, unbounded, real device/network round-trip)
- **Where:** `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddTokenModal.tsx:71-75`
  (dispatcher: `loadTokenInfo`, `:34-69`, which calls `TrezorConnect.getAccountInfo`)
- **Trigger cadence:** every store update that gives `selectSelectedAccount` a fresh account
  reference, as long as the modal is open with a non-empty, currently-valid `contractAddress`
- **Severity guess:** P1 (the dispatched work is an actual `TrezorConnect.getAccountInfo` call, not
  just local computation)
- **Confidence:** high — `account` is the whole object from `useSelector(selectSelectedAccount)`;
  every other dep (`contractAddress`, `error`) is a primitive/string state value

### Before (verbatim from the file)

```tsx
const account = useSelector(selectSelectedAccount);
...
const loadTokenInfo = useCallback(
    async (acc: Account, contractAddress: string) => {
        if (!acc) return;
        setIsFetching(true);
        const response = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(acc.symbol),
            identity: tryGetAccountIdentity(acc),
            descriptor: acc.descriptor,
            details: 'tokenBalances',
            contractFilter: contractAddress,
            suppressBackupWarning: true,
            protocols: acc.networkType === 'ethereum' ? ['erc4626'] : undefined,
        });
        ...
    },
    [translationString],
);

useEffect(() => {
    if (account && !error && contractAddress) {
        loadTokenInfo(account, contractAddress);
    }
}, [account, contractAddress, error, loadTokenInfo]);
```

### Proposed fix

Depend on `account?.key` (or `descriptor`/`symbol`/`deviceState`) instead of `account`, and read the
current account inside the effect (via the already-available `useSelector` value at call time, or a
`useFreshRef`). Per the skill: "When an effect really must fetch, depend on the identifier and not
the record."

### Why it matters

The user types a contract address once; from then on, any blockchain update to the selected account
(new block, balance/nonce change) re-fires this effect and re-issues `getAccountInfo` against the
device/backend with the same address, silently, for as long as the modal stays open. Unlike a UI
computation, this is a real request each time.

---

## F-02-3 — `GraphTooltipBase`'s effect is keyed on the whole `props` object, so it fires on every mouse-move over the graph

- **Class:** 1 (unstable hook dependency — whole object where a primitive would do) with a class-2
  flavor (the effect calls a state setter in the parent)
- **Where:** `packages/suite/src/components/suite/graph/TransactionsGraph/GraphTooltipBase.tsx:131-142`
  (co-anchor: the setter it drives, `TransactionsGraph.tsx:96` `onShow: (index: number) =>
setHovered(index)`, wired in via `tooltipContentProps` at `TransactionsGraph.tsx:92-97` and spread
  into `GraphTooltipAccount`/`GraphTooltipDashboard` at `:170-183`)
- **Trigger cadence:** every recharts-internal re-render of the tooltip content while the pointer
  moves over the chart — recharts recomputes `coordinate`/`viewBox` continuously during hover
  tracking (this component positions itself off `props.coordinate!.x!` at `:159`, confirming those
  fields update per-pointer-move, not just per active-index change), so effectively per animation
  frame of mouse movement, not per distinct bar
- **Severity guess:** P1 (hot — an everyday interaction: hovering the account/dashboard balance
  graph)
- **Confidence:** high — the dependency array is the literal, undestructured `props` parameter; the
  component's own positioning logic depends on `coordinate` changing independently of `payload`

### Before (verbatim from the file)

```tsx
export const GraphTooltipBase = (props: GraphTooltipBaseProps) => {
    useEffect(() => {
        if (!props.onShow || !props.extendedDataForInterval) {
            return;
        }

        props.onShow(
            props.extendedDataForInterval.findIndex(
                item => item.time === props.payload?.[0]?.payload.time,
            ),
        );
    }, [props]);
```

### Proposed fix

Narrow the dependency to what actually identifies "which point is active":
`props.payload?.[0]?.payload.time` (plus `props.onShow`, `props.extendedDataForInterval`). That
alone makes the effect a no-op re-run whenever only `coordinate`/`viewBox` changed, and
`setHovered` (in the parent) only fires on a genuine active-point change instead of on every pointer
tick.

### Why it matters

Each firing also does `props.extendedDataForInterval.findIndex(...)` — an O(n) scan of the graph's
full interval data — and calls `setHovered` in `TransactionsGraph`. `hovered` is a primitive so
React bails out of re-rendering when the index repeats, but the effect body, the `findIndex` scan,
and the setter call all still run on every one of those ticks. Combined with F-02-4 below (the
parent's own unmemoized recompute on every `hovered`-driven render), this is the least-bounded
render churn found in this area.

---

## F-02-4 — `TransactionsGraph` rebuilds the fake-interval-data series on every hover-driven render, not just when the underlying data changes

- **Class:** 4 (render-body work that belongs in a `useMemo`) — the work is expensive enough over a
  user-scaling list to earn one, per the skill's own carve-out ("earns a `useMemo` only if the work
  is genuinely expensive over a real list")
- **Where:** `packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx:85-88`
  (co-anchor: `calcFakeGraphDataForTimestamps`,
  `packages/suite/src/utils/wallet/graph/utils.ts:264-359` — three separate `timestamps.forEach`
  passes, one containing a nested `data.some(...)`/`data.findIndex(...)` per tick, plus a final
  `.sort()`)
- **Trigger cadence:** every render of `TransactionsGraph`, including ones caused purely by
  `hovered`/`maxYTickWidth` local state (mouse hover, per F-02-3) that have nothing to do with
  `xTicks`/`data`/`account.formattedBalance`
- **Severity guess:** P1 (compounds directly with F-02-3: hover moves the mouse → `setHovered` →
  re-render → this recomputes from scratch)
- **Confidence:** high — `extendedDataForInterval` is a plain `const`, not a `useMemo`, and the
  component is `memo()`-wrapped only at its own prop boundary, which doesn't help against its own
  internal state changes

### Before (verbatim from the file)

```tsx
const [maxYTickWidth, setMaxYTickWidth] = useState(20);
const [hovered, setHovered] = useState(-1);
...
const extendedDataForInterval =
    variant === 'one-asset'
        ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
        : calcFakeGraphDataForTimestamps(xTicks, data);
```

### Proposed fix

`const extendedDataForInterval = useMemo(() => variant === 'one-asset' ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance) : calcFakeGraphDataForTimestamps(xTicks, data), [variant, xTicks, data, account.formattedBalance]);`
— none of those four inputs change on hover, so the memo absorbs every hover/resize-driven render.

### Why it matters

This is the one call site the skill explicitly carves out room for: real work over a real,
range-scaling list (`xTicks` can be a year of daily ticks), recomputed on a state change
(`hovered`) that has no bearing on the result. Out of scope for this sweep is _how expensive_ the
function is per call (that's asymptotic-complexity's lane — see the unrelated `p2-06`/`p2-07`
docs already filed for the upstream dashboard aggregation); in scope is that it reruns on every
hover tick with no memo at all.

---

## F-02-5 — `SuiteLayout`'s `ScrollContext.Provider` value is a fresh object every render, defeating `memo()` on every visible `TransactionItem`

- **Class:** 5 (missing memoization where identity matters — Provider value, many consumers,
  expensive children)
- **Where:** `packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx:113`
  (consumer: `suite/router/src/useAnchor.ts:8`, `useContext(ScrollContext)`; consumer's own
  callers: `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx` — `memo()`-
  wrapped at line 62, one instance per row of every visible transaction list)
- **Trigger cadence:** every render of `SuiteLayout` — which happens on every page navigation (its
  own `layoutHeader`/`layoutFooter`/`title` state, set via `LayoutContext` on route changes) and
  every tablet/desktop breakpoint crossing (`isBelowTablet`)
- **Severity guess:** P1 (cascades to every rendered `TransactionItem` row, a component the repo
  went out of its way to `memo()`)
- **Confidence:** high — verified both `scrollRef` (`useResetScrollOnUrl.ts:11`, a `useRef` created
  once) and `topOffset` (a compile-time sum of three constants) are 100%-stable across renders, so a
  `useMemo` here would always hit

### Before (verbatim from the file)

```tsx
const { scrollRef } = useResetScrollOnUrl();
const topOffset = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + ANCHOR_SCROLL_OFFSET;
...
return (
    <ScrollContext.Provider value={{ scrollRef, topOffset }}>
```

### Proposed fix

`const scrollContextValue = useMemo(() => ({ scrollRef, topOffset }), [scrollRef, topOffset]);` and
pass `value={scrollContextValue}`. Both inputs are stable for the component's whole lifetime, so
this is a pure win with no correctness trade-off.

### Why it matters

`useAnchor` (via `ScrollContext`) is used by `TransactionItem` for every row's anchor-scroll/
highlight behavior. Every `SuiteLayout` re-render — i.e. every page navigation — currently forces
every visible, `memo()`-wrapped transaction row to re-render for no reason, purely because the
Provider hands out a new object identity each time even though nothing inside it changed.

---

## F-02-6 — `useAccountWithTokensOptions` reads a `useCurrentRef` inside a `useMemo`, so the Send-picker's fiat sort lags a render behind rate ticks

- **Class:** 7 (wrong ref hook for the moment of read — the skill names this exact shape: "the only
  correct choice when the ref is read in render or inside a `useMemo`" is `useFreshRef`, not
  `useCurrentRef`)
- **Where:** `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/hooks/useAccountWithTokensOptions.ts:57,59-98`
- **Trigger cadence:** every fiat-rate tick while the Send asset picker is open
- **Severity guess:** P2 (real staleness, but confined to a picker modal's sort/display order, not a
  crash or data-loss path)
- **Confidence:** high on the mechanism (`useCurrentRef`'s own effect runs after render/commit, so
  `.current` read synchronously inside a `useMemo` body reflects the _previous_ commit's value, and
  because the ref object itself never changes identity, listing it in the deps array doesn't cause a
  re-run when `.current` is later updated either); medium on user-visible impact — would raise to
  high if `selectCurrentFiatRates` is confirmed to tick frequently enough to matter in practice

### Before (verbatim from the file)

```tsx
const fiatRates = useSelector(selectCurrentFiatRates);
...
const throttledAccounts = useThrottle(accounts, 1000);
const fiatRatesRef = useCurrentRef(fiatRates);

const accountsAndTokensSortedByCoin = useMemo(() => {
    const fiatRates = fiatRatesRef.current;

    if (!fiatRates) {
        return [];
    }
    ...
}, [fiatRatesRef, throttledAccounts, networkSymbolFilter, baseCurrencyCode, tokenDefinitions]);
```

### Proposed fix

Swap `useCurrentRef(fiatRates)` for `useFreshRef(fiatRates)` (assigns during render, so `.current`
is always the value from _this_ render), or — if the intent is deliberately to throttle fiat-rate
churn the way `throttledAccounts` already does — apply `useThrottle(fiatRates, 1000)` explicitly and
put the throttled value directly in the deps array instead of reading a ref inside the memo.

### Why it matters

Because the ref object is stable, listing `fiatRatesRef` in the memo's deps never triggers a
recompute on its own; the memo only re-evaluates when `throttledAccounts`/`networkSymbolFilter`/
`baseCurrencyCode`/`tokenDefinitions` change, and when it does, `.current` may still be the
rate from before the _previous_ render's fiat-rate update. The fiat balances and fiat-value sort
order shown in the global Send picker can lag real rate changes by more than the one render the
ref-in-effect pattern is usually good for.

---

## F-02-7 — `ConnectionGlobalModalContext`'s Provider value is a fresh object every render, fanning out to every scanned-device row

- **Class:** 5 (missing memoization where identity matters)
- **Where:** `packages/suite/src/components/connection/context/ConnectionGlobalModalContext.tsx:176-184`
  (`useConnectionGlobalModal()`, `:67-168`, returns a new object literal every call; consumers:
  `BluetoothDeviceListItem.tsx` — one instance per row in the nearby/known device list — and
  `BluetoothScanningList.tsx`, `CantSeeTrezorModal.tsx`, `BluetoothConnectionModal.tsx`,
  `ConnectDeviceGlobalModal.tsx`)
- **Trigger cadence:** every render of the provider, which itself re-renders on every
  `nearbyDevices`/`knownDevices`/`allDevices` update — i.e. continuously while a Bluetooth scan is
  active
- **Severity guess:** P2 (real, but the fan-out list — nearby BT devices — is inherently small, so
  the absolute cost per tick is modest even though the pattern is the textbook Class-5 shape)
- **Confidence:** high on the mechanism; medium on severity (bounded by how many devices are
  typically visible during a scan)

### Before (verbatim from the file)

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

### Proposed fix

Wrap the returned object in `useMemo` inside `useConnectionGlobalModal`, keyed on its actual fields
(`devices`, `selectedDevice`, the three derived device lists, the boolean/string state, and the
handful of callbacks — the callbacks would need their own `useCallback` first since several are
freshly defined on every call too).

### Why it matters

Every device found/updated during an active Bluetooth scan currently re-renders the whole connect
flow, including every row's `BluetoothDeviceListItem`, regardless of whether that specific row's
data changed.

---

## F-02-8 — `SuiteBanners` filters the full account list on every render of an always-mounted, frequently-re-rendering component

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/suite/banners/SuiteBanners/SuiteBanners.tsx:119`
- **Trigger cadence:** every render of `SuiteBanners`, which subscribes to `device` and
  `state.suite.transport` (`:52,59`) among ~11 other selectors — both are among the most
  frequently-updated slices in the app (device polling, transport status), and `SuiteBanners` is
  mounted on every page via `SuiteLayout`
- **Severity guess:** P2 (real, unmemoized, user-scaling list, on a globally-mounted component; not
  P1 because `.some()` short-circuits and account counts are usually modest)
- **Confidence:** medium — the instability of `device`/`transport` as frequent re-render triggers is
  based on their established volatility elsewhere in this codebase (see PROGRESS.md's own framing of
  `account`/`device` as reference-churning); I did not measure `SuiteBanners`'s actual re-render rate

### Before (verbatim from the file)

```tsx
} else if (accounts.some(account => isCardanoStakedWithFiveBinaries(account))) {
    banner = <CardanoOutdatedStakingBanner />;
    priority = 20;
}
```

### Proposed fix

`useMemo(() => accounts.some(isCardanoStakedWithFiveBinaries), [accounts])`, or push the check into
a memoized selector (`createWeakMapSelector`) so it only recomputes when `accounts` itself changes.

### Why it matters

`accounts` scales with how many accounts the user has enabled; recomputing this scan on every
`device`/`transport` tick (which have nothing to do with account contents) is wasted work in a
component that's always on-screen.

---

## F-02-9 — `AccountName`'s `exhaustive-deps` suppression hides a same-commit ref-staleness gap

- **Class:** 6 (`eslint-disable react-hooks/exhaustive-deps` site — lying/misleading dep array)
- **Where:** `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountName.tsx:23-54`
  (co-anchor showing the ref's target actually mounts/unmounts across account switches:
  `packages/suite/src/views/wallet/transactions/components/AccountOverviewBalance.tsx:85`
  `<Column ref={balanceSectionRef}>`, rendered only in the `status === 'loaded'` branch, with
  sibling skeleton/exception branches at
  `packages/suite/src/views/wallet/transactions/Transactions.tsx:85,92,106,117`)
- **Trigger cadence:** on an account switch that happens to coincide with the balance section's
  loading→loaded transition while staying on the `wallet-index` route (so `isOverviewRoute` doesn't
  itself flip and force a re-run)
- **Severity guess:** P2 (a real edge case, not a hot path — this is a one-shot staleness bug, not a
  loop)
- **Confidence:** medium — the eslint-plugin-react-hooks warning being suppressed here is the
  documented "ref value in a dependency array is not reactive" case (mutating `.current` doesn't
  itself trigger a re-run); I traced a concrete scenario where the ref's _target_ DOM node changes
  in the same commit as a component re-render, which the pre-commit dependency-array snapshot can
  miss — but I have not confirmed at runtime that this specific interleaving actually occurs in the
  current account-switch flow, hence not high

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (!isOverviewRoute) {
        setIsScrolled(true);

        return;
    }

    const target = balanceSectionRef?.current;
    if (!target) {
        setIsScrolled(false);

        return;
    }

    const observer = new IntersectionObserver(/* ... */);
    observer.observe(target);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [balanceSectionRef?.current, isOverviewRoute]);
```

### Proposed fix

Depend on something that actually changes reactively when the target should be re-observed — e.g. a
small `useState`/callback-ref pair that captures the DOM node (so its identity change is a real
state update React can diff), instead of reading `.current` inside the dependency array. That also
lets the suppressed lint rule come back on.

### Why it matters

If the balance-section DOM node swaps out (component remount on loading→loaded) in the same commit
that re-renders `AccountName` for an unrelated reason, the dependency array's _snapshot_ of
`.current` (taken during render, before the commit's ref mutation) can match the previous render's
snapshot, so React skips re-running the effect even though the observer is now watching a detached
node — leaving the compact/expanded header state frozen until something else forces a re-run.

---

## F-02-10 — `useGlobalSendReceiveModal` stores router-derived state instead of deriving it in render

- **Class:** 6 (derived state kept as `useState` + `useEffect` instead of computed during render)
- **Where:** `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/hooks/useGlobalSendReceiveModal.ts:44-49`
- **Trigger cadence:** every route-param change (navigation), i.e. bounded-but-wasteful, not a loop
- **Severity guess:** P3 (cleanup — low-frequency trigger, one extra render plus a one-frame lag,
  not a hot path)
- **Confidence:** high that this is unnecessary state (the skill's own words: "State that can be
  computed from what you already have is not state; derive it during render and there is no cycle
  to have"); the resulting behavior gap (one-render lag opening/closing the modal on a URL-driven
  navigation) is a minor, plausible but unverified side effect

### Before (verbatim from the file)

```tsx
const routerParams = useSelector(selectRouterParams);
const [activeModal, setActiveModal] = useState<GlobalSendReceiveType>(null);

useEffect(() => {
    setActiveModal(getDashboardParamModal(routerParams));
}, [routerParams]);
```

### Proposed fix

`const activeModal = getDashboardParamModal(routerParams);` computed directly in the hook body — no
`useState`/`useEffect` needed, since `getDashboardParamModal` is a pure, cheap parse of the already-
available `routerParams`. `openModal`/`closeModal` already call `dispatch(goto(...))`, which is what
actually drives `routerParams`, so the local state is redundant with what render can derive
directly.

### Why it matters

Every navigation currently costs an extra render cycle (state set in an effect, not during the
triggering render) and, more subtly, a render where `activeModal` still reflects the _previous_
route's value while `routerParams` already reflects the new one — a one-frame window where the
open/closed state of the global Send/Receive modal can disagree with the URL.

---

## F-02-11 — `TransactionReviewOutputList` re-scans the whole accounts list in its render body

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:81,117-120`
- **Trigger cadence:** every render of the review modal (a handful of times per transaction sign,
  once per device button-press-driven `reviewStep` change) — not per-frame, but unmemoized over an
  unbounded, user-scaling list
- **Severity guess:** P3 (real but cold — bounded number of re-renders per sign flow)
- **Confidence:** medium — `findAccountsByAddress` is not memoized and `accounts` is the full
  `state.wallet.accounts`, but I did not verify the typical size of that array in production usage

### Before (verbatim from the file)

```tsx
const accounts = useSelector(state => state.wallet.accounts);
...
const isInternalTransfer =
    isFirstOutputAddress &&
    typeof outputs[0]?.value === 'string' &&
    findAccountsByAddress(symbol, outputs[0]?.value, accounts).length > 0;
```

### Proposed fix

Wrap in `useMemo(..., [symbol, outputs, accounts])`, or move the lookup to a memoized selector if
one doesn't already exist for "accounts by address".

### Why it matters

Not hot, but a plain instance of the pattern the skill calls out: an unmemoized scan over a list
that scales with how many accounts the user has, recomputed on every step of the review flow even
when the accounts list hasn't changed.

---

## F-02-12 — `AddCoinjoinAccountButton` filters the full accounts list on every render

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:58,65-70`
- **Trigger cadence:** every render of this button (re-renders during the Tor-enable/coinjoin-account-
  creation flow via its own `isLoading` state)
- **Severity guess:** P3 (single button instance, not a per-row list — low absolute impact despite
  the unbounded-list pattern)
- **Confidence:** high that the filter is unmemoized and re-run on unrelated `isLoading` state
  changes; the button is only instantiated once per "add account" modal session, not per row

### Before (verbatim from the file)

```tsx
const accounts = useSelector(state => state.wallet.accounts);
...
const coinjoinAccounts = accounts.filter(
    a =>
        a.deviceState === device?.state?.staticSessionId &&
        a.symbol === network.symbol &&
        a.accountType === selectedAccount.accountType,
);
```

### Proposed fix

`useMemo(() => accounts.filter(...), [accounts, device?.state?.staticSessionId, network.symbol, selectedAccount.accountType])`.

### Why it matters

Minor on its own; listed for completeness since it's the same class-4 shape as F-02-8/F-02-11/
F-02-13/F-02-14 and a cheap fix.

---

## F-02-13 — `CoinProtocolRenderer` chains `.filter()` onto a `useSelector` result, discarding the selector's own memoization

- **Class:** 4 (render-body work; the selector itself is fine, the chained filter is the bug)
- **Where:** `packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx:45-47`
- **Trigger cadence:** every render of this toast (bounded lifetime — a few seconds — but re-renders
  on any unrelated store dispatch that changes one of its ~4 other `useSelector` values)
- **Severity guess:** P3 (short-lived component; real but cold)
- **Confidence:** high that the `.filter()` is chained outside the selector function (so it reruns
  regardless of whether `selectDeviceAccountsByNetworkSymbol`'s own memoization would have held);
  medium on how often this toast actually re-renders in practice

### Before (verbatim from the file)

```tsx
const networkAccounts = useSelector(state =>
    selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
).filter(a => new BigNumber(a.balance).gt(0));
```

### Proposed fix

Move the balance filter inside the selector callback (`state => selectDeviceAccountsByNetworkSymbol(state, networkSymbol).filter(...)`) and wrap the whole thing in a `useMemo` if it needs to feed anything besides inline JSX/callback reads, or add the balance predicate to a dedicated memoized selector.

### Why it matters

Same "chained array method after the hook returns" trap called out in the skill's Class-1 section,
just landing on render-body cost here rather than a downstream memo, since nothing currently
consumes `networkAccounts`'s identity.

---

## F-02-14 — `TransactionRenderer` re-derives account/tx lookups from full accounts/transactions lists every render

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/suite/notifications/NotificationRenderer/TransactionRenderer.tsx:37-38,46-47,52-54`
- **Trigger cadence:** every render of this toast while it's displayed (bounded lifetime, but
  subscribes to `accounts`/`transactions`/`blockchain`/`devices`/`currentDevice`/`routeName`/
  `routerApp` — any of which changing re-triggers the lookups)
- **Severity guess:** P3 (short-lived toast; real but cold)
- **Confidence:** medium — the lookups (`findAccountsByNetwork`, `findAccountsByDescriptor`,
  `getAccountTransactions`, `findTransaction`) are plain, unmemoized function calls over
  `accounts`/`transactions`; I did not verify their internal cost beyond "filter/find over a list"

### Before (verbatim from the file)

```tsx
const accounts = useSelector(selectAccounts);
const transactions = useSelector(selectTransactions);
...
const networkAccounts = findAccountsByNetwork(symbol, accounts);
const account = findAccountsByDescriptor(descriptor, networkAccounts).at(0);
...
const accountTxs = getAccountTransactions(account.key, transactions);
const tx = findTransaction(txid, accountTxs);
```

### Proposed fix

`useMemo(() => { ...lookup chain... }, [symbol, descriptor, txid, accounts, transactions])`.

### Why it matters

Same pattern as F-02-11/F-02-13; grouped here because notifications were an explicit priority for
this sweep, not because this instance is especially hot.

---

## F-02-15 — `CancelTransactionModal`'s own `CancelTxContext.Provider` value is also unmemoized (minor)

- **Class:** 5 (missing memoization — Provider value)
- **Where:** `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx:110-111`
- **Trigger cadence:** every render of `CancelTransactionModal`
- **Severity guess:** P3 (only 3 consumers, all within the same small modal subtree — not a
  many-consumers/expensive-children case)
- **Confidence:** high that the value is unmemoized; low severity is by design given the small,
  contained consumer set

### Before (verbatim from the file)

```tsx
<CancelTxContext.Provider
    value={{ composedCancelTx, cancelFormState: formState, isComposing }}
>
```

### Proposed fix

`useMemo(() => ({ composedCancelTx, cancelFormState: formState, isComposing }), [composedCancelTx, formState, isComposing])` if this file is being touched anyway for F-02-1; not worth a standalone change otherwise.

### Why it matters

Included for completeness alongside F-02-1 since it's the same file and the same class of bug, but
the consumer count is small enough that this is genuinely low priority on its own.

---

## Checked, clean

- `packages/suite/src/components/suite/layouts/SuiteLayout/CoinjoinBars/CoinjoinBars.tsx` —
  `sessionCount` is derived via `.filter().length` but only the primitive `.length` enters the
  `useMemo` dep array; `coinjoinAccounts` comes straight off an Immer-managed state slice. Memo
  hits correctly.
- `packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx` —
  per-row `BackendRow` reads `blockchain[symbol]` from a stable slice; `customBackends` list is
  small (user's manually-configured backends only).
- `packages/suite/src/components/suite/bluetooth/BluetoothDeviceListItem.tsx` and
  `BluetoothDebugInfo.tsx` — `(nearbyDevices ?? []).some/find` fresh-fallback pattern present, but
  the list (physically nearby BT devices) is inherently small/bounded and doesn't feed a downstream
  memo; not hot enough to report. `BluetoothDebugInfo`'s `TimeAgo` setState-in-effect is a correct
  once-a-second ticker, not a loop.
- `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewTronFeeNotes.tsx:28` —
  `calculateTronFeeBreakdown(...) ?? {}` is O(1) over a single tx, not a list; no downstream memo.
- `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:602` —
  `(rewards ?? []).map(...)` bounded to one tx's reward claims (single digits), not user-scaling.
- `packages/suite/src/components/suite/FormattedCryptoAmount.tsx:79` — `getNetworkOptional(...) ?? {}`
  resolves to a plain object-property lookup (`networks[symbol]`), not a list scan; despite being
  used on effectively every amount in the UI, the per-call cost is O(1).
- `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/WalletConnectProposalModal.tsx:54-64` —
  `selectableAccounts` `useMemo` deps (`accounts` via `selectAllAccountsToList`, a
  `createMemoizedSelector`; `pendingProposal?.networks`, backed by Immer structural sharing through
  the plain `selectPendingProposal` accessor) are both genuinely stable across unrelated
  dispatches; verified both selector definitions. Memo hits correctly — good counter-example to
  keep in mind before assuming every `useMemo` over `useSelector` results is broken.
- `packages/suite/src/components/onboarding/OnboardingCancelButtonContext.tsx:19` — inline Provider
  value is fresh every render, but has exactly one consumer (`OnboardingLayout.tsx`) in a
  low-frequency-render subtree; doesn't meet the "many consumers / expensive children" bar.
- `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ConfirmUnverifiedModal.tsx:62-66` —
  effect correctly narrows to `device?.connected` (not the whole `device` object); checked both real
  call sites (`ConfirmUnverifiedXpubModal.tsx` passes a `useCallback(..., [])`-memoized
  `verifyProcess`, `ConfirmUnverifiedProceedModal.tsx` doesn't pass one at all) — genuinely stable,
  a good example of the skill's "narrow to the identifier" guidance done right.
- `packages/suite/src/components/onboarding/ThpPairingStep/ThpPairingStartStep.tsx:14-16` — plain
  prop-to-state sync effect keyed on a primitive (`props.isLoading`); standard, correct pattern.
- `packages/suite/src/components/dashboard/DashboardSection.tsx:41-45` — `useCurrentRef(onCollapseChange)`
  read inside a `useEffect` declared immediately after it; hook-declaration order guarantees the
  ref's own internal effect updates `.current` before this component's effect reads it. Correct
  choice for a read-in-effect (contrast with F-02-6, a read-in-`useMemo` case).
- `packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/GlobalSendModal.tsx:61,68,76` —
  `submitRef = useCurrentRef(onSubmit)` is only read inside click-driven callbacks
  (`handleAccountClick`/`handleTokenClick`), well after any same-commit effect-ordering concern
  applies. Correct usage.
- `packages/suite/src/components/suite/notifications/NotificationRenderer/ExchangeInfoRenderer.tsx` —
  only keyed selector lookups (`selectAccountByKey`, `selectTradingCoinSymbolByCryptoId`), no list
  scans.
- `packages/suite/src/components/suite/labeling/AccountLabeling.tsx`,
  `WalletLabeling.tsx`, `packages/suite/src/components/suite/Metadata.tsx` — the "labeling/metadata"
  priority area for this sweep; all O(1) or small-list work, no unstable deps or fresh-selector
  issues found. (Note: the generic `Labeling` metadata-editing component used by `AccountDetails.tsx`
  lives in the separate top-level `suite/labeling` package, not under `packages/suite/src/components`,
  so it's out of this area's scope.)
- `packages/suite/src/components/suite/asset-picker/hooks/useFilterAccountsWithTokens.ts` —
  properly memoized, real dependency list.
- `packages/suite/src/components/suite/asset-picker/components/AssetRow/AssetRowAccount/AccountAmount.tsx`,
  `AssetRowAccountWithBalance.tsx` — O(1) per-row arithmetic/markup, no hook issues.
- `packages/suite/src/components/suite/notifications/Notifications/NotificationGroup/NotificationGroup.tsx:20` —
  `getSeenAndUnseenNotifications(notifications)` is unmemoized in the render body, but the
  notifications list is small/capped in practice; doesn't meet the "real, unbounded" bar for a
  formal finding.
- `packages/suite/src/components/connection/hook/useBluetoothScanning.ts` and
  `useBluetoothConnection.tsx` — deps are correctly narrow throughout; one very minor imprecision
  (`useBluetoothScanning.ts:73-78` depends on the whole `devices` array where only `.length` is
  read) but the dispatched action is an idempotent status-set, not worth a formal finding.
- `packages/suite/src/components/suite/modals/ModalSwitcher/ModalSwitcher.tsx`,
  `ReduxModal.tsx`, `Preloader.tsx` — routing/lifecycle branch logic; effects keyed on stable
  primitives (`dispatch`, `isAnalyticsConsentConfirmed`); no issues found beyond F-02-5 (already
  reported against `SuiteLayout.tsx`, which these components render into).
- `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/ChangeFee/BumpFeeModal.tsx` —
  no independent hook logic of its own; delegates to `useRbf` from
  `packages/suite/src/hooks/wallet/useRbfForm.ts`, which is area 01's file (`packages/suite/src/hooks`),
  not this area's — flagging here only as a pointer in case area 01 hasn't checked whether `useRbf`
  has the same whole-`account`/`chainedTxs` dependency shape as F-02-1.
- `packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/TxDetailModal.tsx` —
  its own `tx`/`chainedTxs`/`filteredInternalTransfers` `useMemo`s are internally consistent with
  their own inputs; the instability that reaches `CancelTransactionModal.tsx` (F-02-1) is inherent
  to how account/tx records are tracked upstream in Redux, not an authoring bug in this file's
  memos, so it's cited as a co-anchor there rather than flagged on its own.
- `packages/suite/src/components/suite/graph/TransactionsGraph/GraphTooltipAccount.tsx`,
  `GraphTooltipDashboard.tsx`, `GraphBar.tsx` — operate on a single data point per call (O(1)), no
  issues independent of F-02-3/F-02-4.
