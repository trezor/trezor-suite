# Scan area 01 — packages/suite/src/hooks/**

Base commit `9e0d5b6a45`. Covers `hooks/suite`, `hooks/wallet` (incl. `trading/*`, `allowance/*`,
`form/*`), `hooks/earn`, `hooks/settings`, `hooks/guide`, `hooks/coinjoin`, `hooks/general` — all
non-compiled (`packages/suite` is not React-Compiler-covered), so manual memoization findings are
valid throughout.

Excluded per brief / PROGRESS.md and confirmed still present at this commit (not re-filed):

- `hooks/wallet/useAccounts.ts:9` (`useAccountAddressDictionary`'s `unusedAddresses`/`usedAddresses`
  defaults) — #31133. The redundant `(unusedAddresses ?? []).concat(usedAddresses ?? [])` at line 15
  is the same root cause (those two vars already default via line 9), not a separate defect.
- `hooks/suite/useFiatFromCryptoValue.ts` whole-`Rate` selector (line 33-35) — #28880. Read the
  whole file looking for an adjacent distinct defect; found none — `fiatRateKey` (line 31) is a
  plain string recomputed per render, never stored in a dep array.
- `hooks/wallet/form/useUtxoSelection.ts:63` — already drafted in `perf-issues/asymptotic-complexity`
  per PROGRESS.md's anchor list.
- `hooks/wallet/useEvmNonceInfo.ts` — PROGRESS.md's anchor is line 90 in that file's history; at
  this commit the file is 95 lines and the candidate hit was line 41
  (`{ enabled = true }: UseEvmNonceInfoOptions = {}`). Checked separately: `enabled` is destructured
  straight to a primitive and only the primitive (`isEnabled`) reaches the `useMemo` dep array
  (line 94), so the default-parameter object never leaks into a dependency. Not a finding, and not
  the same line as the excluded anchor.

## F-01-1 — `useLayout.tsx` effect keyed on inline JSX header/footer re-renders the whole app shell on every page render

- **Class:** 1 (unstable dependency crossing the hook boundary) + 2 (effect calling a state setter
  keyed on that unstable dependency)
- **Where:** `packages/suite/src/hooks/suite/useLayout.tsx:8-10`, root cause in every call site,
  e.g. `packages/suite/src/views/dashboard/index.tsx:17`,
  `packages/suite/src/components/settings/SettingsLayout.tsx:90`,
  `packages/suite/src/views/earn/index.tsx:6`,
  `packages/suite/src/views/wallet/trading/common/TradingLayout/useTradingPageHeader.tsx:77`
  (every other `useLayout(...)` call site in the repo does the same); Provider at
  `packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx:101-104,129`.
- **Trigger cadence:** every render of _any_ page/view component that calls `useLayout` with a JSX
  header/footer argument (i.e. effectively every page in the app).
- **Severity guess:** P1 (hot — this is the app's own layout hook, mounted on every route)
- **Confidence:** high — verified the Provider architecture and that every current call site passes
  inline JSX (grepped all `useLayout(` call sites; none memoize the header/footer element).

### Before (verbatim from the file)

```tsx
// packages/suite/src/hooks/suite/useLayout.tsx
export const useLayout = (title?: string, layoutHeader?: ReactNode, layoutFooter?: ReactNode) => {
    const setLayout = useContext(LayoutContext);

    useEffect(() => {
        setLayout({ title, layoutHeader, layoutFooter });
    }, [setLayout, title, layoutHeader, layoutFooter]);
};
```

Every call site passes a freshly-created element, e.g.:

```tsx
// packages/suite/src/views/dashboard/index.tsx:17
useLayout('Home', <PageHeader />, <DashboardFooter />);
```

`SuiteLayout.tsx` holds the payload in local state and spreads it into its own JSX, while `children`
(the routed page, i.e. the component that just called `useLayout`) is passed through as a prop:

```tsx
// packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx
const [{ title, layoutHeader, layoutFooter }, setLayoutPayload] =
    useState<LayoutContextPayload>({});
...
<LayoutContext.Provider value={setLayoutPayload}>
    ...
    {layoutHeader}
    <ContentContainer ...>{children}</ContentContainer>
    {layoutFooter}
    ...
</LayoutContext.Provider>
```

### Proposed fix

`layoutHeader`/`layoutFooter` are `ReactNode` — a JSX element is a plain object, so it is a fresh
reference every render exactly like `?? []`/`?? {}`. Two independent fixes, either is sufficient:

1. In `useLayout`, compare the _rendered output_ is unnecessary — instead have callers memoize the
   element they pass (`useMemo(() => <PageHeader />, [...])`) so the reference is stable across
   renders that don't actually change the header.
2. Cheaper and centralized: in `SuiteLayout.tsx`, wrap the consumers of `layoutHeader`/`layoutFooter`
   (or the `LayoutContext.Provider` subtree pieces that are not `children`) in `memo()` so a fresh
   element with the same type/props still produces the same rendered DOM — this doesn't fix the
   `useEffect` refiring, but stops the refire from cascading past a shallow-prop-equal boundary. The
   real fix is (1); this hook cannot itself deduplicate a `ReactNode` it did not create.

### Why it matters

`SuiteLayout`'s `children` prop shields the _routed page itself_ from re-rendering (standard
"children as a prop" composition — confirmed by reading `SuiteLayout.tsx`), so this is not an
infinite loop. But `SuiteLayout`'s own direct JSX children — `Sidebar`, `SuiteBanners`,
`ModalSwitcher`, `DiscoveryProgress`, `PowerMonitorManager`, `CoinjoinBars`, `GuideButton`,
`AddPassphraseWalletFlow`, `SwitchDeviceLayer`, `Metadata` — are **not** wrapped in `memo()` (checked
each file: none export a `memo(...)`-wrapped component), so all of them re-run their full render body
(including their own selectors/hooks) every time `setLayoutPayload` fires. Since every current call
site recreates its header/footer element on every render, this effect refires — and the whole shell
re-renders — every time the _page itself_ re-renders for unrelated reasons (e.g. a fiat-rate tick on
the dashboard, a form keystroke). `Sidebar` renders the accounts list (see F-01-2), so this is the
widest-reaching finding in this file: it turns "this page re-rendered" into "the whole chrome
re-rendered," on every route in the app.

## F-01-2 — `useAccountSearch.tsx` context Provider recreates its value object every render

- **Class:** 5 (missing memoization where identity matters — context Provider `value={{...}}`)
- **Where:** `packages/suite/src/hooks/suite/useAccountSearch.tsx:44-56` (Provider body at 48-56)
- **Trigger cadence:** every render of `ReduxAccountSearchProvider`'s owner,
  `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu.tsx` (mounted once,
  wraps the whole accounts sidebar) — which itself reads `useSelector(selectSelectedDevice)`
  (unnarrowed device object) and `useSelector(selectDiscoveryOverallStatus)`, so it re-renders on
  most device/discovery events, not just when search/filter state actually changes.
- **Severity guess:** P1 (sidebar is rendered on essentially every wallet page)
- **Confidence:** high — read the Provider, confirmed both `filters` (from a plain selector) and
  `actions` (already correctly `useMemo`'d on `[dispatch]`) are individually stable, so the _only_
  unstable piece is the inline spread; confirmed 6 consumers via `useAccountSearch()`, including
  `AccountsList.tsx` (the accounts sidebar rows).

### Before (verbatim from the file)

```tsx
export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const filters = useSelector(state => selectAccountSearch(state));
    const actions = useReduxAccountSearchActions();

    return (
        <AccountSearchContext.Provider
            value={{
                ...filters,
                ...actions,
            }}
        >
            {children}
        </AccountSearchContext.Provider>
    );
};
```

### Proposed fix

```tsx
const value = useMemo(() => ({ ...filters, ...actions }), [filters, actions]);

return <AccountSearchContext.Provider value={value}>{children}</AccountSearchContext.Provider>;
```

`filters` and `actions` are already stable individually, so this `useMemo` will actually hold.

### Why it matters

Every consumer of `useAccountSearch()` — `AccountSearchBox`, `AccountsList`, `CoinsFilter`,
`AccountsMenuHeader`, plus `AddAccountModal` and `AssetActionButton` elsewhere — re-renders whenever
`ReduxAccountSearchProvider` re-renders, regardless of whether the filter/search state actually
changed, because a Context consumer re-renders on any new `value` reference. `AccountsMenu` (the
Provider's mount point) reads `selectSelectedDevice` as a whole object, which per this sweep's other
findings changes reference on most device-related store updates, so the sidebar's search/filter
context churns considerably more than the underlying data does.

## F-01-3 — `useEthereumCancelTxCompose.ts` re-composes the cancel transaction on every account/tx reference change

- **Class:** 2 (effect refetch loop — silent, paced by store updates rather than network, but
  unguarded by any value comparison)
- **Where:** `packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:115-120`
- **Trigger cadence:** every render of `CancelTransactionModal` where `account` or `tx` gets a new
  reference while the modal is open — confirmed the caller
  (`packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/TxDetailModal.tsx:101`)
  reads `account` via a live `useSelector(state => selectAccountByKey(state, accountKey))` on every
  render, not a snapshot taken when the modal opened.
- **Severity guess:** P1 (real compose dispatch, not just a re-render; fires while a device-signing
  flow is imminent)
- **Confidence:** high — read the full effect and its only guards (type checks, not value
  comparisons).

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (account.networkType !== 'ethereum' || !feeInfo || tx.rbfParams?.type !== 'ethereum') {
        return;
    }
    mutate();
}, [account, tx, feeInfo, mutate]);
```

### Proposed fix

The guard conditions only ever check `account.networkType` and `tx.rbfParams?.type` — both stable
for the lifetime of "the same pending tx being cancelled." Narrow the dependency array to what
actually needs to trigger a recompose:

```tsx
}, [account.key, account.networkType, tx.txid, tx.rbfParams, feeInfo, mutate]);
```

`mutate`'s `mutationFn` closure already reads the live `account`/`tx` from the outer scope each time
it's invoked (react-query captures the latest options internally), so narrowing the _trigger_ array
doesn't lose freshness — it only stops re-triggering on irrelevant reference churn. `feeInfo` is
already a `createWeakMapSelector` result (`selectConvertedNetworkFeeInfo`), so it's fine as-is.

### Why it matters

`account` comes from a live `selectAccountByKey` selector re-read on every render of the modal — any
balance/nonce/history update to the account being cancelled produces a new object. Every one of those
re-fires `mutate()`, which dispatches `composeSendFormTransactionFeeLevelsThunk` again — a real
fee-compose operation — for no reason related to the actual inputs of the composition. Unlike the
sibling compose hooks in this same area (`useCompose.ts`, `useStakeCompose.ts`, `useTradingComposeTransaction.ts`'s
first effect), which all compare a primitive (blockHeight, descriptor+symbol) before recomposing,
this effect has no such gate.

## F-01-4 — `useTradingComposeTransaction.ts` second effect: whole `device` dependency + `accounts` read but omitted

- **Class:** 2 (effect refetch, bounded-but-wasteful sub-type) with a Class 6 flavor (the
  `eslint-disable` also hides a real omission)
- **Where:** `packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts:142-223`
  (the `eslint-disable-next-line react-hooks/exhaustive-deps` at line 209)
- **Trigger cadence:** every time `device` (whole `TrezorDevice` object) changes reference **while
  `outputAddress` is still empty** — i.e. the window between selecting an account/asset and the first
  successful address-placeholder compose. Once `outputAddress` is set, the `if` guard
  (`hasAccountChanged || (!outputAddress && ...) || hasFeeInfoChanged`) absorbs further `device`
  churn, so this is a real but narrow-window issue, not a continuous one.
- **Severity guess:** P2 (real device I/O — `TrezorConnect.getAddress` — but only in a specific window)
- **Confidence:** medium-high — read the whole effect and the sibling effect above it that solves
  the identical problem correctly.

### Before (verbatim from the file)

The **first** effect in the same file already solves this correctly, keeping only `device?.state` in
its deps and reading the live device through a ref for the actual work:

```tsx
const deviceRef = useRef(device);
deviceRef.current = device;
...
useEffect(() => {
    ...
    deriveTronColdRecipient({ account, network, accounts: accountsRef.current, device: deviceRef.current })
    ...
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [account?.descriptor, account?.symbol, account?.accountType, networkType, device?.state, network]);
```

The **second** effect does not reuse that pattern — it depends on the whole `device` object, and
reads `accounts` (the whole accounts array, from `useSelector(selectAccounts)`) directly without
listing it at all:

```tsx
const setStateAsync = async () => {
    const address: string = await getComposeAddressPlaceholder(
        account,
        network,
        device,
        accounts,      // <-- used here, not in the dep array below
        chunkify,
    );
    ...
};
...
if (hasAccountChanged || (!outputAddress && account.symbol !== 'ada') || hasFeeInfoChanged) {
    setStateAsync();
}
...
// call effect only when listed dependencies will change
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [
    account?.symbol, account?.descriptor, chunkify, device, network,
    state.account?.descriptor, state.account?.symbol,
    initState.account?.descriptor, initState.account?.symbol, initState.feeInfo,
    outputAddress, type,
]);
```

### Proposed fix

Reuse the file's own `deviceRef`/`accountsRef` (already declared above for the first effect) inside
`setStateAsync`, and key the dependency array on `device?.state` like the first effect does:

```tsx
device: deviceRef.current,
accounts: accountsRef.current,
```

with `device?.state` replacing `device` in the dependency array. `getComposeAddressPlaceholder` does
need a real, current device object for `TrezorConnect.getAddress` (confirmed by reading
`tradingUtils.ts:32-78`) — the ref supplies that without making it a re-trigger source.

### Why it matters

For Bitcoin-type accounts, `getComposeAddressPlaceholder` calls `TrezorConnect.getAddress` — real
device/bridge I/O — to derive a placeholder receive address for the fee-estimate step of the
sell/exchange flow. Reading `accounts` outside the dependency array also means the `legacyAccount`
lookup inside `getComposeAddressPlaceholder`'s Bitcoin branch can run against a stale accounts
snapshot from whenever this effect last fired, independent of the `device` issue above.

## F-01-5 — `useSendForm.ts` "handle draft change" effect can never fire (dependency is a stable ref)

- **Class:** 6 (wasted / dead code — the `eslint-disable` hides that the dependency array cannot do
  what the code around it assumes)
- **Where:** `packages/suite/src/hooks/wallet/useSendForm.ts:409-416`, contrasted with the only writer
  of `draft.current` at lines 376-401.
- **Trigger cadence:** once per mount, and only once — never again for the lifetime of the component.
- **Severity guess:** P3 (dead code; a sibling effect happens to cover the same functional need)
- **Confidence:** high on the mechanism (refs are referentially stable across renders, confirmed
  `draft.current` has exactly one writer in the file), medium on real-world impact (see below).

### Before (verbatim from the file)

```tsx
const draft = useRef<FormState | undefined>(undefined);
...
useEffect(() => {
    const loadDraftValues = async () => {
        const storedState = await dispatch(getSendFormDraftThunk()).unwrap();
        const values = getLoadedValues(storedState);
        reset(values, { keepDefaultValues: !!storedState });
        if (storedState) {
            draft.current = storedState;
            composeDraft(storedState);   // already called directly here
        }
    };
    ...
}, [dispatch, getLoadedValues, findNetworkSymbolForProtocol, reset]);
...
// handle draft change
useEffect(() => {
    if (!draft.current) return;
    composeDraft(draft.current);
    draft.current = undefined;
    // composeDraft is excluded because its reference changes with each feeInfo update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [draft]);
```

### Proposed fix

`useRef`'s return value is the same object every render, so `[draft]` behaves like `[]`: this effect
runs exactly once, immediately after mount — before the async `loadDraftValues` above has had a
chance to set `draft.current`. So `draft.current` is guaranteed `undefined` at the one time this
effect body executes, and it never runs again. Either delete this effect (the direct
`composeDraft(storedState)` call in `loadDraftValues` plus the feeInfo-driven effect two lines below
it, `useEffect(() => { composeDraft(getValues()); }, [composeDraft, getValues])`, already cover
recomposing once a fresher `composeDraft` becomes available), or if the intent was genuinely "run
again whenever a fresher `composeDraft` shows up," depend on `composeDraft` itself (with a `void
draft;` per the exhaustive-deps skill section, since `draft.current` is read imperatively).

### Why it matters

This looks like it's meant to defer the actual compose call to a moment when `composeDraft` (whose
identity changes with every `feeInfo` update, per the neighboring comment) is fresh, rather than
using the `composeDraft` closure captured at mount time inside `loadDraftValues`. As written it can
never do that — `draft.current` is also never reset to `undefined`, though nothing downstream reads
`draft.current` again, so this looks inert rather than actively harmful today. Flagging per the
"skill contradictions / eslint-disable hides staleness" honesty rule: the suppressed warning was
almost certainly "missing dependency: `composeDraft`," and satisfying it properly (instead of adding
the ref) would have been the actual fix.

## F-01-6 — `useTotalFiatBalance.ts` recomputes the whole-account-list balance on every render, unmemoized

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/hooks/wallet/useTotalFiatBalance.ts:14-29`
- **Trigger cadence:** every render of `PortfolioCard`
  (`packages/suite/src/views/dashboard/PortfolioCard/PortfolioCard.tsx:44,63`) and `WalletInstance`
  (`packages/suite/src/views/suite/SwitchDevice/DeviceItem/WalletInstance.tsx:69`). `PortfolioCard`
  reads `currentFiatRates` via `useSelector(selectCurrentFiatRates)` and passes it straight into this
  hook, so every fiat-rate tick re-runs the computation even when `accounts` itself is unchanged.
- **Severity guess:** P2 (real, user-scaling list; but bounded to the dashboard's total-balance card)
- **Confidence:** high — read the hook (no `useMemo`/`useCallback` at all) and its only two call
  sites.

### Before (verbatim from the file)

```tsx
export const useTotalFiatBalance = (
    accounts: Account[],
    baseCurrencyCode: BaseCurrencyCode,
    rates?: RatesByKey,
) => {
    const tokenDefinitions = useSelector(state => state.tokenDefinitions);
    const deviceAccounts: Account[] = accounts.map(account => {
        const coinDefinitions = tokenDefinitions?.[account.symbol]?.coin;
        const tokens = getTokens({
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: coinDefinitions,
        });

        return { ...account, tokens: tokens.shownWithBalance };
    });

    const totalBaseCurrencyBalance = getTotalFiatBalance({
        deviceAccounts,
        baseCurrencyCode,
        rates,
    }).toString();

    return totalBaseCurrencyBalance;
};
```

### Proposed fix

Wrap the body in `useMemo(..., [accounts, baseCurrencyCode, rates, tokenDefinitions])`. `getTokens`'s
own internal cost is out of this sweep's scope (already a `tokenUtils.ts` candidate in the
asymptotic-complexity doc set), but nothing here currently stops it from running on every fiat-rate
tick regardless of whether `accounts` changed.

### Why it matters

`getTotalFiatBalance` iterates every account and calls `getAccountFiatBalance` per account
(`suite-common/wallet-utils/src/accountUtils.ts:598-620`), and `useTotalFiatBalance` additionally maps
every account through `getTokens` first. `PortfolioCard` is the dashboard's headline "total balance"
card, `memo()`-wrapped but with no props, so it re-renders on every one of its several `useSelector`
reads changing — `currentFiatRates` is the most frequent of those. None of that work is cached
against the fiat rate actually changing the total, so it re-runs the full account/token walk on every
tick.

## F-01-7 — `useExchangeDexQuote.ts`: `fromAddress` effect keyed on the whole `account` object

- **Class:** 1 (minimal-required-dependency violation feeding a `useEffect`)
- **Where:** `packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts:80-88`
- **Trigger cadence:** every time `account` gets a new reference (any balance/tx/misc update) while
  the exchange form's DEX path is active — no value comparison guards the `setValue` call.
- **Severity guess:** P3 (cheap `setValue` call with an almost-always-identical value, not a network
  op)
- **Confidence:** high.

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (!account) {
        return;
    }

    const fromAddress = isAccountBasedNetwork(account.symbol) ? account.descriptor : undefined;

    setValue('fromAddress', fromAddress);
}, [account, setValue]);
```

### Proposed fix

```tsx
}, [account?.symbol, account?.descriptor, setValue]);
```

Both fields read in the body are already primitives; nothing else in the effect needs the rest of
`account`.

### Why it matters

The same hook, three lines later, already uses `useCurrentRef` twice specifically to avoid this exact
shape of problem (`accountRef`, `fetchFeesAndComposeRef`) for the _fee-fetch_ effect — this earlier
`fromAddress` effect is the one place in the file that didn't get the same treatment, and it's the
cheapest to fix since the value it computes only ever depends on two primitives.

## F-01-8 — Earn/staking form family: `defaultValues`/`state` memoized on the whole `account` prop

- **Class:** 6 (wasted memoization — unstable dependency by construction, terminates, does not loop)
- **Where:**
    - `packages/suite/src/hooks/earn/useWithdrawalForm.ts:86-96,104-112`
    - `packages/suite/src/hooks/earn/useStakeForm.ts:66-76,81-93`
    - `packages/suite/src/hooks/earn/useClaimForm.ts:35-44,46-58`
    - `packages/suite/src/hooks/wallet/useChangeDelegateForm.ts:48-57,59-68`
    - `packages/suite/src/hooks/wallet/useRbfForm.ts:183-277` (`useRbfState`'s single large `useMemo`)
- **Trigger cadence:** every render in which the `account` prop/parameter gets a new reference (all
  five hooks take `account: Account` straight from a caller-side selector).
- **Severity guess:** P3 (recomputation is real but not unbounded per the skill's "wasted, not a
  loop" distinction — each hook's downstream `useStakeCompose`/`useCompose` consumer already guards
  its actual compose dispatch behind a primitive `blockHeight` comparison, verified in
  `packages/suite/src/hooks/wallet/form/useStakeCompose.ts:223-231` and
  `.../form/useCompose.ts:245-253`)
- **Confidence:** high on the shape (identical across all five files), medium on whether it's worth
  fixing given the guarded consumers — noting it because the skill calls out "redundant memos get
  flagged about as often as missing ones."

### Before (verbatim, `useStakeForm.ts` shown; the other four are structurally identical)

```tsx
const defaultValues = useMemo(() => {
    const stakingContractAddress = getStakingContractAddress(account, 'stake');
    return { ...getStakeFormsDefaultValues({ address: stakingContractAddress, stakeType: 'stake' }), setMaxOutputId: undefined } as StakeFormState;
}, [account]);
...
const state = useMemo(() => {
    const feeInfo = getConvertedOrDefaultFeeInfo({ networkType: account.networkType, feeInfo: networkFees });
    return { account, network, feeInfo, formValues: defaultValues };
}, [account, defaultValues, networkFees, network]);
```

### Proposed fix

`getStakingContractAddress`/`getStakeFormsDefaultValues` only need the account's `descriptor`
/`symbol`/`networkType` (stable per account), not the live balance-bearing object. Narrowing to those
fields would let the memo actually hold across balance ticks. Given this exact shape repeats five
times, it may be worth a small shared helper (e.g. `useStakeFormState(account, stakeType)`) instead of
five independent fixes.

### Why it matters

Each recompute re-derives `getStakeFormsDefaultValues`/`getStakingContractAddress`/
`getConvertedOrDefaultFeeInfo` and reallocates the `state` object on every account-reference churn
while a stake/withdraw/claim/delegate/RBF form is open. It does not cause extra dispatches — the
compose sub-hooks it feeds already gate on `feeInfo.blockHeight` — so this is the "wasted memo,
terminates" failure mode the skill explicitly distinguishes from a loop, not a request-loop finding.

## Checked, clean

- `packages/suite/src/hooks/suite/useBioAuthDesktopApi.ts:14-21` — `useSelector` returns a fresh
  one-level object of primitives; nothing downstream depends on the object itself, only the
  destructured primitives. Safe under `packages/suite`'s `shallowEqual` default.
- `packages/suite/src/hooks/suite/useGraph.ts` — `selectedRange` is a direct primitive state read;
  `actions` memo correctly depends on `[dispatch]` only.
- `packages/suite/src/hooks/wallet/useAccounts.ts` — see exclusions above (#31133 covers the whole
  file's actual defect).
- `packages/suite/src/hooks/suite/useFiatFromCryptoValue.ts` — see exclusions above (#28880).
- `packages/suite/src/hooks/wallet/form/useUtxoSelection.ts` — line 63 already drafted elsewhere;
  rest of the file (the `useMemo`s for `composedInputs`/`preselectedUtxos`) correctly narrows deps.
- `packages/suite/src/hooks/wallet/useEvmNonceInfo.ts` — see exclusions above; the file's own
  `useMemo` (lines 86-94) correctly depends on primitives (`isEnabled`, `isLoading`) plus
  `transactions`/`data`, not a fresh default object.
- `packages/suite/src/hooks/wallet/form/useCompose.ts` and `.../form/useStakeCompose.ts` — both
  effects that could refire on `state` identity churn (`state?.feeInfo` dep) explicitly compare
  `state.feeInfo.blockHeight` against a ref before calling `composeRequest()`; this is the correct
  "derive, don't loop" pattern from the skill and the reason the whole earn/staking form family
  (F-01-8) doesn't escalate to a Class-2 loop despite feeding these hooks an unstable `state` object.
- `packages/suite/src/hooks/wallet/form/useFees.ts` — three watchers compare each field against a
  ref before calling `composeRequest`; same correct pattern.
- `packages/suite/src/hooks/wallet/trading/form/common/useTradingQuoteRequest.ts` — textbook use of
  `useCurrentRef(config)` to keep an unstable inline config object out of every effect's dependency
  array; `AbortController`-based cancellation is correct.
- `packages/suite/src/hooks/wallet/trading/form/common/useTradingFiatCryptoAmount.ts` — uses a plain
  `useRef` correctly for previous-value comparison (`previousFiatRef`), matching the skill's "good"
  example rather than misusing `useFreshRef`/`useCurrentRef`.
- All `useCurrentRef`/`useFreshRef` call sites read in this area — `useProxyImage.ts:42`,
  `useAllowanceCompose.ts:67,137`, `useAllowanceModal.ts:94-97`, `useAllowanceSend.ts:25-26`,
  `useTradingFindAccountOrToken.ts:56`, `useTradingQuoteRequest.ts:36`, `useExchangeDexQuote.ts:62-63,130`,
  `useTradingSellFormRedirectValues.ts:53` — are all "read the freshest value imperatively" use
  cases, the correct semantics for these helpers; none needs previous-value semantics (no Class 7
  misuse found in this area).
- `packages/suite/src/hooks/wallet/trading/form/common/useTradingCryptoAssetChange.ts:92-106` —
  depends on the whole `accounts` array, but the very first line of the effect body
  (`selectedAccountKey === account?.key`) returns before touching `accounts` in the steady state, so
  repeated `accounts` churn is not actually wasteful here. Same shape/same conclusion in
  `useTradingReceiveAddress.ts:144-173,175-291` (both effects guarded by `hasSelectionInitialized`
  early-returns) and `useTradingVerifyAccount.ts:159-186`.
- `packages/suite/src/hooks/wallet/trading/form/useTradingFormAccount.ts` — both effects already
  narrowed to `account?.key`/`accountKey`/`prefilled.key`/`prefilled.cryptoId`.
- `packages/suite/src/hooks/wallet/trading/useTradingDetail.ts` and
  `.../suite/useFirmwareUpgradeModal.ts` — both narrow `device`/`isConnectionModalOpen` effects to
  `device?.connected`, the correct pattern (contrast with F-01-4).
- `packages/suite/src/hooks/wallet/form/useCoinjoinRegisteredUtxos.ts` — memo correctly depends on
  `utxo` (destructured from `account`) and `sessionPrison`, not the whole `account`.
- `packages/suite/src/hooks/suite/useAppShortcuts.tsx` — global `keydown` listener registered once
  (`useEffect(..., [])`) with a manually-maintained "latest handler" ref, the correct hand-rolled
  equivalent of `useCurrentRef` for this case.
- `packages/suite/src/hooks/suite/useDiscovery.ts`, `useSelector.ts` (confirms the `shallowEqual`
  default cited in PROGRESS.md's ground truth), `useBridgeDesktopApi.ts`, `useFilteredModal.ts`,
  `useCancelTxContext.ts`, `general/usePagination.ts`, `settings/backends/useBackendReconnection.ts`,
  `guide/useGuideLoadArticle.ts`, `guide/useGuideSearch.ts`, `coinjoin/useCoinjoinSessionPhase.ts`,
  `coinjoin/useCoinjoinAccountLoadingProgress.ts`, `wallet/form/useSendFormOutputs.ts`,
  `wallet/useSendFormFields.ts`, `wallet/useSendFormChangeHandlers.ts`, `wallet/useSendFormImport.ts`,
  `wallet/allowance/useAllowanceCompose.ts`, `wallet/allowance/useAllowanceModal.ts`,
  `wallet/allowance/useAllowanceSend.ts`, `wallet/trading/form/common/useTradingClearStaleQuotes.ts`,
  `.../useTradingCurrencySwitcher.ts`, `.../useTradingFormReset.ts`, `.../useTradingSendAssetBalance.ts`,
  `wallet/trading/form/exchange/useExchangeFormInputs.ts`, `wallet/trading/form/sell/useSellFormInputs.ts`,
  `wallet/trading/form/buy/useBuyQuotes.ts`, `wallet/trading/form/sell/useSellQuotes.ts`,
  `settings/backends/useBackendsForm.ts` (the one `eslint-disable` there intentionally resets local
  form state only on `symbol` change to avoid clobbering in-progress edits — not a staleness bug),
  `wallet/trading/form/buy/useTradingBuyForm.ts` (`setValue`-only effect omitting the always-stable
  `setValue` itself), `wallet/trading/form/common/useTradingComposeTransaction.ts`'s first effect and
  third effect (the omitted `setShowReserveBanner` there is a parent `useState` setter, always
  stable) — read in full; no additional findings beyond what's listed above.
