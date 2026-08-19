# Scan area 04 — packages/suite/src/views/wallet

Area: `packages/suite/src/views/wallet/**` (~360 files) — send form, receive, transactions list,
coinmarket/trading views, staking, tokens, coin-control. Verified against `issues/perf-react-hooks`
@ `9e0d5b6a45`. Web/desktop, not React-Compiler-covered — manual memoization findings are valid
throughout this area.

Excluded per the agent brief / `PROGRESS.md` (skipped as exact defects, not re-filed below):
`useUtxoSelection.ts:63` UTXO scans + coin-control keystroke rescan (asymptotic-complexity
`p1-09` + scheduling `p2-05`), `TransactionsGraph.tsx` `setWidth` (#31137, lives outside this area
anyway), token search / accounts-sidebar keystroke filtering (scheduling `p1-12`/`p1-13`),
`TransactionSummary` render-body aggregation (scheduling `p2-06`), `TransactionsGroup.tsx:52`
`getErc4626Contracts` loop-invariant hoist (asymptotic-complexity `p3-03`, already proposes the
`useMemo` fix).

---

## F-04-1 — `CoinControl.tsx` re-fetches UTXO transaction history on every account reference change, not just on mount

- **Class:** 2 (effect refetch / render loop — silent, real network/backend round-trip)
- **Where:** `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:144-155`
- **Trigger cadence:** every store update that gives the open account a fresh object reference while
  the Coin Control panel is open in the send form — i.e. every relevant blockchain sync tick during
  UTXO selection, not merely once at mount
- **Severity guess:** P1 (hot for its scenario — composing a Bitcoin-like transaction is exactly the
  moment the account is actively syncing/fee-polling, and this dispatches a real thunk each time)
- **Confidence:** high — the effect body only reads `account.key`; `account` itself is unused inside
  the callback, so the whole-object dependency is provably wider than necessary. This is a distinct
  defect from the already-excluded `useUtxoSelection.ts:63` O(n²) scan and the scheduling `p2-05`
  keystroke-rescan doc — those are about the UTXO list computation and the search box; this is about
  the dependency array of the fetch effect that seeds it, and both existing docs describe this fetch
  as happening "on mount" (`CoinControl.tsx:145`/`:147`), which undersells the actual cadence

### Before (verbatim from the file)

```tsx
// fetch all transactions so that we can show a transaction timestamp for each UTXO
useEffect(() => {
    const promise = dispatch(
        fetchUtxoTransactionsForAccountThunk({
            accountKey: account.key,
        }),
    );

    return () => {
        promise.abort();
    };
}, [account, dispatch]);
```

### Proposed fix

Depend on `account.key` instead of `account` (mirrors the skill's `AdaStakingDashboard.tsx:52`
pattern). Nothing else in the effect body needs the live `account` reference.

### Why it matters

Every time the open account's own record refreshes while a user is selecting UTXOs to compose a
transaction — new block, balance/UTXO-set update — this effect aborts the in-flight
`fetchUtxoTransactionsForAccountThunk` promise and redispatches it. `asymptotic-complexity/p1-01`
already documents that this same thunk drives an O(m²) `unshift` reducer path for
coinjoin-sized UTXO sets; narrowing this dependency wouldn't fix that reducer, but it would stop
multiplying its cost by however many times the account reference churns while the panel stays open,
instead of paying it once.

---

## F-04-2 — `TokenSelect.tsx`'s amount-revalidation effect depends on the whole `account` object for a check that only needs two static fields

- **Class:** 1 (unstable/wider-than-necessary hook dependency) with a class-2 flavor (it's an effect,
  so the extra dependency causes real re-execution, not just a wasted memo)
- **Where:** `packages/suite/src/views/wallet/send/Outputs/TokenSelect/TokenSelect.tsx:70-75`
  (co-anchor: `hasNetworkFeatures`, `suite-common/wallet-utils/src/accountUtils.ts:1045-1053`, reads
  only `account.symbol`/`account.accountType` via `getNetworkAccountFeatures`)
- **Trigger cadence:** every store update that gives the currently-edited send-form account a fresh
  reference while this output row is mounted (i.e. while the user is filling in a Send form output)
- **Severity guess:** P2 (real repeated work — re-reads the amount field and calls `setAmount` again
  — but idempotent in the common case, not a network call)
- **Confidence:** high that the dependency is wider than the check needs (`hasNetworkFeatures`
  provably never reads balance/UTXO/tx fields); medium on how visible the repeated `setAmount` call
  is to the user, since I did not trace whether `setAmount` itself has further re-render side effects

### Before (verbatim from the file)

```tsx
useEffect(() => {
    if (hasNetworkFeatures(account, 'tokens') && !isSetMaxActive) {
        const amountValue = getValues(`outputs.${outputId}.amount`);
        if (amountValue) setAmount(outputId, amountValue);
    }
}, [account, outputId, tokenWatch, setAmount, getValues, isSetMaxActive]);
```

### Proposed fix

Depend on `account.symbol` (or `account.accountType`, whichever `hasNetworkFeatures` actually
branches on for this network) instead of `account`. `tokenWatch` is already the reactive trigger for
"the user changed token"; `account` is only along for the network-features check.

### Why it matters

`account` gets a fresh object reference on every relevant blockchain sync tick (per this sweep's
ground truth). As written, this effect re-runs the amount re-validation/re-format on every one of
those ticks while a Send output row is open, not just when the user actually changes the selected
token — pure repeated work for a check that never changes for the account's lifetime.

---

## F-04-3 — `useBuildTokenOptions` keys its token-list memo on the whole `account` object, so it never caches while the Send token picker is open

- **Class:** 1 (unstable hook dependency — memo never hits because the dep is wider than the closure)
- **Where:** `packages/suite/src/views/wallet/send/Outputs/TokenSelect/SelectTokenAssetModal/hooks/useBuildTokenOptions.tsx:68-84`
  (consumer: `SelectTokenAssetModal.tsx:72-75`, the Send-form "select token" modal)
- **Trigger cadence:** every render of `SelectTokenAssetModal` caused by an `account` reference
  change (blockchain sync tick) while the modal is open, not just when `account.tokens` actually
  changes
- **Severity guess:** P2 (real — rebuilds and re-sorts the full token list with fiat-rate enhancement
  each time — but scoped to a modal's lifetime, not an always-mounted component)
- **Confidence:** high — the memo body only reads `account.tokens` and `account.symbol` (both passed
  into `buildTokenOptions`/`enhanceTokensWithRates`); the full `account` object is listed as the dep

### Before (verbatim from the file)

```tsx
return useMemo(() => {
    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        baseCurrencyCode,
        account.symbol,
        fiatRates,
    );

    const sortedTokensWithRates = tokensWithRates.sort(sortTokensWithRates);

    return buildTokenOptions(
        account,
        sortedTokensWithRates,
        coinDefinitions,
        expandedHiddenTokensGroups,
    );
}, [account, baseCurrencyCode, fiatRates, coinDefinitions, expandedHiddenTokensGroups]);
```

### Proposed fix

Narrow the dep to `account.tokens` and `account.symbol` (both already destructured/used inside);
`buildTokenOptions` still receives the full `account` object as an argument, only the dependency
array needs narrowing.

### Why it matters

`sortTokensWithRates` allocates a `BigNumber` per comparison and this modal's own token counts scale
with the account's ERC-20/SPL list (including the spam/airdrop tail the complexity audit already
documents elsewhere). Because the memo is keyed on the whole `account`, it recomputes on every
account refresh while the picker is open even though the token list and rates usually haven't
changed — the memo is present in the code but structurally cannot hit.

---

## F-04-4 — `EthereumNonce` re-filters the account's entire transaction history on every keystroke of the custom-nonce input

- **Class:** 4 (render-body work that belongs elsewhere — unmemoized filter/map over `transactions`)
- **Where:** `packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx:47,90-94`
- **Trigger cadence:** every keystroke in the nonce-override field (`nonceValue = useWatch({ name:
'ethereumNonce', control })` at `:50` drives this component's re-renders)
- **Severity guess:** P2 (real per-keystroke unbounded-list work, matching the brief's "send-form
  fields / per-keystroke re-render chains" priority — not P1 because the nonce-override UI is an
  opt-in advanced action, not the default Send flow)
- **Confidence:** high that the filter/map chain is unmemoized and re-runs every render; medium on
  real-world severity since I did not verify typical EVM account transaction-history sizes

### Before (verbatim from the file)

```tsx
const transactions = useSelector(state => selectAccountTransactions(state, account.key));
...
const nonceValue = useWatch({ name: 'ethereumNonce', control });
...
const pendingSentTxs = transactions.filter(isPending).filter(isSignedByAccount);

const pendingNonces = pendingSentTxs
    .map(tx => tx.ethereumSpecific?.nonce)
    .filter((nonce): nonce is number => typeof nonce === 'number');
```

### Proposed fix

`const { pendingSentTxs, pendingNonces } = useMemo(() => {...}, [transactions])` — neither derived
value depends on `nonceValue`, so this is a pure win: the recompute would only fire when the
account's transaction list actually changes, not on every character typed into the nonce field.

### Why it matters

`selectAccountTransactions` returns the account's whole transaction list; filtering it twice plus a
map/filter chain on every keystroke while overriding a nonce is exactly the render-body-work-over-an-
unbounded-list shape the skill calls out, just gated behind a less-common entry point than the main
Send form fields.

---

## F-04-5 — `TokensNavigation`'s tab-count computation runs `getTokens` over the full account token list on every render, including every keystroke in the sibling search box

- **Class:** 4 (render-body work that belongs elsewhere)
- **Where:** `packages/suite/src/views/wallet/tokens/TokensNavigation.tsx:126-131` (parent:
  `packages/suite/src/views/wallet/tokens/index.tsx:20,67-73` and
  `packages/suite/src/views/wallet/nfts/index.tsx:14,36-41`, both of which hold `searchQuery` in
  state and pass it down as a prop that `TokensNavigation` binds to its own `<Input value=...>`)
- **Trigger cadence:** every render of `TokensNavigation` — which includes every keystroke in the
  token/NFT search box, since `searchQuery` is one of its props, even though this specific
  computation does not use `searchQuery` at all
- **Severity guess:** P2 (real, unmemoized, over a list the complexity audit already documents as
  unbounded/spam-tail-prone; not P1 here because the scheduling doc frames the per-keystroke path's
  urgency as the table rows, not this count, and I have not measured typical token-list sizes)
- **Confidence:** high that this exact line is unmemoized and keystroke-adjacent; flagging explicitly
  that `perf-issues/scheduling/p1-12-token-search-rebuilds-the-unvirtualised-table-per-keystroke.md`
  already names this precise line in its own Notes section ("Also left alone: the unmemoised
  `getTokens` for the tab counts at `TokensNavigation.tsx:126`... making it cheaper is a complexity
  fix, not a scheduling one") but explicitly declines to fix it — this finding is that it's also a
  missing-memoization defect, not only a complexity one, since the call doesn't even depend on the
  value (`searchQuery`) that's forcing its re-execution

### Before (verbatim from the file)

```tsx
const tokens = getTokens({
    tokens: selectedAccount.account.tokens || [],
    symbol: selectedAccount.account.symbol,
    tokenDefinitions,
    isNft,
});
```

### Proposed fix

`useMemo(() => getTokens({ tokens: selectedAccount.account.tokens || [], symbol:
selectedAccount.account.symbol, tokenDefinitions, isNft }), [selectedAccount.account.tokens,
selectedAccount.account.symbol, tokenDefinitions, isNft])`. None of those inputs change per
keystroke, so this absorbs the search-box-driven re-renders entirely.

### Why it matters

This call exists only to produce the tab-count badges (`normalTokens.length`, `erc4626Tokens.length`,
`tokens.hiddenWithBalance.length`); it is loop-invariant with respect to the search string that is
currently forcing it to re-run on every keystroke. `HiddenTokensTable.tsx:23-35` has the identical
missing-memo shape and is already flagged (not filed) in the same scheduling doc's Notes — not
re-reported here as its own finding, but named for triage since a shared fix likely covers both.

---

## F-04-6 — Two Trading asset-picker hooks read `useCurrentRef(fiatRates)` inside a `useMemo`, so fiat sort order lags a render behind rate ticks

- **Class:** 7 (wrong ref hook for the moment of read — same shape the skill names explicitly: read
  in a `useMemo` needs `useFreshRef`, not `useCurrentRef`)
- **Where:**
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:90,92-93,171-179`
  and
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts:59,61-62,180`
- **Trigger cadence:** every fiat-rate tick while the Trading Buy/Sell asset picker is open
- **Severity guess:** P2 (real staleness confined to a picker's sort/display order, same grade as the
  precedent finding)
- **Confidence:** high on the mechanism (identical to area 02's already-reported `F-02-6` on the
  sibling `GlobalSendModal/hooks/useAccountWithTokensOptions.ts` — this is the same bug pattern
  appearing in two more, differently-located files with the same name/shape, both inside this area);
  medium on user-visible impact, same caveat as `F-02-6`

### Before (verbatim from the file — `useAgregatedAccountsWithTokens.ts`)

```tsx
const throttledAccounts = useThrottle(accounts, 3000);
const fiatRatesRef = useCurrentRef(fiatRates);

return useMemo(() => {
    const fiatRates = fiatRatesRef.current;

    if (!fiatRates) {
        return [];
    }
    ...
}, [throttledAccounts, baseCurrencyCode, fiatRatesRef, tokenDefinitions]);
```

The Sell-asset-picker `useAccountWithTokensOptions.ts` repeats the identical pattern at its own
lines 90 (`useCurrentRef(fiatRates)`) and 92-93 (`const fiatRates = fiatRatesRef.current;` inside its
`useMemo`, deps at `:171-179`).

### Proposed fix

Swap `useCurrentRef(fiatRates)` for `useFreshRef(fiatRates)` in both files (assigns during render, so
`.current` is always this render's value when read synchronously inside the memo body).

### Why it matters

Because the ref object itself is stable, listing it in the memo's deps never triggers a recompute on
its own; the memo only re-evaluates when the other listed deps change, and when it does, `.current`
can still hold the rate from before the previous render's update. Same failure mode, same fix, as the
already-reported instance in area 02 — worth fixing together since all three hooks appear to descend
from the same copy-pasted shape.

---

## F-04-7 — Five Trading-form action components call `watch()` with no field name, so they re-render on every keystroke anywhere in the form

- **Class:** 6 (wasted/wrong memoization) — the skill's own wording for this class is scoped to
  "`react-hook-form`'s `watch()` inside **compiled suite-native** code (compiler bail-out)"; these
  files are `packages/suite` (not compiled), so there is no compiler auto-memoization to bail out of.
  I'm reporting this anyway because the harvest explicitly carved out a `C2b` category for exactly
  this shape in web code ("bare `watch()` in web `packages/suite` — whole-form re-render per
  keystroke"), and the mechanism is the closest web analogue: an unscoped subscription that forces a
  wider re-render than the component's own output needs, the same underlying problem the compiled
  case has a name for. Flagging the class stretch explicitly per the honesty rules — triage may want
  to re-bucket this as a new observation rather than class 6.
- **Where:**
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx:63`,
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings.tsx:24`,
  `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon.ts:35`,
  `packages/suite/src/views/wallet/trading/exchange/TradingFormOfferExchangeActions.tsx:44`,
  `packages/suite/src/views/wallet/trading/sell/TradingFormOfferSellActions.tsx:30`
- **Trigger cadence:** every keystroke in any field of the active trading form (amount, address,
  country, payment method, ...), for every one of these five components/hooks simultaneously since
  `useTradingFormOfferCommon` is called from inside both action components
- **Severity guess:** P2 (real wasted render work — several `useSelector` calls and derived booleans
  re-run per unrelated keystroke — not P1 since the trading form isn't a per-row list, so the
  multiplier is "one component tree", not "one per row")
- **Confidence:** medium — high confidence the subscription is unscoped and wider than needed;
  medium on how much this actually costs per keystroke since I did not profile it, and medium on
  classification (see Class note above) — would raise to high with a render-count measurement showing
  these components actually commit on unrelated-field keystrokes, and drop this if a maintainer
  considers unscoped `watch()` acceptable/intentional here for reasons I didn't find in the code

### Before (verbatim from the file — `TradingFormApproval.tsx`)

```tsx
const {
    watch,
    approveTransaction,
    ...
} = context;
...
const { exchangeType, rateType } = watch();
```

(`TradingFormOffersWarnings.tsx:24` — `const { countrySelect, countrySubdivisionSelect } =
context.watch();`; `useTradingFormOfferCommon.ts:35` — `const { amountInCrypto } = watch();`;
`TradingFormOfferExchangeActions.tsx:44` — `const { outputs, sendCryptoSelect, receiveCryptoSelect,
exchangeType, rateType } = watch();`; `TradingFormOfferSellActions.tsx:30` — `const { outputs } =
watch();`)

### Proposed fix

Replace each with a scoped subscription — `useWatch({ control, name: ['exchangeType', 'rateType'] })`
(or individual `useWatch({ control, name: 'exchangeType' })` calls) — the same pattern already used
correctly elsewhere in this area:
`TradingFormInputFiat.tsx:74-80` (`useWatch({ control, name: TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT
})`, four scoped calls in one file) and `TradingFormInputCryptoAmount.tsx:181-184`.

### Why it matters

An unscoped `watch()` subscribes the calling component to every field change in the form, not just
the destructured ones. Typing an amount, picking a country, or any other field edit re-renders all
five of these components even when the fields they actually read haven't changed — the exact
"whole-form re-render per keystroke" shape the grep harvest was built to catch, just without a
compiler in the room to call it a bail-out.

---

## F-04-8 — Trading Detail pages scan the full accounts list with a bare `.find()` instead of a keyed selector

- **Class:** 4 (render-body work that belongs elsewhere — the fix already exists as a selector)
- **Where:**
  `packages/suite/src/views/wallet/trading/buy/TradingBuyDetail/TradingBuyDetailContent.tsx:53,77`,
  `packages/suite/src/views/wallet/trading/sell/TradingSellDetail/TradingSellDetailContent.tsx:46,70`,
  `packages/suite/src/views/wallet/trading/exchange/TradingExchangeDetail/TradingExchangeDetailContent.tsx:108-109`,
  `packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSell.tsx:43`
- **Trigger cadence:** every render of the relevant Trade Detail/offer page (driven mainly by trade
  status polling, not per-keystroke)
- **Severity guess:** P3 (cleanup — cold path, four small call sites, cheap fix)
- **Confidence:** high that the pattern is unmemoized and repeated across all four files; the accounts
  list itself is likely reference-stable between renders (`selectAccounts`), so this is about the
  repeated scan, not a churn problem

### Before (verbatim, `TradingSellDetailContent.tsx`)

```tsx
const accounts = useSelector(selectAccounts);
...
const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);
```

(`TradingBuyDetailContent.tsx:77` and `TradingOfferSell.tsx:43` repeat the identical
`accounts.find(account => account.key === trade?....AccountKey)` shape; `TradingExchangeDetailContent.tsx:108-109`
does it twice, once per side of the trade.)

### Proposed fix

`useSelector(state => selectAccountByKey(state, trade?.sendAccountKey))` (already imported/used
elsewhere in this area, e.g. `TradingFormInputCryptoAmount.tsx:186`) instead of selecting the whole
list and scanning it per render.

### Why it matters

Minor on its own — grouped because it's the same cheap, repeated pattern across four files and a
keyed selector already exists in the codebase for exactly this lookup.

---

## F-04-9 — `Tokens`/`Nfts` route guards key their redirect effect on the whole `selectedAccount` object

- **Class:** 1 (unstable hook dependency — wider than the condition actually needs)
- **Where:** `packages/suite/src/views/wallet/tokens/index.tsx:24,28-36`,
  `packages/suite/src/views/wallet/nfts/index.tsx:16,20-27`
- **Trigger cadence:** every store update that gives `state.wallet.selectedAccount` a fresh reference
  (i.e. every relevant account/blockchain sync tick) while either route is mounted
- **Severity guess:** P3 (bounded-but-wasteful — the guarded action, `dispatch(goto(...))`, only
  actually fires when the network genuinely lacks the feature or the route is wrong, both stable
  conditions, so nearly every re-run is a no-op comparison)
- **Confidence:** high that the dependency is wider than the read fields (`.status`,
  `.network?.features`/`hasNetworkFeatures(selectedAccount.account, ...)`); low severity is by
  design given how inert the effect body is in the common case

### Before (verbatim, `tokens/index.tsx`)

```tsx
useEffect(() => {
    if (
        selectedAccount.status === 'loaded' &&
        !hasNetworkFeatures(selectedAccount.account, 'tokens') &&
        routeName !== 'wallet-index'
    ) {
        dispatch(goto({ routeName: 'wallet-index', preserveParams: true }));
    }
}, [selectedAccount, dispatch, routeName]);
```

`nfts/index.tsx:20-27` repeats the same shape against `selectedAccount.network?.features`.

### Proposed fix

Depend on `selectedAccount.status` and `selectedAccount.account?.symbol` (the field
`hasNetworkFeatures`/`.network?.features` actually keys off) instead of the whole `selectedAccount`
object.

### Why it matters

Listed for completeness alongside the higher-severity findings above — same "whole object where a
primitive would do" shape, but the guarded action is idempotent and rare, so this is cleanup rather
than a real render/request cost.

---

## Checked, clean

- `packages/suite/src/views/wallet/staking/components/AdaStakingDashboard/AdaStakingDashboard.tsx:43-52`
  and `EthStakingDashboard/EthStakingDashboard.tsx:59-68` — both already depend on `accountKey`, not
  `account`, for their `fetchAllTransactionsForAccountThunk` effect. This is the skill's own "good"
  worked example (`AdaStakingDashboard.tsx:52`) — confirmed still correct at this commit, no
  surviving sibling of the pre-#23523 bug found in either file.
- `packages/suite/src/views/wallet/staking/components/SolStakingDashboard/SolStakingDashboard.tsx` —
  `pagintionRef = useCurrentRef(pagination)` at `:70` is read inside the very next `useEffect`
  (`:72-75`), not a memo; hook-declaration order guarantees `useCurrentRef`'s own effect commits
  first, so `.current` is fresh by the time this effect reads it. Correct usage, contrast with F-04-6.
- `packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronStakingDashboard.tsx`
  and its child cards — no `useEffect`/`useMemo` at all; nothing to check.
- `packages/suite/src/views/wallet/staking/components/StakingDashboard/components/ClaimCard.tsx:35-55`
  — `prevIsClaimPending` is a plain `useRef` assigned on the last line of its effect, matching the
  skill's "good" `TransactionReviewModalBody.tsx:59` previous-value pattern exactly.
- `packages/suite/src/views/wallet/staking/components/EthStakingDashboard/InstantStakeBanner.tsx:43-55`
  and `StakingDashboard/hooks/useIsTxStatusShown.ts:13-39` — same correct plain-`useRef`
  previous-value pattern, both reset-on-account-change then compare-and-update at the end of the
  effect.
- `packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumOptions.tsx:29-52` — uses
  `useWatch({ name: 'options', control })` (scoped) rather than bare `watch()`, and its own code
  comments explicitly explain why the EVM-nonce fetch is gated on `isEditingNonce` rather than
  running on every account update. Good example, contrast with F-04-7.
- `packages/suite/src/views/wallet/send/Options/TronOptions/TronNote.tsx`,
  `TronOptions.tsx`, `send/Options/BitcoinOptions/Locktime/Locktime.tsx`,
  `send/Options/shared/TransactionData.tsx`, `send/Outputs/Outputs.tsx`,
  `send/Outputs/Amount/Amount.tsx`, `send/Outputs/Address.tsx` — all `watch()`/`useWatch()` calls in
  this group pass explicit field names (single string or array), and every `useEffect` dependency
  array is narrow (primitives or explicitly-watched fields). No issues found.
- `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat.tsx:74-80`
  and `TradingFormInputCryptoAmount.tsx:181-184` — both use scoped `useWatch({ control, name: ... })`
  calls; good counter-examples to F-04-7 in the same file family.
- `packages/suite/src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs.tsx:57-58`,
  `TradingExchangeFormInputs.tsx:109-112`, `TradingSellFormInputs.tsx:90` — all `useCurrentRef(...)`
  values here are only read inside click-driven `useCallback` bodies (`handleCryptoSelect`,
  `handleSellAssetSelect`, etc.), never in render or in a `useMemo`; by the time a user clicks, the
  ref's own effect has already committed the latest value. Correct usage, contrast with F-04-6.
- `packages/suite/src/views/wallet/trading/concierge/TradingConciergeForm.tsx:28-32` — effect keyed
  on `otcData` (a query-result object) only sets a primitive `country` string derived from it;
  didn't find a churn problem, though I did not trace whether the underlying query hook returns a
  stable `data` reference across refetches — low-confidence pass, not filed as a finding.
- `packages/suite/src/views/wallet/trading/redirect/TradingRedirect.tsx` and
  `trading/buy/TradingBuyDetail/TradingBuyDetailContent.tsx` — one-shot parse-and-redirect / trade-
  status-polling effects with narrow or intentionally-whole-but-low-frequency deps; no loop shape.
- `packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferProvider.tsx`
  — despite the name, this is a plain component, not a Context Provider; no inline `value={{...}}`.
- `packages/suite/src/views/wallet/tokens/common/TokensTable/TokensTable.tsx:60-62` — effect depends
  only on `dispatch`; fine.
- `packages/suite/src/views/wallet/send/Outputs/ReceiveAddressModal/UtxoReceiveAddressModal.tsx:32-44`
  — `addresses?.used ?? []` / `addresses?.unused?.slice(...) ?? []` fresh-fallback patterns are used
  only inside the `useMemo` body (deps are `[addresses, search]`), so the fallback doesn't defeat the
  memo. Correct usage despite matching the `?? []` grep signature.
- `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx:137-140`
  — `suiteSyncOutputLabels.find(...)` per row is the same missing-index shape already covered by the
  `suiteSyncOutputSelectors.ts:56` exclusion / `asymptotic-complexity/p3-03`'s `TransactionTarget.tsx`
  finding; a complexity/indexing defect, not a hooks one, so not re-filed here.
- `packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx`,
  `TransactionListActions/TransactionListActions.tsx`, `useFetchTransactions.ts` — read closely for
  the C9/C10 candidates in this file set. `TransactionList.tsx:75-79`'s anchor-fetch effect lists
  `account` in its deps but never reads it in the body (only `anchor`/`fetchedAll`/`fetchAll`, the
  latter itself keyed correctly on `accountKey`) — genuinely dead dependency, but because `fetchAll`
  internally no-ops once `fetchedAll` is true and the deps also include `fetchedAll`, this doesn't
  compound into a request loop; not filed given the low real-world impact after tracing it through.
  `TransactionListActions.tsx:44-69`'s `onSearch` callback also depends on whole `account` where only
  `account.key` is read, feeding a low-frequency effect (`transactionHistoryPrefill`, a one-shot
  deep-link value) — same "wider than necessary" shape as F-04-2/F-04-9 but lower value than either
  (rarely-set trigger value), not filed as its own entry.
- `packages/suite/src/views/wallet/transactions/Transactions.tsx`,
  `components/AccountOverviewBalance.tsx`, `TradeBox/TradeBox.tsx`,
  `TradeBox/hooks/useTradeBoxEarnOptions.ts` — no unstable deps or unmemoized list scans found;
  `useTradeBoxEarnOptions` delegates to `src/hooks/earn/*` (area 01's territory).
- `packages/suite/src/views/wallet/receive/Receive.tsx` — simple selector reads, no derived-list or
  effect logic at all.
- `packages/suite/src/views/wallet/details/CoinjoinSetup/SetupSlider/SliderInput.tsx:86-90` — the
  `// eslint-disable-line react-hooks/exhaustive-deps` omitting `inputValue` is justified, not a
  lying dependency array: `inputValue` tracks the user's own in-progress edits, and including it
  would make the effect fire on every keystroke and, worse, overwrite the user's local edit with the
  (now-stale) `value` prop mid-typing. Verified this is the "adjusting state from props, ignore local
  edits" pattern, not a suppressed bug.
- `packages/suite/src/views/wallet/details/CoinjoinSetup/AnonymityLevelSetup.tsx:89-138` — `labels`
  `useMemo(..., [])` is a genuinely static array; memo correctly never recomputes (could be hoisted
  to a module constant instead, but that's a stylistic nit, not a bug — not filed).
- `packages/suite/src/views/wallet/anonymize/*`, `labels/Bip329Labels.tsx`,
  `sign-verify/SignVerifyPage.tsx`, `details/index.tsx`, `details/RescanAccount.tsx`,
  `details/CoinjoinLogs.tsx`, `details/AccountNonce.tsx`, `details/CoinjoinSetup/{SkipRoundsSetup,MaxMiningFeeSetup,CoinjoinSetup,SetupSlider}.tsx`
  — none of these use `useEffect`/`useMemo`/`useCallback` at all; nothing to check.
- `packages/suite/src/views/wallet/send/TotalSent/CardanoSentTokenInfo.tsx:18-35` — `useWatch({...,
defaultValue: [] })` plus a redundant `formOutputs ?? []` inside the memo body; low-confidence,
  narrow-impact edge case (only matters if `outputs` is ever actually `undefined`, which is unlikely
  given the form always registers it) — noted but not filed as a formal finding.
- No inline Context `Provider value={{...}}` literals found anywhere under this area (`grep -rn
"\.Provider value={{"` returned nothing) — class 5 does not apply to any file in this tree.
- No `useSelector(state => ...)` call in this area returns an inline `.filter()`/`.map()`/
  `Object.values()`/spread result directly (checked via targeted grep); the derived-selector-storm
  shape (class 3) appears to be absorbed by memoized selectors imported from `suite-common` and
  `suite-common/wallet-core` throughout this tree.
