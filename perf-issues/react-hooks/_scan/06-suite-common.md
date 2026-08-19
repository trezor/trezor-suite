# Scan area 06 — suite-common/** React surface

Base commit `9e0d5b6a45`. Covers the ~45 files matching
`rg -l "from 'react'" suite-common -g '*.ts' -g '*.tsx' -g '!*test*'` plus ~28 additional files that
define `use*` hooks without a direct `'react'` import (they compose other hooks — `useSelector`,
`useQuery` — instead): `trading/*`, `earn-stablecoin-api/*`, `earn-stablecoin/*`, `earn-staking-api/*`,
`staking/*`, `message-system/*`, `formatters/*`, `dependency-injection/*`, `device/usePinHook.ts`,
`firmware*`, `logger/*`, `connect-popup/*`, `discreet-mode/*`, `react-query/*`, `redux-utils/*`,
`wallet-core/{fees,formDrafts,accounts,settings,fiat-rates,stablecoin-yield}/*`,
`transaction-search/*`, `tx-simulation/*`, `bluetooth/bluetoothSelectors.ts`,
`device/deviceSelectors.ts`, `wallet-core/{tokens,transactions,stake}Selectors.ts`. No `wallet-graph`,
`connect-init`, `toast-notifications`, `analytics`, or `validators` package under `suite-common`
contains any hook or JSX — `connect-init`/`toast-notifications` are thunks/selectors/types only,
`analytics` is event-shape definitions only, `validators` is yup schemas only, and
`suite-common/graph` (the actual wallet-graph data package) has no `'react'` import anywhere. Verified
via `find`/`rg`, not assumed.

Excluded per brief / PROGRESS.md, not re-filed:

- `suite-common/wallet-core/src/tokens/tokenUtils.ts` (`getTokens`'s `tokens = []` default, candidate
  line 34) — same function already drafted as `p2-25-tokenutils-gettokens.md` in asymptotic-complexity.
- `suite-common/wallet-core/src/transactions/transactionsSelectors.ts:285` (`transactions[account.key]
?? []` inside `selectAnyAccountIsStakingActive`) — drafted as
  `p2-26-transactionsselectors-selectanyaccountisstakingactive.md`.
- `getLocaleSeparators.ts:2`, `prepareDateTimeFormatter.ts:16` — Intl caching, drafted in
  asymptotic-complexity per the brief.

## F-06-1 — `useApprovalStep`'s effect keyed on the whole `tx` object can double-fire `refreshQuotes()` while an approval is confirming

- **Class:** 1 (unstable value produced by `useAllowanceTxTracking`, crossing the hook boundary into
  `useApprovalStep`'s effect deps) + 2 (the effect calls an async side-effecting function on every
  refire, not just once per real status change — a bounded-but-wasteful duplicate-request pattern)
- **Where:** `suite-common/trading/src/hooks/useAllowanceTxTracking.ts:76-80` (unmemoized return) and
  `suite-common/trading/src/hooks/useApprovalStep.ts:49-85` (the effect), specifically the dependency
  array at line 85. Consumer chain: `packages/suite/src/hooks/wallet/allowance/useAllowance.ts:12-18`
  returns `{ tx, state }` from a plain object literal (also unmemoized) into
  `AllowanceContext.Provider value={allowanceContextValue}` at
  `packages/suite/src/views/wallet/trading/exchange/TradingExchangeForm.tsx:27` (and the same pattern
  in `YieldDeposit.tsx:43` / `YieldWithdraw.tsx:39`), consumed by
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx:45,80-85`.
- **Trigger cadence:** every render of the `AllowanceContext.Provider` owner (`TradingExchangeForm` /
  `YieldDeposit` / `YieldWithdraw`) while an approval is confirmed but not yet cleared (the async
  window between `status.isConfirmed` becoming true and the `.finally()` callback clearing
  `approvalTxid`/`txApprovalType`).
- **Severity guess:** P1 (live trading/token-approval flow; duplicate network calls, not just a wasted
  render)
- **Confidence:** high on the mechanism (read every hop end-to-end); medium on how often the Provider
  actually re-renders during that window in practice — would drop to P2 if `TradingExchangeForm` /
  `YieldDeposit` / `YieldWithdraw` provably never re-render while `status.isConfirmed && txApprovalType`
  is true (their own selectors — `selectHasRunningDiscovery`, `selectAreFeesLoading`, quote polling —
  make that unlikely, but I did not instrument it).

### Before (verbatim from the file)

```ts
// useAllowanceTxTracking.ts:38-81 — return value is a fresh object literal every call
export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);
    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );
    const status = useMemo<TransactionStatus>(() => {
        /* ... */
    }, [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
```

```ts
// useApprovalStep.ts:43-85 — effect #1 correctly narrows to tx.approvalTxid; effect #2 depends on
// the whole `tx` object and calls refreshQuotesRef.current() every time it refires while confirmed
useEffect(() => {
    if (tx.approvalTxid && !txApprovalType) {
        setTxApprovalType(currentApprovalType);
    }
}, [tx.approvalTxid, currentApprovalType, txApprovalType]);

useEffect(() => {
    const thisRunId = ++effectRunIdRef.current;
    const { approvalTxid, status, setApprovalTxid } = tx;
    if (!approvalTxid) return;

    if (status.isPending) {
        setApprovalStep('LOADING');
        return;
    }
    if (status.isFailed) {
        setApprovalStep('REQUIRED');
        return;
    }

    if (status.isConfirmed && txApprovalType) {
        setApprovalStep(txApprovalType === 'APPROVE' ? 'APPROVED' : 'REQUIRED');

        refreshQuotesRef
            .current()
            .catch(error => {
                console.error('Failed to refresh quotes after approval:', error);
            })
            .finally(() => {
                if (effectRunIdRef.current !== thisRunId) return;
                setApprovalTxid(null);
                setTxApprovalType(null);
            });
    }
}, [tx, txApprovalType, refreshQuotesRef]);
```

### Proposed fix

Either is sufficient, (1) is cheaper since `tx` also flows through a React Context in `packages/suite`:

1. In `useAllowanceTxTracking`, wrap the return in `useMemo(() => ({ approvalTxid, status,
setApprovalTxid }), [approvalTxid, status, setApprovalTxid])` — `setApprovalTxid` is a `useState`
   setter (stable by React), `status` is already its own stable memo, so this holds a single reference
   until `approvalTxid` itself changes.
2. In `useApprovalStep`'s second effect, narrow the dependency to the primitives effect #1 already
   uses correctly: `tx.approvalTxid`, `tx.status.isPending`, `tx.status.isFailed`,
   `tx.status.isConfirmed` — none of `tx`'s own fields need the wrapper object's identity.

### Why it matters

Every re-render of the Provider while a token approval sits in the "confirmed, waiting for the async
cleanup" window re-fires the effect and calls `refreshQuotesRef.current()` again — a second, concurrent
`refreshQuotes()` — because nothing in the dependency array or the effect body deduplicates on `tx`'s
_content_, only its (unstable) reference. `effectRunIdRef` only guards the `.finally()` cleanup racing
itself; it does not stop the extra call from being issued. This is the SKILL's "silent and unbounded"
shape (an effect keyed on a fresh whole-object dependency, calling something that talks to the network)
landing in a real-money approval flow (buy/sell/exchange token allowance, and the earn Yield
deposit/withdraw allowance flow), not a cosmetic re-render.

## F-06-2 — `FormatterProvider`'s memo is defeated on web, forcing every formatter component to remount app-wide

- **Class:** 1 (unstable `config` value produced outside `suite-common`, crossing into
  `FormatterProvider`'s own `useMemo`) — consequence matches Class 5's blast radius (a Provider whose
  value churns has "many consumers", here effectively the whole app)
- **Where:** `suite-common/formatters/src/FormatterProvider.tsx:86-93` (the `useMemo` whose `config`
  dep is unstable) and `suite-common/formatters/src/makeFormatter.tsx:46-58` (`makeFormatter` returns a
  brand-new component function on every call, which is what makes a stale `config` painful rather than
  just wasteful). Root cause: `packages/suite/src/hooks/suite/useFormattersConfig.ts:7-18` returns a
  plain object literal every render, **not** wrapped in `useMemo` — contrast with the native version
  at `suite-native/formatters-config/src/hooks/useFormattersConfig.ts:17-25`, which does exactly the
  right thing (`useMemo(..., [baseCurrencyCode, bitcoinAmountUnit, locale])`). Consumed at
  `packages/suite/src/support/suite/Main.tsx:28,46` (`<FormatterProvider config={formattersConfig}>`),
  which wraps essentially the entire web/desktop app (`packages/suite-web/src/MainWeb.tsx:30-48`).
- **Trigger cadence:** every render of `Main`/`MainWeb` for _any_ reason — `MainWeb` is a plain
  (non-`memo`'d) function component whose body re-runs whenever its own hooks
  (`useTor`, `useConnectPopupWeb`, `useConnectPopupWebextension`, `useDebugLanguageShortcut`) cause a
  re-render, cascading a fresh `children` prop into `Main`.
- **Severity guess:** P1 (blast radius, not frequency — see "Why it matters")
- **Confidence:** medium. High confidence on the mechanism (verified `useFormattersConfig.ts` has no
  memo, verified `FormatterProvider`'s memo depends on that object, verified `makeFormatter` mints a
  new component per call). Medium confidence on cadence — I did not instrument how often `MainWeb`
  actually re-renders in a running app; would lower to P2 if it's provably render-once-then-static.

### Before (verbatim from the file)

```ts
// packages/suite/src/hooks/suite/useFormattersConfig.ts:7-18 — no useMemo
export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return {
        locale,
        baseCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
    };
};
```

```tsx
// suite-common/formatters/src/FormatterProvider.tsx:83-100
export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const intl = useIntl();

    const contextValue = useMemo(() => {
        const extendedConfig = { ...config, intl };

        return getFormatters(extendedConfig);
    }, [config, intl]);

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
```

Compare the native hook, which gets this right:

```ts
// suite-native/formatters-config/src/hooks/useFormattersConfig.ts:12-26
export const useFormattersConfig = (): FormatterProviderConfig => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const locale = useSelector(selectLocale);

    return useMemo(
        () => ({ locale, bitcoinAmountUnit, is24HourFormat, baseCurrency: baseCurrencyCode }),
        [baseCurrencyCode, bitcoinAmountUnit, locale],
    );
};
```

### Proposed fix

Mirror the native hook: wrap `packages/suite/src/hooks/suite/useFormattersConfig.ts`'s return in
`useMemo(() => ({ locale, baseCurrency, bitcoinAmountUnit, is24HourFormat: true }), [locale,
baseCurrency, bitcoinAmountUnit])`. This is a one-file fix in `packages/suite` (out of this area's
write scope, flagged here because it's the root cause of a `suite-common` memo miss) — no change
needed in `FormatterProvider.tsx` itself, its `useMemo` is already correctly structured and will start
holding once `config` is stable.

### Why it matters

`getFormatters()` calls `prepareCryptoAmountFormatter`, `prepareDisplaySymbolFormatter`,
`prepareBaseCurrencyAmountFormatter`, `prepareDateFormatter`, `prepareTimeFormatter`, and
`prepareDateTimeFormatter`, each of which calls `makeFormatter(...)` and gets back a **new React
component function** (verified in `prepareCryptoAmountFormatter.ts:145-161`). When `FormatterProvider`'s
memo misses, all six of those formatter "components" get new identities, and every
`<CryptoAmountFormatter>` / `<DateFormatter>` / etc. anywhere below `Main` — i.e. every displayed
amount, balance, date and time in the entire web/desktop app — is a different component type on the
next render, so React unmounts and remounts it rather than just re-rendering it. That's strictly worse
than a redundant render: lost local state and effects in whatever the formatter wraps, and layout
thrash, on every single formatted value in the tree, triggered by something as unrelated as a Tor
status change in `MainWeb`.

## F-06-3 — `useServices`'s dependency spread is correct, but two call sites feed it an inline selector and silently defeat the memo

- **Class:** 1 (unstable value crossing into `useSelectedServices`'s `useMemo`) / 6 (pre-existing
  `eslint-disable react-hooks/exhaustive-deps` — verified non-lying for the _intended_ usage, but blind
  to misuse)
- **Where:** `suite-common/dependency-injection/src/useServices.tsx:65-70` (`useSelectedServices`, the
  disable is at line 68). Misused at
  `packages/suite/src/hooks/suite/useOpenSuiteDesktop.ts:16-18` and
  `packages/suite/src/views/settings/SettingsDebug/Transport.tsx:59-61`, both of which pass
  `(services): TransportsDep => ({ createTransports: services.createTransports })` — a fresh arrow
  function literal — directly as the selector argument, instead of a module-level `select*Dep`
  constant like the other 359 call sites in the repo.
- **Trigger cadence:** every render of `useOpenSuiteDesktop`'s caller (bridge troubleshooting screen,
  the "open in Suite Desktop" error modal) and every render of the `Transport` debug-settings page.
- **Severity guess:** P3 (both call sites are cold troubleshooting/debug screens today, not a hot path)
- **Confidence:** high — `[services, ...selectors]` spreads the rest-param's _elements_ into the dep
  array, so for the established convention (callers pass stable, module-level `select*Dep` functions)
  the disable is not lying; it's an ESLint static-analysis limitation on the dynamic-length spread. The
  two inline-arrow call sites are a real, demonstrated exception to that convention.

### Before (verbatim from the file)

```ts
// suite-common/dependency-injection/src/useServices.tsx:65-70
const useSelectedServices = (selectors: ServiceSelector<any>[]) => {
    const services = useServicesContext();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => selectServices(services, ...selectors), [services, ...selectors]);
};
```

```tsx
// packages/suite/src/hooks/suite/useOpenSuiteDesktop.ts:16-18 — inline selector, fresh every render
const { createTransports } = useServices((services): TransportsDep => ({
    createTransports: services.createTransports,
}));
```

### Proposed fix

At the two call sites, hoist the selector to a module-level constant the way every other `useServices`
caller does, e.g. `const selectCreateTransportsDep = (services: Services): TransportsDep => ({
createTransports: services.createTransports });` declared outside the component. No change needed in
`useServices.tsx` — the spread-based dependency array is the correct mechanism for a variable-length
selector list; it just assumes (and cannot itself enforce) that every element is stable.

### Why it matters

`selectServices` (`Object.assign({}, ...selectors.map(selector => selector(services)))`) reruns every
render at both sites, so `createTransports` gets a new identity each time regardless of whether
`services` changed — a wasted memo, not a loop (the returned function isn't itself an effect/memo
dependency downstream at either call site today). Flagged because it's a demonstrated, silent way to
defeat this shared `suite-common` hook's whole reason for existing, and the failure mode gets worse if
the pattern is copied into a hotter call site later.

## F-06-4 — `useFilteredUtxos`'s default parameter is the SKILL's canonical unstable-fallback shape

- **Class:** 1 (unstable dependency: default parameter `= []`)
- **Where:** `suite-common/transaction-search/src/useFilteredUtxos.ts:8-19`. Only current consumer:
  `suite-native/module-send/src/screens/SendUtxoScreen.tsx:49`
  (`useFilteredUtxos(account?.utxo ?? [], searchQuery)`).
- **Trigger cadence:** would refire the `useMemo` every render whenever `utxos` is omitted or
  `undefined` is passed.
- **Severity guess:** P3 (cleanup) — currently latent rather than live.
- **Confidence:** medium. The one real call site never relies on the hook's own default (it always
  passes an explicit second value), and that call site sits inside a `suite-native` component, which is
  React-Compiler-compiled — the compiler very likely memoizes `account?.utxo ?? []` as an expression
  within that component, so today's actual impact is probably nil. This hook ships from `suite-common`
  though (memoize for the web consumer per this skill's own rule), and a future web caller — or any
  caller that omits the argument entirely — would hit the un-memoized default directly.

### Before (verbatim from the file)

```ts
// suite-common/transaction-search/src/useFilteredUtxos.ts:8-19
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

### Proposed fix

Module-level constant: `const EMPTY_UTXOS: Utxo[] = [];` and default to that instead of `[]`, matching
the skill's worked example.

### Why it matters

Today's only caller works around it with its own `?? []` rather than relying on the hook's default, so
the live risk is low and likely compiler-mitigated on the native side. Reported because it's an exact
match for the skill's canonical anti-pattern in a `suite-common` file that explicitly ships to the
(uncompiled) web app too, and the empty-query branch (`return utxos;`) means the hook returns that fresh
default array's reference straight back out — the cheapest possible fix, worth doing before a web
consumer appears.

## F-06-5 — `useWrappedNativePendingTx` rescans the account's whole transaction history on every render

- **Class:** 4 (render-body work over an unbounded list, in a hook body)
- **Where:** `suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts:50-56`
  (`trackedTransaction` computed inline, not in a `useMemo`); the scan itself is
  `suite-common/wallet-utils/src/wrappedNativePendingTxUtils.ts:19-41`
  (`findTrackedWrappedNativeTransaction`, up to two `Array.prototype.find` passes over `transactions`).
- **Trigger cadence:** every render of whatever component calls this hook (the wrap/unwrap pending-tx
  screen), not just when `transactions`/`txid`/`trackedNonce` actually change — `transactions` itself
  is a stable, weak-map-memoized reference from `selectAccountTransactions` (verified — it only changes
  when the account's tx list genuinely changes), so this is wasted rescanning on unrelated re-renders,
  not a loop.
- **Severity guess:** P3 — single-instance hook (one active wrap/unwrap flow at a time, not a per-row
  list), so it doesn't multiply the way a list-row component would, but the list it scans (an account's
  full transaction history) is genuinely user-scaling.
- **Confidence:** medium — confirmed the scan is unmemoized and the input can be large; did not measure
  how often the containing screen re-renders for reasons unrelated to the tracked tx.

### Before (verbatim from the file)

```ts
// suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts:43-56
const transactions = useSelector((state: TransactionsRootState) =>
    selectAccountTransactions(state, account?.key ?? null),
);
// ...
const trackedTransaction = txid
    ? findTrackedWrappedNativeTransaction({
          transactions,
          txid,
          nonce: trackedNonce?.txid === txid ? trackedNonce.nonce : undefined,
      })
    : undefined;
```

### Proposed fix

`useMemo(() => txid ? findTrackedWrappedNativeTransaction({ transactions, txid, nonce: ... }) :
undefined, [transactions, txid, trackedNonce])` — `transactions` is already a stable reference from the
memoized selector, so this will only recompute when the tx list, txid, or tracked nonce genuinely
change.

### Why it matters

Bounded impact today (one screen instance, not a list), but the fix is a two-line `useMemo` wrap with an
already-stable dependency available, so there's no reason to pay an O(n) double-scan of the account's
transaction history on renders the polling effect didn't cause.

## Checked, clean

- **`trading/*` hooks generally well-built.** `useCoinsAndPlatforms.ts`'s `useFreshRef(info)` +
  `infoRef.current.coins ?? {}` / `.platforms ?? {}` (candidates at :15-16) only fires inside a
  `useCallback` body invoked imperatively later — the fresh fallback is consumed immediately, never
  stored as a dep, so the callback (deps `[infoRef]`) stays stable; correct use of `useFreshRef`
  (latest-value-at-call-time, not previous-value). `useTradingUtils.ts` and `useTradingAssets.ts` call
  `getCoinsAndPlatforms()` the same way (imperatively inside `useCallback` bodies) — same non-issue.
- **`useListDataFilter.ts` / `useSectionDataFilter.ts`** memoize correctly; every current consumer
  (`useCountryFilteredData.ts`, `useCountrySubdivisionFilteredData.ts`) passes module-level `const`
  filter/sort callbacks, so the memo holds. (The two `suite-native` consumers were not inspected —
  out of this area.)
- **`useDexExchangeTxSimulation.ts`**: `useMemo` deps include the whole `account` object, which looks
  like the classic "keyed on account, refetches every block" shape — but `composeDexTxSimulationAction`
  is O(1) object construction (verified), and the actual network call
  (`useNetworkTxSimulation`/`useTxSimulation`) keys its `useQuery` on `input.params` — TanStack Query
  hashes query keys structurally, so a fresh-reference-but-same-value `params` does not trigger a
  refetch. Wasted recompute, not a request loop; not worth an individual finding (O(1) work).
- **Same TanStack Query protection verified for**: `useGetMerklRewards.ts`, `useGetMerklRewardsQueryEntries.ts`
  (its own `useMemo` deps are correct — `accounts` is the caller's responsibility, and the one
  `packages/suite` caller I traced, `useMerklRewards.ts:27-31`, does memoize it), `useTxSimulation.ts`,
  `useNetworkTxSimulation.ts`, `useDappScan.ts`, `useHasSufficientFundsForGas.ts`,
  `useEthereumValidatorsQueue.ts`, `useSolanaRewardsHistory.ts`, `useSolanaRewardsTotal.ts`,
  `useTronStakingStats.ts`, `useAllYieldOpportunities.ts`, `useGetVaultByAddress.ts`,
  `useGetYieldOpportunities.ts`, `useYieldOpportunity.ts`, `useFetchOtc.ts`,
  `useMissingRateTickersQuery.ts`, `useCommonApplicationLogs.ts` (device-telemetry query key spreads a
  `Set` into an array every render — harmless, react-query hashes it, and the set itself is tiny). The
  three `@tanstack/query/exhaustive-deps` disables in this group (`useNetworkTxSimulation.ts:71`,
  `useSolanaRewardsHistory.ts:78`, `useMissingRateTickersQuery.ts:25`) are a different lint rule from
  `react-hooks/exhaustive-deps` (data-fetching's territory per PROGRESS.md), each carries its own
  reasoning comment, and none hide a staleness bug — read all three.
- **`useExtendMerklRewardsWithFiat.ts` / `usePairRewardsWithAccounts.ts` /
  `useTotalClaimableRewardsAmountOfAccounts.ts` / `useYieldVaultName.ts`**: narrow, correct `useMemo`
  deps throughout.
- **`useAllowanceTxTracking.ts`'s own `status` memo** (deps `[transaction]`) is fine in isolation — the
  problem is only the unmemoized wrapper return (F-06-1).
- **`selectTradingCoinInfoByCryptoId` / `selectTradingCoinSymbolByCryptoId` /
  `selectTradingNativeCoinSymbolByCryptoId`** (`tradingSelectors.ts:465-510`, candidates at :472,:483,
  :509 `?? {}`): all three fallbacks live inside `createMemoizedSelector` compute functions — the fresh
  `{}` never crosses the selector's own memo boundary, so no downstream memo is defeated. Complexity of
  the coins/platforms lookup itself is out of scope (already covered by
  `p3-05-cleanups-suite-common-shared-packages.md` and `p2-32-...md`).
- **Same "fallback lives inside the memo boundary" pattern verified clean for**: `tokenSelectors.ts:32`
  (`selectAccountTokens`), `accountsSelectors.ts:313,331` (`selectSolExternalStakingAccounts`,
  `selectSolExternalStakingAccountsTotalStaked`), `transactionsSelectors.ts:113`
  (`selectAllPendingTransactions`), `deviceSelectors.ts:159,189` (`selectAvailableDeviceTranslations`,
  `selectDeviceButtonRequests`), `bluetoothSelectors.ts:37` (inside `prepareSelectAllDevices`).
  `bluetoothSelectors.ts:19` (`selectNearbyDevices`) already uses `returnStableArrayIfEmpty` — the
  brief's own "already clean" example. `stakeSelectors.ts:53`'s `data.ada?.pools ?? []` is a local
  scratch var for `.find()` — the selector (`selectPoolStatsApy`) always returns a number or `null`,
  never the array itself, so there's no fresh-reference-return for the "ALSO YOURS" native-`useSelector`
  concern to apply to.
- **`useFormDraft.ts`**: `selectDeepCopyOfFormDraft` (`formDrafts/selectors.ts:14-15`) looks like it
  would return a fresh `JSON.parse(JSON.stringify(...))` object every call (matching Class 3), but it's
  wrapped in `createWeakMapSelector` — memoized on the underlying `formDraft` reference, so it returns
  the same cached deep-copy instance when the store slice hasn't changed. Verified by reading the
  selector, not assumed from the name.
- **`useGetMerklRewardsQueryEntries.ts:75,94`**'s `= {}` default (`MerklRewardsQueryEntriesOptions`) is
  safe: only the destructured primitives (`isDebugMode`, `skipEmptyAccountCheck`) reach the `useMemo`
  dep array, never the wrapper object itself.
- **`message-system/*`**: `messageSystemSelectors.ts` is uniformly built on `createWeakMapSelector`
  (`createMemoizedSelector`) with `returnStableArrayIfEmpty` where needed — correctly handles the
  parameterized-selector-called-from-multiple-components hazard that a plain `reselect` single-slot
  cache would thrash on. All of `useExperiment.ts`, `useMessageSystemEarnDashboard.ts`,
  `useMessageSystemStaking.ts`, `useMessageSystemWrappedNative.ts`, `useMessageSystemYield.ts` consume
  these selectors via raw `react-redux` `useSelector` (suite-common can't reach the shallowEqual-wrapped
  one from `packages/suite`), but since every consumed selector is weak-map-memoized and `domain`
  arguments are static string constants from `Feature` (`messageSystemTypes.ts:37-65`), there's no
  fresh-reference-per-dispatch re-render. `ExperimentWrapper.tsx` and `useMessageSystemMessageForm.ts`
  are correctly memoized. `useConditionControls.ts`'s `(existing[0] ?? {})` (candidate :31) is a local
  var inside an `addCondition` callback, never a dependency, and the whole file is a message-system
  admin/authoring tool, not a user-facing hot path.
- **`usePinHook.ts`** (C10 candidate — effect starts with `setState`): `useEffect(() =>
setSubmitted(false), [buttonRequests.length])` is correctly narrowed to the primitive `.length`
  already (not the whole array) and is a legitimate one-shot reset on a new PIN/wipe-code request, not
  a loop.
- **`useTradingExchangeWatchApproval.ts`** (C9 candidate): effect deps are `[account, status, isEnabled,
dispatch]` — `account` is the whole object, but the effect only starts a `setInterval` and doesn't
  refetch on identity churn beyond restarting the interval timer; `status` (a string from a memoized
  selector) is the real gate. Not flagged individually — `account` churning would restart the polling
  interval, which is a much milder failure than a request-per-render loop, and I could not establish
  `account` actually gets a fresh reference on unrelated updates without leaving this area's file set.
- **`useDisplayBaseCurrency.ts`, `useRefetchFees.ts`, `wallet-core/accounts/hooks/useSelector.ts`,
  `trading/hooks/useSelector.ts`**: the latter two are the local shallowEqual-wrapped `useSelector`
  re-implementations `suite-common` needs because it can't import `packages/suite`'s version — correct
  and consistently used within their own packages' hooks (spot-checked `useProviderMetadataChangeEffect.ts`'s
  use of raw `react-redux` `useSelector` instead of the local wrapper: the two selectors it reads
  return direct state/property lookups, never fresh literals, so the missing shallowEqual doesn't
  matter there).
- **`useServices.tsx`'s eslint-disable itself** (line 68) is not a lying dependency array — `[services,
...selectors]` spreads the rest-param's elements, which for the codebase's established
  module-level-selector convention faithfully lists every true dependency; ESLint just can't verify a
  dynamic-length spread statically. See F-06-3 for the two sites that break the convention.
- **`useFreshRef`/`useCurrentRef`** — all 4 call sites in `suite-common` checked individually and are
  correct for their semantics (latest-value-at-call-time, not previous-value):
  `useGetMerklRewards.ts:29-30` (two `useFreshRef`s read inside an async polling loop),
  `useApprovalStep.ts:40` (`useCurrentRef` for an imperative "call the latest callback" pattern — its
  own effect runs before the later effects in the same component, so `.current` is already fresh by the
  time they read it), `useCoinsAndPlatforms.ts:12`. No Class-7 misuse found.
- **No `react-hook-form` `watch()` calls anywhere in `suite-common`** — the package only imports
  `react-hook-form` for the `FieldValues` type (`useFormDraft.ts` and a few reducers), never `useForm`
  itself. No Class-6 compiler-bail-out candidates here.
- **No inline `Provider value={{...}}` in `suite-common`** — the only two Providers with non-trivial
  values (`FormatterProvider`, `ServicesProvider`) both already pass a variable, not an inline literal
  (`FormatterProvider`'s variable just isn't memoized upstream — F-06-2).
- **False positives from the candidate grep, verified by reading:**
  `toast-notifications/src/types.ts` (only `import type { CSSProperties } from 'react'` — no runtime
  code); `suite-common/walletconnect/src/walletConnectUtils.tsx` (`.tsx` extension but no JSX/hooks at
  all); `tx-simulation/src/utils/getTxSimulationParams.ts:68` (`JSON.stringify(data)` builds an API
  request-body string, unrelated to any dependency array); `formatters/mocks/MockedFormatterProvider.tsx`
  (unmemoized `getFormatters()` call, same shape as F-06-2, but it's a test-only mock provider, not
  shipped code).
- **`useReportDeviceCompromised.ts`, `useFirmwareInstallation.ts`, `useTxSimulationPopupCall.ts`,
  `usePinHook.ts`, `useGetter.ts`, `ReactQueryProvider.tsx`/`ReactNativeQueryProvider.tsx`,
  `useSelectorDeepComparison.ts`, `discreetModeUtils.ts`/`useDiscreetMode.ts`,
  `useExcludedUtxos.ts`, `useStakingEntryPeriodEstimateInDays.ts`**: read in full, all use narrow
  primitive `useMemo`/`useCallback`/`useEffect` deps or plain `useContext`/`useState`, nothing crosses a
  hook boundary unstably.
