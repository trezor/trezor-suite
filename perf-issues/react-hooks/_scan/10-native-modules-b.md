# Scan area 10 — suite-native remaining `module-*` + `app`

Base commit `9e0d5b6a45`. Scope: every `suite-native/module-*` except `module-trading`, `module-earn`,
`module-send` (area 09), plus `suite-native/app/**`. Concretely: `module-accounts-import`,
`module-accounts-management`, `module-activity-center`, `module-add-accounts`,
`module-authenticity-checks`, `module-authorize-device`, `module-check-backup`, `module-connect-popup`,
`module-demo-account-questionnaire`, `module-dev-utils`, `module-device-onboarding`,
`module-device-settings`, `module-home`, `module-onboarding`, `module-passphrase`, `module-receive`,
`module-settings`, `module-stellar-token-management`, `module-transactions`, `app`. `module-notifications`,
`module-security`, `module-staking` named in the task prompt do not exist at this commit — not a scan
gap, the directories aren't there (`module-activity-center` is presumably the closest living relative of
"notifications").

**Method:** built an exact file list (528 non-test `.ts`/`.tsx` files under each module's `src/` +
`app/src/`, excluding the stale `libDev` build-output mirrors that duplicate the tree and inflate a naive
`find`). Ran the class-1/2/3/6/7 grep signatures from the brief across that exact list (not sampled),
then read every hit plus the brief's Method-mandated hot paths (home graph, receive flow, account/tx
detail) end to end, tracing selector definitions into `suite-common`/`suite-native/*` shared libs where
the re-render/refetch question actually resolves.

## Note on the task prompt's C1 claim

The prompt states "candidates C1 has several [eslint-disable exhaustive-deps] in
module-accounts-management, module-authorize-device, module-connect-popup, module-onboarding." Verified
both against `00-candidates.md` and a direct repo grep: **none of those four modules contain an
`exhaustive-deps` disable** at this commit. The six that actually exist in this area's scope are in
`module-accounts-import` (1), `module-check-backup` (1), and `module-device-onboarding` (4) — see
`00-candidates.md` C1. All six are reviewed below (F-10-2, F-10-5, "Checked, clean").

## F-10-1 — `AccountImportConfirmFormScreen`'s token selector is unmemoized, so the screen and its `FlashList` re-render on every store dispatch while any known token has a balance

- **Class:** 3 (selector returns fresh reference) compounded by 1 (fresh `?? []` argument crossing into
  the selector call).
- **Where:** `suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx:60-62,68`
  (the `useSelector` call and the `nonEmptyTokens` derivation that consumes it), root cause in
  `suite-common/token-definitions/src/tokenDefinitionsSelectors.ts:44-51`
  (`selectFilterKnownTokens`).
- **Trigger cadence:** every store dispatch while this screen is mounted (the account-import confirmation
  step), whenever `selectFilterKnownTokens`'s filter result is non-empty.
- **Severity guess:** P2 — real and unbounded for the lifetime of one screen (not per-keystroke, not a
  root provider), confined to a single, short-lived screen with exactly one call site.
- **Confidence:** high. Read `selectFilterKnownTokens`'s full body and confirmed it is a plain function,
  not wrapped in `createSelector`/`createWeakMapSelector` — only its `returnStableArrayIfEmpty` wrapper
  stabilizes the **empty** case; any non-empty result is a freshly-`.filter()`'d array on every
  invocation. `useSelector` calls its selector argument on every dispatch to diff the result, and native
  `useSelector` (bare `react-redux`, confirmed repo-wide ground truth) uses reference equality, so a fresh
  array on every dispatch re-renders the component every time, regardless of whether tokens changed.

### Before (verbatim from the file)

```tsx
// suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx:60-68
const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
    selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? []),
);

const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
    selectAccountsByNetworkAndDeviceState(state, PORTFOLIO_TRACKER_DEVICE_STATE, symbol),
);

const nonEmptyTokens = knownTokens.filter(info => parseFloat(info.balance ?? '0') > 0);
```

```ts
// suite-common/token-definitions/src/tokenDefinitionsSelectors.ts:44-51
export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
    tokens: TokenInfo[],
) =>
    returnStableArrayIfEmpty(
        tokens.filter(token => selectCoinDefinition(state, symbol, token.contract as TokenAddress)),
    );
```

### Proposed fix

Wrap `selectFilterKnownTokens` with `createWeakMapSelector` (keyed on `state`, `symbol`, and the `tokens`
array reference) so a repeat call with the same inputs returns the cached array instead of a fresh
`.filter()` result. Independently, fix the call site's `accountInfo.tokens ?? []`: since `accountInfo` is
a stable prop (navigation param, not recreated per render), hoist a module-level `const EMPTY_TOKENS:
TokenInfo[] = []` instead of an inline `?? []`, so the argument itself is stable even before the selector
is fixed.

### Why it matters

`AccountImportConfirmFormScreen` renders a `FlashList` of `nonEmptyTokens` plus the account-label `Form`.
Every unrelated Redux dispatch that happens to land while this screen is open (blockchain/discovery
events for any enabled account, not just the one being imported) re-renders the whole screen and hands
`FlashList` a new `data` array reference, which is more disruptive to `FlashList`'s internal recycling
than a plain re-render.

## F-10-2 — `AccountImportLoadingScreen`'s retry flow calls a stale `handleResult` closure without awaiting the retry, so tapping "Try Again" can re-show the same error before the retry resolves

- **Class:** 6 (`eslint-disable react-hooks/exhaustive-deps` with a dependency array that omits a value
  the callback actually reads through a stale closure).
- **Where:** `suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx:56-73`
  (`safelyShowImportError`, deps `[error, showImportError]`, omitting `handleResult`) called from
  `:79-88` (`handleResult`, itself not memoized) and `:81` (the exact call). Co-anchor:
  `suite-native/module-accounts-import/src/useShowImportError.ts:81-91` (`onPressPrimaryButton: onRetry`
  fires on a user tap, arbitrarily later).
- **Trigger cadence:** once per user tap of "Try Again" on the import-error alert.
- **Severity guess:** P2 — not a render loop, but a real correctness bug in an error-recovery path with
  direct user impact (retry may appear to silently re-fail).
- **Confidence:** medium — the closure-staleness mechanism is fully traced and verifiable from the code
  (see Before), but I did not run the app to confirm the exact race resolves the way I describe on-device;
  React's state-update batching could narrow or widen the window.

### Before (verbatim from the file)

```tsx
// suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx:56-73
const safelyShowImportError = useCallback(
    async (onRetry?: () => Promise<void>) => {
        await resolveAfter(1000);
        showImportError(error, () => {
            if (!onRetry) return;
            onRetry();

            // This is needed because handleResult calls safelyShowImportError, which calls handleResult,
            // so one of them is always going to be used before it was defined. However, the functionality is fine here so it's not a problem.
            // eslint-disable-next-line @typescript-eslint/no-use-before-define, react-hooks/immutability
            handleResult();
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error, showImportError],
);
```

`onRetry` here is `fetchAccountInfo` (line 81), an `async` function. It is invoked without `await`, and
`handleResult()` — a plain, unmemoized closure captured whenever `safelyShowImportError` was last created
— runs on the very next line, reading `error`/`accountInfo` from whatever render produced _that_ closure,
not from the retry's eventual outcome.

### Proposed fix

Await the retry before deciding what to do next, and stop relying on a closure-captured `handleResult`:
`await onRetry?.()` inside the alert callback, then re-derive the "did it succeed" check from the
callback's own return value or from state read imperatively at that point, rather than calling a
pre-existing `handleResult` reference. This removes the temporal-dead-zone problem that forced the
disable in the first place.

### Why it matters

The code comment already flags the mutual-recursion awkwardness but concludes "the functionality is fine
here" — tracing the actual call order shows the retry's result is not awaited before `handleResult()`
re-checks `error`/`accountInfo`, so the error alert can plausibly reappear (or the retry's outcome can be
silently dropped) exactly when a user is trying to recover from a failed account import.

## F-10-3 — `AccountDetailContentScreen`'s analytics-report effect depends on the whole `account` object, so it refires (and double-reports) on every data update to the currently-viewed account

- **Class:** 1 (minimal required dependencies — "`accountKey`, not `account`" — applied to an effect
  rather than a fetch).
- **Where:** `suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx:24-39`.
  Co-anchor: `suite-native/module-accounts-management/src/screens/AccountDetailScreen.tsx:36-38`, where
  `account` is sourced from `selectAccountByKey` (memoized, `.find()`-based — confirmed in
  `_scan/08-native-shared.md`'s clean list — so it returns a **new** reference precisely when that
  account's Redux entry is genuinely replaced: new transaction, balance/history update, label change,
  etc., not on unrelated renders).
- **Trigger cadence:** every time the open account's data updates while this screen is focused — bounded
  by real blockchain/backend activity, not per-render, but well above "once per screen view."
- **Severity guess:** P2 — not a performance/render-loop issue (the re-render itself is legitimate,
  content actually changed), but a data-quality bug: `assetDetailEvent` analytics fires again on every
  refresh of the account being viewed, not once per navigation.
- **Confidence:** high on the mechanism; medium on real-world frequency (depends on how often the
  specific account being viewed receives new transactions/balance updates while the screen stays open).
  This file is also cited in `perf-issues/scheduling/p1-17-...md`, but that doc is about
  `AccountDetailGraph`'s refetch-vs-navigation-transition race (a different line, different mechanism,
  same screen) — no overlap with this finding.

### Before (verbatim from the file)

```tsx
// suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx:24-39
const token = useSelector((state: TokensRootState) =>
    selectAccountTokenInfo(state, account.key, tokenContract),
);

useEffect(() => {
    if (account) {
        analytics.report({
            type: events.assetDetailEvent.name,
            payload: {
                assetSymbol: account.symbol,
                tokenSymbol: token?.symbol,
                tokenAddress: token?.contract,
            },
        });
    }
}, [account, token?.symbol, token?.contract, analytics, token]);
```

(Note the dep array also lists both `token` and its two destructured fields — redundant, and a sign the
array was widened rather than narrowed while chasing a lint warning.)

### Proposed fix

Depend on `account.key` (already available, a stable string) instead of `account`, and drop the
redundant `token`/`token?.symbol`/`token?.contract` triple down to the two primitive fields actually used
in the payload:

```tsx
useEffect(() => {
    analytics.report({
        type: events.assetDetailEvent.name,
        payload: {
            assetSymbol: account.symbol,
            tokenSymbol: token?.symbol,
            tokenAddress: token?.contract,
        },
    });
}, [account.key, token?.symbol, token?.contract, analytics]);
```

(`account` is a required prop here, not optional, so the `if (account)` guard was already dead code.)

### Why it matters

Account Detail is one of the most frequently visited screens in the app. As written, every balance tick
or new transaction for the account the user happens to be looking at fires another `assetDetailEvent`,
so the metric silently stops meaning "the user opened this asset's detail screen" and starts meaning
"...and then some unrelated amount of data refreshed while they stayed there."

## F-10-4 — `useDayCoinPriceChange` computes a derived percentage via a second `useEffect` + `setState` instead of `useMemo`, costing an extra render on every price refresh

- **Class:** 2 / native rule (d), derived-state-in-effect.
- **Where:** `suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts:82-88`. Sole
  consumer: `suite-native/module-accounts-management/src/components/AssetPriceCard.tsx:74-77`.
- **Trigger cadence:** once on mount and again every 30s poll tick (`REFRESH_INTERVAL`, line 22) for as
  long as `AssetPriceCard` is mounted on the Account Detail screen.
- **Severity guess:** P3 — single, non-list component; the extra render is real but cheap and infrequent.
- **Confidence:** high on the mechanism (this is the skill's canonical "state that can be computed from
  what you already have" shape, verbatim).

### Before (verbatim from the file)

```ts
// suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts:82-88
useEffect(() => {
    if (isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)) {
        setValuePercentageChange(percentageDiff(weekAgoValue, currentValue.toNumber()));
    } else {
        setValuePercentageChange(null);
    }
}, [currentValue, weekAgoValue]);
```

### Proposed fix

Derive it during render — no state, no second effect:

```ts
const valuePercentageChange =
    isNotNullOrUndefined(currentValue) && isNotNullOrUndefined(weekAgoValue)
        ? percentageDiff(weekAgoValue, currentValue.toNumber())
        : null;
```

Drop the `valuePercentageChange`/`setValuePercentageChange` `useState` entirely.

### Why it matters

Every time the hook's first effect resolves a new price pair (mount, and every 30s thereafter),
`currentValue`/`weekAgoValue` update, the component renders once with the new prices but a stale
`valuePercentageChange`, then the second effect fires and forces a second render with the corrected
value — a guaranteed double-render per price refresh for no reason, since the value is a pure function of
state already in hand.

## F-10-5 — `DeviceTutorialScreen` pairs `useFocusEffect` (re-runs on every focus) with an empty dependency array and a comment claiming "first render only," permanently freezing the `device` it acts on

- **Class:** 6 (`eslint-disable react-hooks/exhaustive-deps` whose stated intent contradicts the hook
  actually used).
- **Where:** `suite-native/module-device-onboarding/src/screens/DeviceTutorialScreen.tsx:22-38`.
- **Trigger cadence:** every time this screen regains focus (if reachable more than once) — unknown
  today whether that happens in practice.
- **Severity guess:** P3 — I could not find a back-navigation path onto this screen in this area's slice
  of the navigator (it's reached via `navigation.replace`, which removes the previous screen from the
  stack), so it is plausibly equivalent to mount-once today.
- **Confidence:** medium. The mismatch between the hook's documented semantics and the comment is certain
  (read verbatim below); whether it's currently exercised more than once is not something I could fully
  rule out without tracing every navigator that can push/replace onto `DeviceTutorial`.

### Before (verbatim from the file)

```tsx
// suite-native/module-device-onboarding/src/screens/DeviceTutorialScreen.tsx:19-38
export const DeviceTutorialScreen = ({
    navigation,
}: StackProps<DeviceOnboardingStackParamList, DeviceOnboardingStackRoutes.DeviceTutorial>) => {
    const device = useSelector(selectSelectedDevice);
    useInterceptNativeNavigation();

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

### Proposed fix

Either (a) the intent is genuinely "run once, ever" — use a plain `useEffect(() => {...}, [])` instead of
`useFocusEffect`, since `useFocusEffect`'s entire purpose is re-running on focus; or (b) the intent is
"re-show the tutorial trigger with the current device every time this screen is focused" — in which case
add `device` to the `useCallback` deps and drop the disable. Either reading is a one-line fix; the current
combination asserts both semantics at once and they don't agree.

### Why it matters

If a future navigator change ever pushes (rather than replaces) onto this screen, or renders it inside a
navigator that preserves mounted screens, `useFocusEffect` will fire again on refocus but with the
`device` object frozen from the very first focus — silently calling `TrezorConnect.showDeviceTutorial`
with a stale device if the connected device changed in between. No lint error would catch this; the
suppression is exactly the "lying dependency array" shape the skill warns about, whether or not it is
live today.

## F-10-6 — `TransactionDetailScreen`'s analytics-report effect has the same whole-object dependency shape as F-10-3, lower frequency

- **Class:** 1 (minimal required dependencies).
- **Where:** `suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:58-69` (deps
  `[transaction, tokenTransfer, analytics]`); `transaction` sourced from
  `suite-native/transaction-management/src/hooks/useTransactionDetails.ts:28-33`
  (`selectTransactionByAccountKeyAndTxid`, a keyed store lookup — not verified memoized to the same
  standard as `selectAccountByKey`, see Confidence). This file is also cited in
  `perf-issues/scheduling/p1-03-...md` at line 53 (`useFetchMissingTransactionFiatRates`) — a different
  line and a different concern (asymptotic scan cost vs. this effect's dependency shape); no overlap.
- **Trigger cadence:** every time the open transaction's own record updates (e.g. pending → confirmed) —
  a transaction typically makes that transition once, so this is much lower-frequency than F-10-3's
  whole-account case.
- **Severity guess:** P3 — same mechanism as F-10-3, but the triggering object (`transaction`) changes far
  less often than `account` does in practice (one confirmation transition vs. every balance/history tick).
- **Confidence:** medium — I did not trace `selectTransactionByAccountKeyAndTxid`'s own memoization the
  way F-10-3's `selectAccountByKey` was independently confirmed clean in area 08; if it turns out to
  return a fresh object on unrelated dispatches (unlike the accounts selector), this would be as frequent
  as F-10-3, not rarer.

### Before (verbatim from the file)

```tsx
// suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:58-69
useEffect(() => {
    if (transaction) {
        analytics.report({
            type: events.transactionDetailEvent.name,
            payload: {
                assetSymbol: transaction.symbol,
                tokenSymbol: tokenTransfer?.symbol,
                tokenAddress: tokenTransfer?.contract,
            },
        });
    }
}, [transaction, tokenTransfer, analytics]);
```

### Proposed fix

Same shape as F-10-3: depend on the stable identifiers already destructured from `route.params`
(`txid`, `accountKey`) instead of the `transaction`/`tokenTransfer` objects derived from them.

### Why it matters

Same data-quality concern as F-10-3 (duplicate `transactionDetailEvent` reports), scoped to whatever rate
the viewed transaction's own record changes while the detail screen is open.

## Checked, clean

- **Home screen portfolio graph** (`PortfolioGraph.tsx`, `PortfolioLineGraph.tsx`,
  `homescreenSelectors.ts`, all of `module-home`): every selector consumed is either a named,
  `createWeakMapSelector`-based selector from `@suite-native/graph`/`@suite-common/device` (package
  already swept clean in area 08) or a direct state-path read; no inline derivation in the module-home
  layer itself. `HomeScreen.tsx`, `TransferButtons.tsx`, `HomescreenAlerts.tsx`,
  `SuiteSyncKeysAlert.tsx`, etc. — every `useSelector` in this module resolves to a plain named selector,
  none matched the fresh-reference grep signatures.
- **Receive flow** (`module-receive`, the brief's named hot path): `ReceiveAddressListScreen.tsx`,
  `ReceiveAddressListGenerateButton.tsx`, `ReceiveAddressCard.tsx`, and `module-receive/src/selectors.ts`
  — the local selectors file is a model example: `createWeakMapSelector`-wrapped where derivation happens
  (`selectReceiveAccountSuiteSyncAddressLabels`, `selectReceiveAccountLabeledUnusedAddresses`) with
  module-level `EMPTY_ADDRESS_LABELS`/`EMPTY_RECEIVE_INFOS` constants (the skill's own "good" pattern),
  and plain pass-throughs elsewhere that delegate to already-memoized `suite-common` selectors
  (`selectAccountByKey`, `selectTouchedAddresses`, `selectPendingAccountAddresses` — each individually
  confirmed `createMemoizedSelector`-based by reading their definitions). `ReceiveAddressListScreen.tsx`'s
  own `useMemo`/`useCallback` deps are correctly narrowed (`addresses.length`, `currentFreshAddress?.path`,
  not the whole array/object).
- **`suite-native/app` root composition** (`App.tsx`, `useGlobalHooks.tsx`,
  `RootStackNavigatorGlobalHooksWrapper.tsx`, `ModalsRenderer.tsx`, `BannersRenderer.tsx`,
  `useReportAppInitToAnalytics.ts`, `InitRoseniteDevTools.tsx`): both `useEffect`s in `App.tsx` key on
  stable/primitive deps (`dispatch`, `isAppReady`) and the mount-dispatch is additionally ref-guarded.
  `FormatterProvider config={formattersConfig}` — `useFormattersConfig` returns a fresh object per render
  by design, but this is already documented as the _correct_ reference pattern in `_scan/06-suite-common.md`
  F-06-2, not a new finding. No `Context.Provider` is authored directly in `app/src` — all providers are
  imported from already-audited packages.
- **`useGlobalHooks.tsx`'s `useReportDeviceCompromised({ device })`**: the inline `{ device }` wrapper
  crosses into `@suite-common/firmware-authenticity/src/useReportDeviceCompromised.ts`, which looked like
  a class-1 cross-hook-boundary risk at first read, but `useCommonData` (line 25-35 of that file)
  immediately destructures `device` into four primitives and memoizes on those, never on `device` or the
  wrapper object itself — correctly narrowed, matches the skill's own prescription exactly.
- **`useConnectPopupNavigation.ts`** (`module-connect-popup`, mounted once at the app root via
  `useGlobalHooks`, so any instability here would be highest-blast-radius): all three effects' object
  deps (`connectPopupCall` from `selectConnectPopupCall`, `walletConnectProposal` from
  `selectPendingProposal`) resolve to plain `state.x.y` property reads in their reducers — confirmed by
  reading both selector definitions — so they're stable across unrelated dispatches; the third effect
  additionally self-guards via a `lastProposalId` ref keyed on `eventId`.
- **`ConnectPopupScreen.tsx`**: `setAddressConfirmation(popupCall)` inside a `useEffect` whose own deps
  include `addressConfirmation` looks like derived-state-in-effect at first glance, but (a) `popupCall`
  is stable (see above) so the effect isn't refiring per-render, and (b) the self-referential dependency
  is a legitimate "remember a value across a later, different Redux state" bridge (the confirmation data
  is gone from `popupCall` by the time state reaches `'deeplink-callback'`), not simple derivable state.
  It repeats itself exactly once per relevant transition and then bails via `Object.is` on the identical
  `popupCall` reference — bounded, not filed.
- **`AccountDetailGraph.tsx`**: `accountItem` from `selectAccountItemForGraph`
  (`module-accounts-management/src/selectors.ts:31`) is `createWeakMapSelector`-based;
  `accounts = useMemo(() => accountItem ? [accountItem] : undefined, [accountItem])` correctly narrowed;
  `graphInstanceId` is recomputed every render via `getAccountGraphInstanceId` but returns a primitive
  string, so its presence in the cleanup-effect's deps is harmless regardless.
- **`module-device-settings/src/selectors.ts`** (`selectDeviceAutoConnectCredentials`, a C4b candidate):
  the `?? []` fallback lives inside a `createWeakMapSelector` combiner — reselect-style memoization
  returns the same cached array between recomputations of its own inputs (`device`, `thpCredentials`),
  so the fallback allocation only happens on genuine input changes, not per render.
- **`useInactiveStellarTokens.ts`** (C4b candidate, `?? []` at line 52): the value it's derived from,
  `coinDefinitions?.data`, traces back to `selectCoinDefinitions` — a plain `state.tokenDefinitions?.[symbol]?.coin`
  property read, stable unless that state slice is genuinely replaced; the surrounding `useMemo`s are
  correctly keyed on that stable reference.
- **`AccountAssetsScreen.tsx`** (C3 candidate): all four `useSelector` calls
  (`selectAccountByKey`, `selectAccountListSectionsWithZeroBalanceGroup`,
  `selectAccountDefiTokensCount`, `selectAccountManuallyHiddenTokensCount`) resolve to memoized
  selectors; the `sections.filter(...)` at line 72 is render-body work over a small, bounded per-account
  section list and native is compiled — not reportable per this area's native rules regardless.
- **`AddCoinDiscoveryFinishedScreen.tsx`** (C3 candidate): `selectDeviceAccountsByNetworkSymbol` is
  `createMemoizedSelector`-based; the trailing `.filter(a => !a.empty)` runs on the render body only
  (feeds JSX directly, not a further hook dependency) — not reportable on native.
- **`AccountsScreen.tsx`**'s `networksFilter` `useMemo` (C4 candidate): same reasoning already
  established in `_scan/08-native-shared.md` F-08-4 — the memo's dependency
  (`route.params?.networksFilter`) only changes on genuine navigation-param changes, so the `?? []`
  fallback allocation is correctly gated.
- **`WalletConnectSessionPopupScreen.tsx`** (C4/C3 candidate): `selectAllAccountsToList` is
  `createMemoizedSelector`-based; `selectPendingProposal` is a plain stable state-path read; the
  `selectableAccounts` `useMemo` deps are therefore both legitimately stable.
- **`MessageSystemManagerScreen.tsx`** (C4 candidate, dev-only debug screen): `selectMessageSystemConfig`
  is a plain `state.messageSystem.config` read, stable; the `filteredActions` `useMemo` is correctly
  gated on it.
- **Four of the six C1 `eslint-disable exhaustive-deps` sites are the accepted "run exactly once, using
  the mount-time closure" idiom**, matching the precedent already established for
  `FirmwareInstallationScreenContent.tsx` in `_scan/08-native-shared.md`: `DeviceAuthenticityScreen.tsx:38-43`,
  `DeviceDisconnectedScreen.tsx:49-71`, `UninitializedDeviceLandingScreen.tsx:131-142`, and
  `useCheckBackupOnMount.tsx:29-67` (this last one's captured `dispatch`/`navigation`/`analytics` are each
  independently stable, so there is no closure-staleness risk to flag, unlike F-10-2).
- **`DeviceAuthenticityStackNavigator.tsx`**: the `checkDeviceAuthenticity`/`handleSuccess`/`handleFailure`
  effect is self-guarded by an `isAuthenticityCheckStarted` state flag, so it's bounded to one dispatch
  regardless of whether those callbacks are stable across renders.
- **`AddCoinDiscoveryRunningScreen.tsx`** (C9-adjacent): the `changeCoinVisibility` dispatch branch is
  guarded by `!enabledNetworkSymbols.includes(networkSymbol)`, which becomes false once the dispatch's
  own effect lands in the store — self-terminating on data content, not on reference identity, so it
  doesn't matter whether `enabledNetworkSymbols` itself is a stable reference.
- **`ConnectBluetoothDeviceScreen.tsx` / `TurnOnAndUnlockDeviceScreen.tsx`** (bluetooth device list
  effects): both key on `selectNearbyPairableBluetoothDevices`, `createMemoizedSelector`-based in
  `suite-native/bluetooth` (package already broadly confirmed clean in area 08).
- **`useIsConnectPopupOpened.ts`**: standard React Navigation `getParent()`/`addListener('state', ...)`
  idiom; `rootNavigation` is a library-managed stable reference.
- **`ManualTokenInputScreen.tsx`** (stellar token add flow): its two validation effects key on primitive
  strings (`assetCode`, `issuerAddress`) only — standard validate-on-change, no instability.
- **Full `useEffect` inventory across all 528 in-scope files** (one exhaustive grep, not a sample): every
  call site was read in context; besides the six findings above, the remainder are either keyed on
  primitives, cleanup-only, guarded by a ref/state flag that self-terminates after one run, or (for
  `useStellarFeeScreen.ts`'s sheet reveal/close effect) call idempotent UI actions where even an unstable
  dependency wouldn't produce an observable bug — not filed for that reason.
- **Zero `watch()` calls, zero `useFreshRef`/`useCurrentRef` sites** anywhere in this area's scope,
  confirmed by grep against the exact 528-file list (matches C2's repo-wide "0" and extends area 08's
  "all 41 `useFreshRef`/`useCurrentRef` sites live in `packages/suite` or `module-trading`" finding to the
  rest of `module-*`).
- **Class 4 (render-body relocation) and class 5 (Provider-value memoization) are out of scope for this
  entire area**: every file here is `suite-native` (React-Compiler-compiled) or the compiled app shell;
  class 5 is explicitly web-only per the brief, and class 4 render-body work is compiler-handled on
  native, so neither was evaluated as a finding source here even where `.filter`/`.map` appear in render
  bodies.
