# Area 03 — `packages/suite/src/components/wallet/**` + `packages/suite/src/components/earn/**`

Scanned against `skills/performance-react-hooks/SKILL.md`. Base commit `issues/perf-react-hooks` @
`9e0d5b6a45`. Candidates verified from `_scan/00-candidates.md` rows whose path starts with
`packages/suite/src/components/wallet/` or `packages/suite/src/components/earn/` (29 rows), plus a
manual sweep of per-row components (`TransactionItem/*`, `AccountsMenu/AccountItem/*`) and the
earn/staking dashboards per the brief's Method.

## F-03-1 — `CustomFeeTron.tsx` mount-only effect can miss the async `estimatedFeeLimit`

- **Class:** 6 (wasted/wrong memoization — `eslint-disable exhaustive-deps` hides staleness)
- **Where:** `packages/suite/src/components/wallet/Fees/CollapsibleFees/CustomFee/CustomFeeTron.tsx:23-30`
- **Trigger cadence:** once, on mount of the Tron custom-fee panel
- **Severity guess:** P3
- **Confidence:** medium — depends on whether `estimatedFeeLimit` is already populated in the form
  by the time this panel mounts in the common flow; I did not trace every caller's timing. What
  would change my mind: proof that `composeRequest` always resolves and calls
  `setValue('estimatedFeeLimit', …)` before a user can reach the custom-fee tab.

### Before (verbatim from the file)

```tsx
export const CustomFeeTron = () => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();

    const { control, getValues, setValue } = useFormContext<FormState>();
    const { errors } = useFormState<FormState>();

    const estimatedFeeLimit = getValues('estimatedFeeLimit');

    useEffect(() => {
        if (getValues(FEE_LIMIT) === '' && estimatedFeeLimit) {
            setValue(FEE_LIMIT, estimatedFeeLimit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
```

`estimatedFeeLimit` is read once via `getValues` at first render and the effect's dep array is
`[]`, so it only ever sees the mount-time value. `estimatedFeeLimit` itself is written later by
`setValue('estimatedFeeLimit', composed.estimatedFeeLimit)` from async compose thunks
(`useStakeCompose.ts:145`, `useCompose.ts:161`, `useSendFormCompose.ts:228`,
`useTradingComposeTransaction.ts:273`) — i.e. it can genuinely arrive after this component has
already mounted and run its effect once.

### Proposed fix

Depend on `estimatedFeeLimit` instead of `[]` (drop the disable comment): `}, [estimatedFeeLimit, getValues, setValue])`. Guard re-entry with a ref (`hasAutofilledRef`) if the intent is
"only autofill the very first time it becomes available," since the field's own emptiness check
(`getValues(FEE_LIMIT) === ''`) already prevents clobbering a value the user typed.

### Why it matters

If `estimatedFeeLimit` is still `undefined` when this panel first mounts, the field is never
autofilled with the recommended value even after compose resolves — sibling `CustomFeeEthereum.tsx`
avoids this class of bug entirely by only reading `getValues('estimatedFeeLimit')` inside
`onClick` handlers, never in a mount effect.

---

## F-03-2 — `TokenIconSetWrapper` recomputes its whole token chain on every render (distinct from the filed complexity finding)

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:26-60`
- **Trigger cadence:** every render of the component, i.e. once per network row of the dashboard's
  My Assets table/grid, on every parent re-render (fiat-rate ticks, account updates)
- **Severity guess:** P2
- **Confidence:** high

**Already drafted under `perf-issues/asymptotic-complexity/p2-17-tokeniconsetwrapperx-tokeniconsetwrapper.md`** — that
finding is about the _n_ being wrong (whole unfiltered `accounts` list instead of the row's own
accounts). This is a **distinct hooks-class defect at the same lines**: even after that fix lands,
the `flatMap` → `reduce` → `sort` chain below has no `useMemo` at all, so it re-executes from
scratch on every render regardless of whether `accounts`/`symbol`/rates actually changed. The
complexity doc mentions this only as an optional aside ("Optionally also wrap … in a `useMemo`");
this is the hooks-class write-up of that aside.

### Before (verbatim from the file)

```tsx
export const TokenIconSetWrapper = ({ accounts, symbol }: TokenIconSetWrapperProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const allTokensWithRates = accounts.flatMap(account =>
        enhanceTokensWithRates(account.tokens, baseCurrencyCode, symbol, fiatRates),
    );

    if (!allTokensWithRates.length) return null;

    const tokens = getTokens<TokensWithRates>({
        tokens: allTokensWithRates,
        symbol,
        tokenDefinitions: coinDefinitions,
    })?.shownWithBalance;

    const aggregatedTokens = Object.values(
        tokens.reduce((acc: Record<string, TokensWithRates>, token) => {
            /* … BigNumber allocations per token … */
            return acc;
        }, {}),
    );

    const sortedAggregatedTokens = aggregatedTokens.sort(sortTokensWithRates);
```

### Proposed fix

Wrap the `flatMap`/`getTokens`/`reduce`/`sort` chain in one `useMemo` keyed on
`[accounts, symbol, baseCurrencyCode, fiatRates, coinDefinitions]`. Note the early
`if (!allTokensWithRates.length) return null` has to move after the memo (or become a check on the
memoized result) since hooks can't follow a conditional return.

### Why it matters

`packages/suite` is not React-Compiler-compiled, so nothing memoizes this automatically. Once the
complexity fix narrows `accounts` to the row's own accounts, this chain still redoes 2+ BigNumber
allocations per token and a full sort on every unrelated re-render of the row (e.g. a fiat-rate
tick touching a sibling network) instead of only when this row's own tokens/rates change.

---

## F-03-3 — `TargetAddressLabel` feeds a fresh `[]` into a `createWeakMapSelector`, defeating its cache

- **Class:** 3 (selector returns fresh reference — memoized selector whose argument is a fresh
  array per call)
- **Where:** `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:28-34`
  (+ `suite/address/src/labels/selectAddressLabelsForAccount.ts:35-50`, the `addresses` input-selector at :47-50)
- **Trigger cadence:** every render of this component _and_ every store dispatch (react-redux calls
  the `useSelector` callback on every dispatch to check for changes) — once per transaction target
  that lacks a resolved `addresses` array
- **Severity guess:** P3
- **Confidence:** high on the mechanism; medium on real-world magnitude — `Target.addresses` is
  `string[]` optional (`packages/blockchain-link-types/src/common.ts:202`), so this only fires for
  targets without a resolved address (e.g. non-standard outputs), and the `reduce` over the
  resulting `[]` is itself trivial _unless_ Suite Sync is enabled, in which case the combiner also
  rebuilds a label map over the account's **entire** `suiteSyncAddressLabels` list before intersecting
  it with (empty) `addresses`. I did not measure how large that list gets for real users.

### Before (verbatim from the file)

```tsx
const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;
const addressLabels = useSelector(state =>
    selectAddressLabelsForAccount(state, {
        addresses: target.addresses ?? [],
        accountKey,
        deviceStaticId: deviceStaticSessionId,
    }),
);
```

Co-anchor — the selector's own passthrough input, `selectAddressLabelsForAccount.ts:47-50`:

```tsx
        (
            _state: SelectAddressLabelsForAccountState,
            { addresses }: SelectAddressLabelsForAccountParams,
        ) => addresses,
```

`selectAddressLabelsForAccount` is built with `createWeakMapSelector` specifically so repeated
calls with the same arguments hit a cache. Every time `target.addresses` is `undefined`, the call
site hands it a brand-new `[]`, so this one input never matches the previous call by reference and
the whole combiner (three possible `.reduce()` branches) reruns.

### Proposed fix

Module-level constant: `const EMPTY_ADDRESSES: string[] = [];` and use
`addresses: target.addresses ?? EMPTY_ADDRESSES`. That alone restores the weak-map cache hit for
every target that lacks a resolved address.

### Why it matters

`TargetAddressLabel` is rendered once per transaction target across every visible transaction row,
so on an active wallet (frequent dispatches from blockchain/ticker updates) this recomputes the
labeling combiner far more often than the underlying data changes — pure waste, not a re-render
(the `LabelsMap` output is absorbed by `packages/suite`'s `shallowEqual` `useSelector` wrapper).

---

## F-03-4 — `AccountSection` calls `getTokens()` unmemoized for every sidebar row, on every sidebar render

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx:28-50`
  (destructuring default at :34, the call at :46-50)
- **Trigger cadence:** every render of `AccountSection`, i.e. every visible account in the sidebar,
  on every render of `AccountsList`/`Accounts` (neither `AccountSection` nor `AccountItemsGroup` is
  `memo()`-wrapped) — not gated behind search/filter state, so this runs continuously, not just
  while typing
- **Severity guess:** P2
- **Confidence:** high

### Before (verbatim from the file)

```tsx
export const AccountSection = ({
    account,
    forceOnlyItemClick,
    hideStaking,
    selected,
    onItemClick,
}: AccountSectionProps) => {
    const {
        symbol,
        accountType,
        index,
        descriptor,
        formattedBalance,
        tokens: accountTokens = [],
    } = account;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, symbol));

    const showGroup = hasNetworkFeatures(account, 'tokens');

    const isStakeShownStored = useSelector(state =>
        selectAccountIsStakingActive(state, account.key),
    );
    const isStakeShown = !hideStaking && isStakeShownStored;

    const tokens = getTokens({
        tokens: accountTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });
```

### Proposed fix

Wrap the `getTokens(...)` call in `useMemo(() => getTokens({ tokens: accountTokens, symbol: account.symbol, tokenDefinitions: coinDefinitions }), [accountTokens, account.symbol, coinDefinitions])`,
and back the destructuring default with a module-level `EMPTY_TOKENS` constant (not `= []`) so the
memo's own dependency is stable — otherwise the memo would never hit for token-less accounts either.

### Why it matters

The sidebar (`AccountsMenu`) is mounted on every Suite route per `perf-issues/scheduling/p1-13`,
which already covers the _search-filter_ path's duplicate `getTokens` call. This is the _base_
render path: it runs for every account unconditionally, so any unrelated re-render of `AccountsList`
(new `coinjoinIsPreloading`, `accountLegacyLabels`, `discoveryStatus`, …) re-walks every visible
account's whole token list, which on a busy EVM account can be long.

---

## F-03-5 — `FeesContext.Provider` hands 14 consumers a fresh object every render

- **Class:** 5 (missing memoization where identity matters — inline Provider `value={{...}}`)
- **Where:** `packages/suite/src/components/wallet/Fees/CollapsibleFees/CollapsibleFees.tsx:76-85`
  (+ `packages/suite/src/components/wallet/Fees/context/FeesContext.ts:23`, 14 consumer files via
  `useFeesContext()`: `CollapsibleFeesHeaderContent.tsx`, `CollapsibleFeesHeader.tsx`,
  `StandardFee.tsx`, `BitcoinFeeCards.tsx`, `EthereumFeeCards.tsx`, `MiscFeeCards.tsx`,
  `MaximumFee.tsx`, `CustomFee.tsx`, `CustomFeeEthereum.tsx`, `CustomFeeMisc.tsx`, `CurrentFee.tsx`,
  `CustomFeeTooLowBanner.tsx`, `TronFee.tsx`, `DustPreventionNotice.tsx`)
- **Trigger cadence:** every render of `CollapsibleFees` — which mounts on every send/stake/
  claim/unstake/RBF screen and re-renders on every `useWatch({name: 'selectedFee'})` tick, i.e.
  effectively per keystroke/interaction in the surrounding form
- **Severity guess:** P1
- **Confidence:** high

### Before (verbatim from the file)

```tsx
    return (
        <FeesContext.Provider
            value={{
                networkSymbol,
                networkType,
                feeInfo,
                changeFeeLevel,
                selectedFeeLevel,
                composedLevels,
                tronResources,
            }}
        >
```

### Proposed fix

```tsx
const contextValue = useMemo(
    () => ({ networkSymbol, networkType, feeInfo, changeFeeLevel, selectedFeeLevel, composedLevels, tronResources }),
    [networkSymbol, networkType, feeInfo, changeFeeLevel, selectedFeeLevel, composedLevels, tronResources],
);
// ...
<FeesContext.Provider value={contextValue}>
```

`changeFeeLevel`/`feeInfo`/`composedLevels` are props from callers further up (`useFees`,
`useCompose`, etc.) — verify they're themselves stable before relying on this memo to hold; if not,
that's a follow-on fix in `src/hooks/wallet` (outside this area).

### Why it matters

React context has no shallow-compare step: every consumer re-renders whenever the `value` reference
changes, regardless of which field it actually reads. A fresh object literal on every render of
`CollapsibleFees` means all 14 consumers re-render together on every keystroke in the amount/fee
form, not just the ones whose data changed.

---

## F-03-6 — Yield pending-tx poll effect keys on the whole `account` object; the Tron sibling does it correctly

- **Class:** 2 (effect refetch/render loop — bounded-but-wasteful variant; minimal-required-deps)
- **Where:** `packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts:213-232`
  (co-anchor, the correct counterpart: `packages/suite/src/components/earn/staking/tron/hooks/useTronStakePendingTransactionTracking.ts:46-56`)
- **Trigger cadence:** while a yield deposit/withdraw/wrap/unwrap/claim tx is pending — every time
  `account` gets a new reference (each `fetchAndUpdateAccountThunk` tick that touches this account,
  or any other unrelated update to it), the interval is torn down and rebuilt
- **Severity guess:** P1
- **Confidence:** high

### Before (verbatim from the file)

```tsx
// Snapshot latest values for the unmount-leftPending effect so we don't re-bind on every render.
const latestRef = useCurrentRef({
    isCurrentlyPending,
    pendingTransaction,
    flowType,
    vault,
    networkSymbol: account.symbol,
});

useEffect(() => {
    if (!isCurrentlyPending) {
        return;
    }

    const interval = setInterval(() => {
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    }, pollIntervalMs);

    return () => clearInterval(interval);
}, [account, dispatch, isCurrentlyPending, pollIntervalMs]);
```

The callback only ever needs `account.key`. Its sibling in the Tron staking flow does exactly this
same interval pattern with the narrow dep already:

```tsx
// useTronStakePendingTransactionTracking.ts:46-56 — correct
useEffect(() => {
    if (!isCurrentlyPending) {
        return;
    }

    const interval = setInterval(() => {
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    }, pollIntervalMs);

    return () => clearInterval(interval);
}, [account.key, dispatch, isCurrentlyPending, pollIntervalMs]);
```

### Proposed fix

Change the yield version's dependency array from `[account, dispatch, isCurrentlyPending, pollIntervalMs]`
to `[account.key, dispatch, isCurrentlyPending, pollIntervalMs]` — matching the Tron sibling exactly.
No other change needed; the callback body already only reads `account.key`.

### Why it matters

This is the repo's documented flagship bug shape (`skills/performance-react-hooks/SKILL.md`'s
"account is a new object after every blockchain update" example, ref #23523) recurring in the yield
module while its Tron staking sibling already has the fix. Every unrelated account mutation during
a pending tx (a poll tick from _this same effect_, or any other blockchain update touching the
account) clears and restarts the poll timer instead of letting it run to term, which can delay or
disrupt detection of the pending transaction's confirmation — the one thing this hook exists to
track.

---

## F-03-7 — Earn staking dashboard: a `.filter()` crosses the hook boundary and defeats two downstream `useMemo`s

- **Class:** 1 (unstable dependency crossing a hook boundary), compounding into class 6 (the
  downstream memos are pure overhead)
- **Where:** `packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:45-53`
  → `packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx:56-92,94-144`
- **Trigger cadence:** every render of the staking dashboard table (mounted on the Earn dashboard;
  re-renders on every fiat-rate tick via `currentRates`, plus any unrelated parent re-render)
- **Severity guess:** P2
- **Confidence:** high

### Before (verbatim from the files)

```tsx
// useStakingTableData.ts:45-53
const accounts = useSelector(selectVisibleDeviceAccounts);

const stakingAccounts = accounts.filter(
    account =>
        account.symbol === 'eth' ||
        account.symbol === 'sol' ||
        account.symbol === 'ada' ||
        account.symbol === 'trx',
);
```

`stakingAccounts` — a fresh array from a bare `.filter()`, every render — is then passed as a prop
into `useStakingAccountsVisibility`, crossing the hook boundary:

```tsx
// useStakingAccountsVisibility.tsx:56-63 and :65-77 — also unmemoized, also fresh every render
const [accountsStakingActive, accountsStakingNotActive] = arrayPartition(
    stakingAccounts,
    (account: Account) => {
        /* ... */
    },
);

const [accountsSufficientFunds, accountsInsufficientFunds] = arrayPartition(
    accountsStakingNotActive,
    (account: Account) => {
        /* ... */
    },
);

const alwaysVisibleAccounts = useMemo(
    () => [
        ...accountsStakingActive.toSorted(compareEarnByAmountDesc(getAccountStakedAmountInFiat)),
        ...accountsSufficientFunds.toSorted(compareEarnByAmountDesc(getAccountBalanceInFiat)),
    ],
    [
        accountsStakingActive,
        accountsSufficientFunds,
        getAccountStakedAmountInFiat,
        getAccountBalanceInFiat,
    ],
);
```

Both `useMemo` calls in `useStakingAccountsVisibility` (`alwaysVisibleAccounts` at :79-92 and
`collapsedInsufficientFundsAccounts` at :94-144) depend on `accountsStakingActive` /
`accountsSufficientFunds` / `alwaysVisibleAccounts` — every one of which is itself a fresh
`arrayPartition()`/spread result computed directly in the hook body, never memoized. Neither
`useMemo` can ever hit: they recompute on every render regardless of whether `stakingAccounts`'s
contents actually changed.

### Proposed fix

Memoize at the source and at each derivation step: wrap `stakingAccounts` in
`useMemo(() => accounts.filter(...), [accounts])` in `useStakingTableData.ts`, then wrap both
`arrayPartition(...)` calls in `useStakingAccountsVisibility.tsx` in their own `useMemo`s keyed on
`[stakingAccounts]` / `[accountsStakingNotActive]` respectively, so the two existing `useMemo`s
downstream finally see stable inputs.

### Why it matters

This is the earn/staking dashboard the skill's worked example points at. As written, the two
`useMemo`s that sort and merge the account list provide no caching at all — they, and the two
`arrayPartition` scans feeding them, rerun in full on every dashboard render (including every
fiat-rate tick), which is pure overhead rather than a bug, but it is exactly the class the skill
calls "this repo's actual recurring pain."

---

## F-03-8 — `TransactionItem` rebuilds `createTargets()` unmemoized on every render

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:86`
  (+ `suite-common/wallet-core/src/transactions/target/createTargets.ts:59-67`)
- **Trigger cadence:** every render of `TransactionItem` — once per transaction row; `TransactionItem`
  is `memo()`-wrapped (protects against unchanged-prop re-renders from its parent list) but still
  re-renders on its own `useSelector(selectSelectedAccount)` / `useSelector(selectAccountByKey)` /
  `useSelector(selectIsPhishingTransaction)` subscriptions firing
- **Severity guess:** P2
- **Confidence:** medium-high — the per-call cost scales with `transaction.targets.length +
internalTransfers.length + tokens.length`, which is small for a plain transfer but can be large
  for coinjoin rounds/batch sends (this file tree has a dedicated `CoinjoinBatchItem.tsx`); I did
  not measure real-world output counts.

### Before (verbatim from the file)

```tsx
export const TransactionItem = memo(
    ({ transaction, accountKey, isActionDisabled, isPending, network, accountType, disableBumpFee, index }: TransactionItemProps) => {
        const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(transaction.symbol);
        const account = useSelector(selectSelectedAccount) || null;
        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;
        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(`${AccountTransactionBaseAnchor}/${transaction.txid}`);
        const { type } = transaction;

        const allOutputs = account !== null ? createTargets({ transaction, account }) : [];
```

`createTargets` (`suite-common/wallet-core/src/transactions/target/createTargets.ts:59-67`) does
three `.map()`/`.filter()` passes (`targets`, `internalTransfers`, `tokens`) and spreads the results
into one array — called fresh on every render, feeding `<TransactionTargetsList allOutputs={allOutputs} />`.

### Proposed fix

`const allOutputs = useMemo(() => (account !== null ? createTargets({ transaction, account }) : EMPTY_TARGETS), [account, transaction]);`
with a module-level `EMPTY_TARGETS: Target[] = []` constant for the `null` branch.

### Why it matters

Rendered once per transaction in a list that can be long-running (pagination aside, coinjoin/batch
transactions push output counts well above a typical 1-3 target transfer); recomputes on every
self-triggered re-render of the row even when the transaction itself hasn't changed.

---

## F-03-9 — `TransactionTarget` linear-scans the account's full Suite-Sync output-label list, unmemoized

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx:79-83,193-195`
- **Trigger cadence:** every render of `TransactionTarget` (not `memo()`-wrapped) — including every
  time the global `selectLabelingValueBeingEdited` flag changes (any output label anywhere starting
  or stopping edit), which re-renders every mounted target row at once
- **Severity guess:** P3
- **Confidence:** medium — the list this scans is genuinely user-scaling (every Suite-Sync output
  label the account has ever had set), but only non-trivial for heavy Suite-Sync users; I did not
  measure typical sizes. This sits close to the asymptotic-complexity boundary (linear scan instead
  of an index) — I'm reporting only the "unmemoized, reruns on unrelated re-renders" half, which is
  the hooks angle; the O(n) lookup shape itself is out of scope here.

### Before (verbatim from the file)

```tsx
const suiteSyncOutputLabels = useSelector(state =>
    isSuiteSyncEnabled
        ? selectSuiteSyncOutputLabels(state, transaction.deviceState)
        : returnStableArrayIfEmpty<SuiteSyncOutput>(),
);
// ...
const outputLabel =
    suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)
        ?.label ?? (isLegacyLabelingVisible ? targetMetadata : undefined);
```

### Proposed fix

`useMemo(() => suiteSyncOutputLabels.find(it => it.txId === transaction.txid && it.txTargetId === targetId)?.label, [suiteSyncOutputLabels, transaction.txid, targetId])`,
then fold in the `isLegacyLabelingVisible ? targetMetadata : undefined` fallback outside the memo.

### Why it matters

The rest of this same component (`amount`, `amountComponent`, `fiatAmountComponent`, `label`) is
already carefully `useMemo`'d with narrow deps — this one line is the odd one out, redone on every
render including the ones caused by a sibling row's label entering edit mode.

---

## Checked, clean

- `packages/suite/src/components/earn/staking/tron/vote/TronVoteRepresentativeSelect.tsx:38-52` —
  correct pattern: `useMemo` depends on `representatives.data` itself (not a `?? []`-guarded copy),
  so the fallback only applies to the memo's _return_ value, not its dependency. Good counter-example.
- `TronVoteSummaryCard.tsx:13`, `TronStakeSummaryCard.tsx:28`, `TronVoteApr.tsx:19` — all do
  `(representatives.data ?? []).find(...)` directly in the render body, but Tron's Super
  Representative list is protocol-capped (~127) and these aren't per-row list items; below the
  skill's "unbounded/user-scaling" bar for class 4.
- `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItemsGroup.tsx:68`
  (`rates ?? {}`) — feeds a plain util call (`areTokenFiatRatesLoading`), not a memo/callback/effect
  dep or a selector argument; the fresh-object concern doesn't propagate. The underlying
  whole-fiat-rates-map subscription shape is the general pattern already covered by #28880.
- `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:93-152` (incl.
  `:106` `tokens: account.tokens ?? []`) and `AccountItemsGroup.tsx:68` — both already fully covered,
  including the exact hooks-class fix (`useMemo` + `useDeferredValue`), by
  `perf-issues/scheduling/p1-13-accounts-sidebar-filters-urgently-on-every-keystroke.md`; not
  duplicated here.
- `EarnStakingAccountRow.tsx:75`, `EarnClaimModal.tsx:58`, `UnstakeInputs.tsx:50`,
  `UnstakeForm.tsx:46` — all `getStakingDataForNetwork(account) ?? {}`, but every destructured field
  (`canClaim`, `claimableAmount`, `restakedReward`, `autocompoundBalance`, `depositedBalance`) is a
  string/boolean primitive. Primitives compare by value under `Object.is`, so the fallback object's
  _reference_ freshness never reaches a memo/effect/selector dependency — not the class-1 bug despite
  matching the grep shape.
- `EarnClaimModal.tsx:89-91` (`useEffect(() => onClaimChange(claimableAmount), [onClaimChange, claimableAmount])`)
  — traced `onClaimChange` through `packages/suite/src/hooks/earn/useClaimForm.ts:91-101` to a
  `useCallback` chain (`clearErrors`/`setValue` from react-hook-form, `onCryptoAmountChange` itself
  `useCallback`'d) that is stable in practice; effect only refires on a genuine value change.
- `packages/suite/src/components/wallet/WalletLayout/AccountBanners/hooks/useEarnEthBanner.ts:29-81`
  — `wrappedNativeVaults` is correctly `useMemo`'d; the two downstream `useSelector` calls redo
  `.some()`/`.filter().map().filter()` on every dispatch, but the source array is capped to vaults
  matching one account's symbol (a handful at most) and both selectors return primitives
  (boolean/number), so there's no re-render amplification — below the reporting bar.
- C8 sites in this area — `useWrappedNativeFlowAnalytics.ts:92`,
  `useYieldFlow.ts:149,158,167,174`, `useYieldPendingTransactionTracking.ts:214` — all use
  `useCurrentRef` to snapshot the latest value for a callback/cleanup-effect that runs later, which
  is the correct use case; none need _previous_-value semantics, so no class-7 misuse in this area.
  Several pass an inline object literal (e.g. `{ status, networkSymbol }`), which makes
  `useCurrentRef`'s own internal effect re-run every render instead of only on real change — harmless
  since that effect body is just a ref assignment, not worth a separate finding.
- `packages/suite/src/components/earn/staking/tron/hooks/useTronStakeFlow.ts:47-54` and
  `useTronStakePendingTransactionTracking.ts:46-56` — both correctly depend on `account.key`, not
  `account`; the latter is the direct correct counterpart cited in F-03-6.
- `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx` —
  `amount`, `amountComponent`, `fiatAmountComponent`, `label` are all correctly `useMemo`'d with
  narrow deps, and the Suite-Sync labels fallback correctly uses `returnStableArrayIfEmpty` rather
  than `?? []` (see F-03-9 for the one line in this file that isn't memoized).
- `packages/suite/src/components/wallet/Fees/CollapsibleFees/hooks/useFetchFees.ts`,
  `hooks/useTransactionMaxFee.ts`, `StandardFee/hooks/useNetworkFeeOptions.ts` — internal `useMemo`
  deps are consistent; whether `feeInfo.levels`/`composedLevels` are themselves referentially stable
  depends on each caller's construction in `packages/suite/src/hooks/wallet/form/useFees.ts` and
  friends, which is outside this area (`src/hooks`) — not verified either way.
- `packages/suite/src/components/wallet/Fees/CollapsibleFees/CustomFee/CustomFeeEthereum.tsx` — uses
  `watch()` (with a comment explaining why, over `getValues`) for cross-field validation triggers,
  and only reads `getValues` inside callbacks/validators, not in a bare mount-effect like its Tron
  sibling (F-03-1).
- `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItem/AccountRow/AccountRow.tsx`
  and `AccountItemContent/BaseCurrency.tsx` — plain presentational components, selectors return
  primitives, no memoization concerns.
- `AccountLabelForOwnAddress.tsx` (referenced from `TargetAddressLabel.tsx` and
  `TransactionTarget.tsx`) lives under `packages/suite/src/components/suite/labeling/`, outside this
  area's path prefixes (`components/wallet`, `components/earn`) — not scanned here; already drafted
  under `perf-issues/asymptotic-complexity` per PROGRESS.md.
- C9 candidate files outside this area's path prefix (`SuiteBanners.tsx`, `AddTokenModal.tsx`,
  `ConfirmUnverifiedModal.tsx`, etc.) belong to area 02, already done.
- `packages/suite/src/components/earn/yield/{wrap/WrapNativeToken.tsx, unwrap/UnwrapNativeToken.tsx,
common/YieldApproveModal.tsx, common/YieldAmountCard.tsx, hooks/useYieldFiatInput.ts,
withdraw/useYieldWithdraw.ts, withdraw/YieldWithdrawForm.tsx}`,
  `earn/dashboard/yield/{EarnYieldTable.tsx, EarnYieldApyTooltip.tsx}`,
  `earn/modals/{shared/VotingDelegations/VotingDelegationsOptions.tsx, EarnInANutshell/EarnInANutshellModal.tsx}`,
  `earn/staking/tron/hooks/useTronStakeFees.ts`,
  `wallet/CoinjoinAccountDiscoveryProgress/RotatingFacts.tsx`,
  `wallet/Fees/CollapsibleFees/StandardFee/EthereumFeeCards.tsx` — all `useEffect`/`useMemo`/
  `useCallback` usages checked have narrow, correct deps, guard re-entry with refs or value
  comparisons before calling `setState`, or key off primitives; no unstable-dependency or
  effect-loop pattern found.
