# Scan area 08 — suite-native shared libraries (not module-*, not app)

Base commit `9e0d5b6a45`. Covers all non-`module-*`, non-`app` top-level `suite-native/*` packages:
`atoms`, `accounts`, `device`, `device-authorization`, `device-manager`, `device-bootloader-mode`,
`device-mutex`, `device-onboarding`, `transaction-management`, `transactions`, `navigation`, `forms`,
`graph`, `react-native-graph`, `trading-atoms`, `trading-residence`, `trading-state`, `trading-history`,
`trading-browser-auth`, `trading-analytics`, `trading-slippage`, `trading-consts`, `trading-debug`,
`trading-fixtures`, `trading-provider-utils`, `trading-quote-utils`, `trading-types`, `analytics`,
`analytics-redux`, `storage`, `state`, `formatters`, `formatters-config`, `intl`, `tokens`, `staking`,
`assets`, `discovery`, `bluetooth`, `biometrics`, `blockchain`, `passphrase`, `firmware`,
`confirm-on-trezor`, `banners`, `banner-flags`, `coin-enabling`, `icons`, `labeling`, `link`, `markdown`,
`message-system`, `qr-code`, `receive`, `scrollview`, `search`, `sentry`, `services`, `settings`,
`storybook`, `suite-sync`, `swipeable-walkthrough`, `theme`, `thp`, `toasts`, `tx-simulation`,
`video-assets`, `wallet`, `activity-center`, `add-coin-account`, `address`, `alerts`, `app-init`,
`clipboard`, `config`, `connection-status`, `experimental-features`, `feature-feedback`,
`feature-flags`, `feedback-form`, `helpers`, `in-app-rating`, `platform-encryption-native`,
`swipeable-walkthrough`, `test-utils`, `test-utils-store`.

**Repo ground truth confirmed independently while scanning:** every file read uses bare
`import { useSelector } from 'react-redux'` (reference equality, no `shallowEqual` wrapper) — matches
PROGRESS.md. Zero bare `.watch(` calls anywhere in this tree (`grep -rn "\.watch(\|[^e]watch("` returns
nothing outside `useWatch`) — C2's "0" is confirmed, not just unverified. Zero `useFreshRef`/
`useCurrentRef` usage anywhere in this tree — class 7 is a non-issue for this area specifically (all 41
repo-wide call sites from C8 live in `packages/suite` or `module-*`). This codebase's selector layer is
unusually disciplined: `suite-native/accounts`, `tokens`, `transactions`, `assets`, `discovery`,
`bluetooth`, `device`, `banners` all build on `createWeakMapSelector` (aliased `createMemoizedSelector`)
consistently, and several plain (non-memoized) selectors have an explicit code comment stating they
deliberately return a primitive so raw `useSelector` `===` doesn't over-render (e.g.
`selectSingleDeviceAccountKeyForNetworkSymbol`, `suite-native/assets/src/assetsSelectors.ts:109-110`).

Checked against exclusions per `grep -rl "<basename>" perf-issues/asymptotic-complexity
perf-issues/scheduling` plus the PROGRESS.md anchor list: `AccountsListTokenItem.tsx`,
`TransactionNotificationItem.tsx`, `EarnDepositsCardRow.tsx`, `TransactionList.tsx`'s `?? []` uses (all
inside an already-memoized `useMemo`, not the drafted `p1-16` balance-history reduction), native
SearchForm (`suite-native/search`), native graph refetch-on-navigation — none of my findings below
overlap these.

## F-08-1 — `useTranslatedMessages` derives i18n messages via `useState`+`useEffect` instead of `useMemo`, so the **entire app tree** double-renders (once with empty translations) on every cold start

- **Class:** 2 (effect that calls `setState`, immediately after mount, holding state that is fully
  computable during render — the SKILL's "state that can be computed from what you already have is not
  state" principle; native rule (d) derived-state-in-effect) — landing at the highest possible blast
  radius, the i18n Provider that wraps the whole app.
- **Where:** `suite-native/intl/src/hooks/useTranslatedMessages.ts:23-34` (the hook) consumed by
  `suite-native/intl/src/IntlProvider.tsx:24-35` (`<ReactIntlProvider messages={messages}>{children}</...>`,
  where `children` is the entire app — `IntlProvider` is a top-of-tree provider). Compounded by
  `suite-native/intl/src/hooks/useSystemLocaleListener.ts:19-31`, called from the same `IntlProvider`,
  which dispatches a possibly-different system locale on mount, so on a cold start where the OS locale
  differs from the persisted one there can be a _third_ full-tree render.
- **Trigger cadence:** every cold app start (mount of `IntlProvider`), unconditionally — not a rare edge
  case.
- **Severity guess:** P1 — the blast radius is the entire component tree (every `<Translation>` /
  `formatMessage` call in the app), and it happens on every launch, at the most latency-sensitive moment
  (time-to-interactive).
- **Confidence:** high. Read the full chain end-to-end: `LANGUAGE_TRANSLATIONS_MAP[locale]` entries are
  `require(...)`'d JSON, resolved synchronously at module load — there is no asynchronous reason for this
  to live in an effect at all.

### Before (verbatim from the file)

```ts
// suite-native/intl/src/hooks/useTranslatedMessages.ts:23-34
export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    useEffect(() => {
        const localizedMessages = LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale];

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [supportedLanguageLocale]);

    return messages;
};
```

```tsx
// suite-native/intl/src/IntlProvider.tsx:24-35
export const IntlProvider = ({ children }: { children: React.ReactNode }) => {
    useSystemLocaleListener();

    const locale = useSelector(selectLocale);
    const messages = useTranslatedMessages();

    return (
        <ReactIntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            {children}
        </ReactIntlProvider>
    );
};
```

### Proposed fix

Replace the `useState`+`useEffect` pair with a direct derivation (no effect needed at all, since the
lookup is synchronous):

```ts
export const useTranslatedMessages = () => {
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    return useMemo(
        () => ({ ...englishFallback, ...LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale] }),
        [supportedLanguageLocale],
    );
};
```

`useMemo` here is legitimate even under React Compiler because it changes _behavior_, not just
micro-optimizes: it makes the first render already carry the correct `messages`, instead of
initializing to `{}` and correcting one commit later.

### Why it matters

On mount, `messages` starts as `{}`. `react-intl`'s `IntlProvider` treats every translation id as missing
when `messages` is empty and calls its `onError` handler (`console.error` by default) once per missing
id — with dozens of `<Translation>` calls rendered on a typical first screen, this is dozens of
`console.error` calls on every cold start, which per this repo's own logging rules are Sentry-captured on
every platform. Immediately after, the effect fires, calls `setMessages`, and the **entire subtree under
`IntlProvider` — i.e. the whole app** — re-renders a second time with the real messages. This is not a
narrow, list-row-scoped defect; it is a guaranteed double-render (occasionally triple, see
`useSystemLocaleListener`) of the whole app on every single launch.

## F-08-2 — `usePinAction`'s `exhaustive-deps` suppression cites a dependency shape the code no longer has

- **Class:** 6 (pre-existing `eslint-disable react-hooks/exhaustive-deps`, C1 candidate) — the comment's
  stated reason doesn't match the current code, which is exactly the "lying dependency array" smell the
  skill warns about, even though I could not prove an active bug in either of today's two call sites.
- **Where:** `suite-native/device-authorization/src/hooks/usePinAction.tsx:86-145`. The suppressed
  `useFocusEffect`/`useCallback` is at lines 137-144; the dependency array it excludes `handlePinAction`
  from is the `useCallback` at line 135.
- **Trigger cadence:** every time this screen regains focus, or `isDeviceConnectionGuardVisible` flips
  false, while a stale `handlePinAction` closure could be in scope.
- **Severity guess:** P3 — the mismatch is real, but I traced every dependency of `handlePinAction`
  (`analytics` via `useServices(selectNativeAnalyticsDep)` — stable, confirmed the module-level selector
  and jotai-backed `showToast`/`showAlert` singletons; `device?.path` — a narrowed primitive; `navigation`
  — stable; `onSuccess`/`handleError` — confirmed stable in the
  `DevicePinProtectionStackNavigator.tsx:48` call site, `onSuccess: navigation.goBack`, no `onError`
  passed) and found it **fully stable in that caller today**, so the suppression there is provably
  unneeded rather than actively hiding a bug. The second caller
  (`module-device-onboarding/src/screens/CreatePinScreen.tsx:59-63`) passes `onSuccess`/`onError` as
  screen-local callbacks I did not verify (out of this area's remit).
- **Confidence:** medium — high confidence the comment is stale/inaccurate, medium confidence on whether
  it currently masks real staleness (would raise to P2/high if `handlePinCreated`/`handlePinCanceled` in
  `CreatePinScreen.tsx` turn out to be unstable across renders).

### Before (verbatim from the file)

```tsx
// suite-native/device-authorization/src/hooks/usePinAction.tsx:86-145
const handlePinAction = useCallback(async () => {
    // ...
    const result = await requestPrioritizedDeviceAccess(() =>
        TrezorConnect.changePin({
            device: { path: device?.path },
            remove,
        }),
    );
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

### Proposed fix

The comment's justification ("depends on device object") describes code from before `device` was
narrowed to `device?.path` (a primitive). Either: (a) re-verify and simply add `handlePinAction` to the
inner `useCallback`'s deps now that its only object-shaped input is narrowed, or (b) if a genuinely
unstable prop (`onSuccess`/`onError` in some caller) is the real reason, replace the suppression with a
`useEffectEvent`/ref-based "read latest `handlePinAction` imperatively" pattern so the rule stays live
instead of silenced.

### Why it matters

An `eslint-disable` whose comment no longer matches the code is exactly the situation the skill calls a
"lying dependency array" — the next person to touch this file has no reliable signal about what's really
being protected against, and if `CreatePinScreen.tsx`'s callbacks are ever made unstable (e.g. an inline
arrow introduced during a refactor), this suppression would silently start serving stale
`onSuccess`/`onError` closures with no lint error to catch it.

## F-08-3 — `FormState`-typed objects used as whole-object effect dependencies in the fee hooks

- **Class:** 1 (value crosses a prop/hook boundary as a whole object) + 2 (feeds effects that dispatch
  thunks) — the skill's "depend on the identifier, not the record" guidance, applied to a form snapshot
  instead of an account/device.
- **Where:** `suite-native/transaction-management/src/hooks/useMaxSpendableAmount.ts:55-98` (effect deps
  include `formState` directly) and `suite-native/transaction-management/src/hooks/fees/useCustomFee.ts:98-162`
  (`handleValuesChange`'s deps include `formState`, which then feeds the effect at line 151-162 via
  `debounce(handleValuesChange)`).
- **Trigger cadence:** would be "every render that produces a new `formState` reference" — cancels an
  in-flight `AbortController`-guarded fee calculation and restarts it (`useMaxSpendableAmount`), or resets
  the debounce timer before it fires (`useCustomFee`).
- **Severity guess:** P3. I verified `useMaxSpendableAmount`'s **only** current caller
  (`suite-native/module-trading/src/hooks/general/form/useContextForTradingForm.ts:34-38`) never passes
  `formState` at all (it's optional and omitted), so that instance is dormant today, not live. I could not
  verify `useCustomFee`'s `formState` (threaded in as a plain prop through
  `CustomFee.tsx`/`FeesContent.tsx`/`FeeSelector(Row).tsx`/`FeesBottomSheet.tsx`, all within this area,
  but originating from a caller in `module-send`, outside it) — if that source is a redux-persisted form
  draft (this repo's usual pattern, and likely given `selectFormDraftByPrefix` exists one file over in
  `suite-native/transaction-management/src/selectors.ts:134-145` for the same purpose, direct state
  lookups, not `getValues()` snapshots), this is a non-issue in practice.
- **Confidence:** medium — the dependency _shape_ is confirmed unstable-by-construction (a whole
  externally-supplied object, not narrowed to the primitive fields actually read), but whether either
  caller currently supplies an unstable reference is unresolved for one of the two (would need
  `module-send`'s draft-selector chain, out of this area, to close out `useCustomFee`; would drop entirely
  for `useMaxSpendableAmount` if no other caller is ever added).

### Before (verbatim from the file)

```ts
// suite-native/transaction-management/src/hooks/useMaxSpendableAmount.ts:55-98
useEffect(() => {
    if (!accountKey || !enabled || !symbol) {
        setMaxSpendableAmount(undefined);
        return;
    }
    if (tokenBalance) {
        setMaxSpendableAmount(tokenBalance);
        return;
    }
    const controller = new AbortController();
    const calculateMaxAmount = async () => {
        try {
            await dispatch(updateFeeInfoThunk({ networkSymbol: symbol })).unwrap();
            const { normal, economy, low, high } = await dispatch(
                calculateFeeLevelsMaxAmountThunk(
                    {
                        formState: formState ?? buildDefaultFormState({ tokenContract }),
                        accountKey,
                    },
                    { signal: controller.signal },
                ),
            ).unwrap();
            if (!controller.signal.aborted) {
                setMaxSpendableAmount(high ?? normal ?? low ?? economy);
            }
        } catch {
            if (controller.signal.aborted) return;
            setMaxSpendableAmount(undefined);
        }
    };
    calculateMaxAmount();
    return () => controller.abort();
}, [dispatch, accountKey, tokenContract, formState, tokenBalance, enabled, symbol]);
```

### Proposed fix

Narrow to what the effect actually needs to react to. If `formState` must be read at fetch time but the
effect shouldn't restart merely because the caller re-created the object, read it through a
`useEffectEvent` (already used correctly elsewhere in this area, see
`suite-native/trading-slippage/src/hooks/useSlippageLifecycle.ts:16,36`) so it's available imperatively
without being a reactive dependency. If specific `formState` fields (e.g. `selectedFee`) genuinely should
retrigger the calculation, destructure those primitives at the call site and pass them individually.

### Why it matters

Both hooks drive the "max spendable amount" / custom-fee-preview UI during active user input in a send
flow. If either upstream caller ever passes a freshly-constructed `formState` per render or per keystroke
(a live `getValues()` snapshot rather than a stable draft reference), the guarded async work
(`AbortController`, `debounce`) means it degrades gracefully rather than looping — but a value that
restarts every keystroke may never resolve while the user is actively typing.

## F-08-4 — `AccountsListWithFilter` copies a prop into state via an effect (derived-state-in-effect), currently inert only because every caller happens to pass a stable value

- **Class:** 2 (derived-state-in-effect, native rule (d)) — structurally the same shape as F-08-1 but far
  smaller blast radius (one screen, not the whole app) and currently never triggered.
- **Where:** `suite-native/accounts/src/components/AccountsListWithFilter.tsx:39,46,55-57`.
- **Trigger cadence:** would fire on every render where the `networksFilter` prop's reference changes;
  today it fires exactly once per mount because all 3 call sites pass a referentially stable value (a
  module constant default, or a `useMemo` in `AccountsScreen.tsx:25-28` keyed on `route.params`, which
  itself only changes when navigation params really change).
- **Severity guess:** P3 — verified inert today; flagged because the component's own contract (accepting
  an arbitrary `networksFilter?: NetworkSymbol[]` prop) invites a future caller to pass an inline array
  literal, silently reintroducing an extra render per parent re-render and (worse) discarding any
  in-progress user filter selection every time the parent re-renders.
- **Confidence:** high on the mechanism; the "currently inert" claim is confirmed by reading all 3
  callers (`AccountsScreen.tsx`, `ReceiveAccountsScreen.tsx`, `SendAccountsScreen.tsx`).

### Before (verbatim from the file)

```tsx
// suite-native/accounts/src/components/AccountsListWithFilter.tsx:35-57
export const AccountsListWithFilter = ({
    onSelectAccount,
    title,
    flowType,
    networksFilter = EMPTY_NETWORKS_FILTER,
    // ...
}: AccountsListWithFilterProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [filteredNetworks, setFilteredNetworks] = useState<NetworkSymbol[]>(networksFilter);
    // ...
    useEffect(() => {
        setFilteredNetworks(networksFilter);
    }, [networksFilter]);
```

### Proposed fix

Derive instead of duplicating: either drop the local echo entirely and treat `networksFilter` as the
source of truth for the "no user override yet" case (track only the user's override in state, defaulting
to the prop when absent), or — if the reset-on-prop-change behavior is intentional (clearing a user's
local filter edits whenever the caller's base filter changes) — key a `useState` initializer off a
`key` prop instead of syncing via effect, per React's documented "resetting state with a key" pattern.

### Why it matters

Not live today, but it is exactly the anti-pattern this skill's "distinguish a wasted memo from a render
loop" section calls out — "state that can be computed from what you already have is not state" — and it's
one call-site change away from becoming an active extra-render-per-parent-render bug, or a UX bug (a
user's in-progress network filter selection getting silently reset if the parent ever re-renders with a
fresh-but-equal `networksFilter` array).

## Checked, clean

- **Per-row FlashList/FlatList item components (the hot path this sweep prioritized):**
  `TransactionListItem.tsx`, `TokenTransferListItem.tsx`, `TransactionListItemContainer.tsx`
  (`suite-native/transactions`) — every `useSelector` resolves to either a `createWeakMapSelector`
  (`selectAccountByKey`, `selectTransactionBlockTimeById`) or a selector that only ever returns a
  primitive or an existing-array-element reference (`selectIsPhishingTransaction` — unmemoized but
  returns one of a handful of module-level singleton constants by design, comment at
  `token-definitions/src/phishing/utils.ts:102`; `selectTransactionFiatRate` — direct nested-property
  lookup, primitive). `AccountsListItem.tsx`, `TokenBadge`, `AssetItem.tsx`, `AdaAccountsListStakingItem.tsx`,
  `AccountsListNetworkGroup.tsx`, `AccountsListAccountTypeGroup.tsx`, `WalletItem.tsx`/`WalletItemBase.tsx`,
  `TradeHistoryListItem.tsx` (no `useSelector` at all) — same story, verified each selector individually
  (`selectFormattedAccountType`, `selectActiveAndDefiTokensCount`, `selectAccountFiatBalance`,
  `selectAccountHasStaking`, `selectHasDeviceAnyFailedAccountForNetworkSymbol`,
  `selectSingleDeviceAccountKeyForNetworkSymbol`, `selectHasDeviceAnyTokensForNetwork`,
  `selectHasAnyDeviceAccountsWithStaking`, `selectIsCardanoStakedWithFiveBinaries`,
  `selectIsCardanoStakedOutsideEverstake`, `selectFilteredDeviceAccountsByNetworkSymbolAndAccountType`,
  `selectDeviceTotalFiatBalanceByDeviceState`) are each either weak-map memoized or explicitly documented
  to return a primitive.
- **`TransactionList.tsx`** (`suite-native/transactions`): the `?? []` hits at lines 218/231/247 are
  local intermediate values _inside_ an already-correct `useMemo(..., [transactions, tokenContract])` —
  they never reach the dependency array, so they don't reproduce the skill's canonical bug shape. Its
  selectors (`selectAccountTransactionsWithTokenTransfers`,
  `selectAccountStakeTypeTransactionsWithTokenTransfers`) are `createWeakMapSelector`-based.
- **`useResolvedAccountKey.ts`** (C9 candidate, `suite-native/accounts/src/hooks`): effect deps include
  the whole `account` object (line 66), but `account` comes from `selectAccountByKey` — memoized,
  `.find()`-based, so it's a stable reference that only changes when the account's data genuinely
  changes; using the whole object here is appropriate (the effect reads `account.symbol`/`.accountType`/
  `.index`), not the "fresh object every render" failure mode C9 screens for.
- **`NetworkFilterBottomSheet.tsx`** (`suite-native/accounts`, C10 candidate): its
  `useEffect(() => setPendingSelection(selectedNetworks), [selectedNetworks])` looks like F-08-4's shape
  but is a legitimate "draft that resyncs to the committed value, but allows local edits before commit"
  pattern (`selectedNetworks` only changes via explicit Apply/Clear button presses in the parent, and a
  `useRef` mirrors the committed value for the Dismiss-without-saving case) — bounded by user action, not
  by render cadence.
- **`useCustomFee.ts`** (`suite-native/transaction-management/src/hooks/fees`): correctly uses
  `useWatch`/`useFormContext` (never bare `watch()`); the `getValues()` call at line 71 is intentionally
  non-reactive (relies on the sibling `useWatch` calls to trigger the re-render that makes the fresh
  `getValues()` read current) — a recognized RHF pattern, not a bug. See F-08-3 for the one real concern
  in this file.
- **`TextButton.tsx`** (`suite-native/atoms`, C10 candidate): its effect calls `setAnimatedColor`, which
  mutates a Reanimated `useSharedValue.value` — not a React `setState` — so it cannot trigger the
  "effect stores fresh reference → re-render → new reference" cycle the skill describes; independent of
  whether `setAnimatedColor`'s identity is stable across renders (not reportable regardless, since native
  is compiled).
- **`AnimatedLineGraph.tsx`** (`suite-native/react-native-graph`, 3 of the 5 C1 candidates): all three
  `eslint-disable`s are Reanimated-specific — the omitted dependencies (`commands`, `startPulsating`) are
  `useSharedValue` objects or callbacks built only from `useSharedValue`s, which are ref-like and
  referentially stable regardless of whether they're listed, so the suppressions are legitimate
  ESLint-can't-prove-it-but-it's-fine cases, not staleness bugs. `setFingerX`'s disable (line 396,
  extra `pathRange.x` dependency) is a documented Reanimated-worklet quirk ("IDK why"), unrelated to
  React re-render mechanics.
- **`FirmwareInstallationScreenContent.tsx:208-218`** (C1 candidate): the empty-deps effect is a
  deliberate run-once-on-mount kickoff (`setTimeout` then `startFirmwareUpdate()`), the standard and
  accepted shape for "do X once using the initial closure."
- **`useFirmware.tsx`** (`suite-native/firmware`): the "maybe stuck" timeout effect
  (`[progress, status, setMayBeStuckedTimeout, resetMayBeStuckedTimeout]`) resetting on every `progress`
  tick is the intended behavior (reset the stuck-timer on real progress), not a bug.
- **`Graph.tsx`** (`suite-native/graph`): the `delayedLoading` effect only depends on the `loading`
  boolean prop — a deliberate flicker-avoidance delay, bounded, unrelated to the already-excluded
  `p1-16`/`p1-17` balance-history/refetch-on-navigation issues.
- **`useFiatFromCryptoValue.ts`** (`suite-native/formatters`): uses
  `selectFiatRatesByFiatRateKey(state, fiatRateKey)` — a direct keyed lookup returning the specific
  `Rate` object straight from the store, **not** the "whole rates object" pattern behind the excluded web
  issue `#28880` (`BaseCurrencyValue`/`FiatValue` re-render storm) — confirmed by reading
  `suite-common/wallet-core/src/fiat-rates/fiatRatesSelectors.ts:35-39`; this is a materially different,
  already-correct implementation.
- **`useServices`/`analytics` dependency stability** (`suite-common/dependency-injection/src/useServices.tsx`,
  used from `usePinAction.tsx`, `useRedirectOnPassphraseCompletion.ts`, `useBluetoothAdapter.ts`): traced
  fully — `selectNativeAnalyticsDep` is a module-level constant selector, `useSelectedServices`'s
  `useMemo` deps (`[services, ...selectors]`) spread stable elements, so `analytics` is a stable
  reference across renders; not a source of instability anywhere it's used in this area.
- **Effect+`dispatch` sites checked individually** (the highest-value class per the brief):
  `BiometricsModalRenderer.tsx`, `useBlockchainConnectionManager.ts`, `useBluetoothAdapter.ts`,
  `useRedirectOnPassphraseCompletion.ts` (all 3 effects — `device`/`selectSelectedDevice` is a direct,
  stable state-path read, not a fresh allocation), `useBrowserAuth.ts`, `TradingHistory.tsx` (`trades`
  from `selectDeviceTradingTradesOrderedByDate`, weak-map memoized; the `tradeToBeOpened`-consuming
  effect self-clears via `dispatch(tradingActions.clearTradeOrderIdToBeOpened())`, bounded),
  `SlippageBottomSheet.tsx`, `useMaxSpendableAmount.ts` (F-08-3), `useCustomFee.ts` (F-08-3) — all either
  keyed on confirmed-primitive/confirmed-memoized deps or already guarded against re-entry.
- **`?? []`/`?? {}` C4 candidates verified by reading, all false positives** (destructured value is
  either a primitive extracted immediately, or consumed only inside a callback body that never becomes a
  hook dependency, never the object itself crossing into a memo/effect dep):
  `useFeeCalculation.ts:40` (`{ symbol } = account ?? {}` — only the primitive `symbol` escapes),
  `useShowStayOnScreenAlert.tsx:38` (inside a `useCallback` body, called imperatively),
  `useHasEnabledCoin.ts:11` (`Object.values(enabledCoins ?? {}).some(Boolean)` — the `useWatch` `compute`
  option, only the boolean crosses the hook boundary), `DiscoveryCoinsFilter.tsx:75` (inside a
  `useCallback` body), `TradeDetailProviderCard.tsx:35`, `SlippageSummary.tsx:14`,
  `DeviceDangerBannerExtension.tsx:54`, `ContextMessage.tsx:30`, `TransactionName.tsx:147` (all
  render-body destructuring consumed directly in JSX, not stored as a dependency).
- **`forms` package foundations** (`suite-native/forms/src/hooks/useField.ts`,
  `useFormContext.ts`): `useField` is built on `useController` (react-hook-form's per-field subscription
  primitive), never `watch()`; confirms the C2 "zero native `watch()`" result is architectural, not
  incidental.
- **Derived-state-in-effect / setState-first-effect sweep beyond the C10 grep window** (broadened search
  for `useEffect` bodies calling a `set*` within their first ~6 lines, 30 hits reviewed): all bounded by a
  guard condition or keyed on primitives, except F-08-1 and F-08-4 above. Specifically checked clean:
  `PromoBannerCarousel.tsx` (clamps `activeIndex` only when `count` actually shrinks past it),
  `useIsDiscoveryDurationTooLong.tsx` (interval keyed on primitive timestamp/boolean),
  `useOnForegroundCallback.ts` (flag-guarded, self-resetting), `ConfirmOnTrezorWrapper.tsx` (timeout keyed
  on layout primitives), `DeviceSwitch.tsx` (nav listener, stable deps), `useBluetoothManager.ts` /
  `useBluetoothAlerts.ts` (`showOrHideBluetoothAlert`'s identity is intentionally keyed on the two status
  primitives it needs to react to — traced the full dependency chain), `useProviderConfirmationStatus.ts`,
  `useSlippageLifecycle.ts` (textbook `useEffectEvent` usage for the "read latest callback" need),
  `PinOnKeypad.tsx` (`useWindowDimensions()` — library-managed change detection, not a fresh-per-render
  object), `TronFeeLimitContent.tsx`, `useWaitForButtonRequest.ts` (flag-guarded).
- **`StoreProvider.tsx`/`StorageProvider.tsx`** (`suite-native/state`, `suite-native/storage`): pure
  composition, no hooks/effects, checked given their app-root position (same category as the
  `IntlProvider` in F-08-1) — nothing to report.
- **`useCryptoFiatConverters.ts`, `useFormattersConfig.ts`** (`suite-native/formatters`,
  `formatters-config`): return fresh objects/functions per render, but native is compiler-managed and
  `useFormattersConfig.ts` is explicitly cited as the _correct_ reference example in
  `_scan/06-suite-common.md`'s F-06-2 (contrasted against a web-side miss) — nothing new to add.
- **Selector memoization audit across `accounts`, `tokens`, `staking` (all 4 chains),
  `transaction-management`, `transactions`, `assets`, `bluetooth`, `device`, `discovery`, `graph`,
  `banners`, `trading-state`'s `commonSelectors.ts`/`buySelectors.ts`/`sellSelectors.ts`/
  `exchangeSelectors.ts`/`residenceSelectors.ts`**: every exported selector classified as either
  memoized (`createWeakMapSelector`/`createSelector`) or a plain function verified to return a primitive,
  an existing reference via `.find()`, or a value that's reduced to a primitive (e.g. `.length > 0`)
  before ever reaching a `useSelector` call site. The two selectors whose names suggested unmemoized list
  construction (`selectAccountsWithTokensToSellSectionListByTradingType`,
  `selectVisibleDeviceAccountsByNetworkSymbolSorted`, `suite-native/trading-state/src/selectors/commonSelectors.ts:242-451`)
  turned out to be `createWeakMapSelector`-wrapped on closer read (the factory call is on the line after
  the `=`, easy to misread with a naive one-line grep).
