# perf-issues/react-hooks — one document per proposed GitHub issue

Issue-ready write-ups from the repo-wide sweep against
[`skills/performance-react-hooks/SKILL.md`](../../skills/performance-react-hooks/SKILL.md).

Each file is the **body of one future issue** on `trezor/trezor-suite`, following the structure of
[#31137](https://github.com/trezor/trezor-suite/issues/31137): a lead paragraph naming the skill
section, then `## Where`, `## Before`, `## After`, `## Why it matters`, `## Notes`, and a
verification footer. The four `p3-*` batch documents keep the same top-level flow but nest
per-finding `###` subsections (one issue, one PR each).

- **Nothing here is filed yet.** These are drafts for review.
- **Suggested labels**, matching #31137: `perf`, `no-QA`. **Parent:**
  [#31374](https://github.com/trezor/trezor-suite/issues/31374) (Memoization, loops and reference
  stability) under [#28886](https://github.com/trezor/trezor-suite/issues/28886).
- **Base commit:** branch `issues/perf-react-hooks` @ `9e0d5b6a45`. All 370 cited `file:line`
  anchors were mechanically re-verified against that tree: 0 broken.
- **Raw scan output** lives in [`_scan/`](_scan/) — ten area files, 81 raw findings, merged into
  the 43 documents below (`_scan/_docmap.tsv` maps documents ← findings). The scan files also
  carry per-area "Checked, clean" lists — negative space that saves the next sweep from re-reading.

## Before filing, read this

**No number in these documents is a measurement.** The sweep verified locations, code and hook
semantics by reading — every writer re-read the cited source before writing — but nothing was
profiled. Trigger cadences ("every render", "every store dispatch", "every fiat tick") are
mechanism statements, not timings.

**The `After` hunks have not been compiled.** They are written against the surrounding types by
reading, not by running `tsc`.

**Read each document's Notes before filing.** Several writers overrode their scan input on
evidence, and those corrections are the most load-bearing content in the set:

- `p2-12` — the naive dep-narrowing has a real staleness tradeoff (`buildTokenOptions` embeds the
  whole `account` by reference; `AccountAmount` reads `account.balance` off it).
- `p2-06` — the scan's callback-ref fix doesn't type-check (`Column`'s ref prop is
  `RefObject`-only); the doc proposes a restructure instead.
- `p2-04` — the Provider memo only holds if `useBluetoothConnection`'s handlers get `useCallback`
  first (same-PR prerequisite).
- `p3-01` — dropped one scanned finding (`TransactionRenderer`) because
  [`../asymptotic-complexity/p2-16`](../asymptotic-complexity/p2-16-transactionrendererx-transactionrenderer.md)'s
  keyed-selector fix already subsumes it, and fixed only the safe half of the earn-form memo family
  (narrowing the `state` memo would freeze `state.account`).
- `p2-22` — corrected the scan's proposed dep (`account.symbol`, not `account.key` — the effect
  body reads `.symbol`).

**App split matters.** Web/desktop (`packages/suite`, `suite-common`, `packages/components`) is
NOT compiled by React Compiler — manual memoization is the mechanism. `suite-native` IS compiled —
native documents never add manual memoization; they fix the unstable reference at its source
(selector memoization, dep narrowing, derive-in-render). `p1-16`'s `useMemo` is the deliberate
exception: it _replaces_ `useState`+`useEffect`, removing state rather than adding memoization.

## Overlaps with already-filed issues and sibling drafts (checked, additive — not duplicates)

| Document         | Touches                                                         | Boundary                                                                                 |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `p1-05`, `p1-06` | [#31137](https://github.com/trezor/trezor-suite/issues/31137)   | #31137 is `setWidth`/layout-effect; these are the tooltip effect + interval-data rebuild |
| `p1-10`          | `../asymptotic-complexity/p1-01`,`p1-09`; `../scheduling/p2-05` | those fix reducer/scan cost; this fixes the refetch trigger                              |
| `p1-12`          | `../asymptotic-complexity/p2-26`                                | p2-26 owns the `stakingAccounts` selector signature; this owns the unmemoized pipeline   |
| `p2-07`          | `../asymptotic-complexity/p2-17`                                | p2-17 passes the row's own accounts (n); this fixes the defeated memo chain              |
| `p2-13`          | `../asymptotic-complexity/p2-28`                                | p2-28 memoizes per account; this fixes the per-keystroke rerun                           |
| `p2-17`          | `../asymptotic-complexity/p2-11`                                | p2-11 is prefix sums; this is the caller-reset scroll debounce                           |
| `p2-14`          | `../scheduling/p1-12`                                           | p1-12 defers the rebuild; this stops the needless tab-count recompute                    |

Already filed and therefore **not** re-drafted here: `useAccounts.ts:9` destructuring defaults
([#31133](https://github.com/trezor/trezor-suite/issues/31133)), the fiat-rate re-render storm
([#28880](https://github.com/trezor/trezor-suite/issues/28880)), `TransactionsGraph` `setWidth`
([#31137](https://github.com/trezor/trezor-suite/issues/31137)).

## Filing order

1. **`p1-11` and `p1-07` first** — two smallest diffs with app-shell blast radius (Provider values).
2. **`p1-17`** — the native fee/allowance-compose family: five anchors, real `@trezor/connect`
   dispatches refiring on background account churn, with three in-repo correct siblings as the
   template. Then its web relatives **`p1-03`, `p1-04`, `p1-09`, `p1-10`, `p1-13`** (device/network
   calls keyed on whole objects).
3. **`p1-01`** — `useLayout`; biggest render-tree win, slightly larger refactor.
4. **`p1-05` + `p1-06` together** — same graph-hover path, one PR.
5. Rest of P1 (`p1-02`, `p1-08`, `p1-12`, `p1-14`, `p1-15`, `p1-16`), then P2 by user-visibility
   (`p2-15` and `p2-18` are keystroke-path; `p2-20`–`p2-22` are native), then the four P3 batches.

## P1 — hot path or unbounded blast radius (17)

| Document                                                                      | Title                                                                                                              | Anchors                                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| [`p1-01`](p1-01-uselayout-effect-keyed-on-inline-jsx-rerenders-app-shell.md)  | `useLayout` effect keyed on inline JSX re-renders the whole app chrome on every page render                        | `useLayout.tsx:8`                           |
| [`p1-02`](p1-02-useaccountsearch-provider-value-recreated-every-render.md)    | `useAccountSearch` context Provider recreates its value object every render                                        | `useAccountSearch.tsx:43`                   |
| [`p1-03`](p1-03-cancel-tx-compose-refires-on-account-churn.md)                | Cancel-tx compose (hook + modal) re-dispatches on every account/tx reference churn                                 | `useEthereumCancelTxCompose.ts:115` +modal  |
| [`p1-04`](p1-04-addtokenmodal-refetches-account-info-per-account-refresh.md)  | `AddTokenModal` re-fetches account info from the device on every account refresh                                   | `AddTokenModal.tsx:71`                      |
| [`p1-05`](p1-05-graphtooltipbase-effect-keyed-on-whole-props.md)              | `GraphTooltipBase` effect keyed on the whole recharts `props` fires on every mouse move                            | `GraphTooltipBase.tsx:132`                  |
| [`p1-06`](p1-06-transactionsgraph-rebuilds-interval-data-per-hover-render.md) | `TransactionsGraph` rebuilds its interval dataset on every hover-driven render                                     | `TransactionsGraph.tsx:85`                  |
| [`p1-07`](p1-07-suitelayout-scrollcontext-value-unmemoized.md)                | `SuiteLayout`'s `ScrollContext.Provider` value is fresh every render, fanning to every transaction row             | `SuiteLayout.tsx:113`                       |
| [`p1-08`](p1-08-feescontext-provider-hands-14-consumers-fresh-object.md)      | `FeesContext.Provider` hands 14 consumers a fresh object every render                                              | `CollapsibleFees.tsx:76`                    |
| [`p1-09`](p1-09-yield-pending-tx-poll-keys-on-whole-account.md)               | Yield pending-tx poll interval keys on the whole `account`; the Tron sibling is the correct template               | `useYieldPendingTransactionTracking.ts:232` |
| [`p1-10`](p1-10-coincontrol-refetches-utxo-transactions-on-account-churn.md)  | `CoinControl` re-fetches UTXO transaction history on every account reference change                                | `CoinControl.tsx:144`                       |
| [`p1-11`](p1-11-responsivecontext-provider-rerenders-app-shell.md)            | `ResponsiveContext` Provider value re-renders the entire app shell on sidebar drag / resize                        | `ResponsiveContext.tsx:68`                  |
| [`p1-12`](p1-12-assetsview-rebuilds-assetrow-props-every-render.md)           | `AssetsView` rebuilds every `AssetRow` prop per render, defeating the row memo; `AssetCoinLogo` recomputes per row | `AssetsView.tsx:92` +`AssetCoinLogo`        |
| [`p1-13`](p1-13-useapprovalstep-effect-can-double-fire-quote-refresh.md)      | `useApprovalStep`'s effect keyed on an unmemoized `tx` can double-fire quote refresh mid-trade                     | `useApprovalStep.ts:49`                     |
| [`p1-14`](p1-14-formatterprovider-memo-defeated-on-web.md)                    | `FormatterProvider`'s memo is defeated on web by an unmemoized config hook                                         | `useFormattersConfig.ts:7`                  |
| [`p1-15`](p1-15-table-context-value-rerenders-all-rows-on-scroll-edge.md)     | `Table` context value re-renders every row/cell on scroll-shadow boundary crossings                                | `Table.tsx:68`                              |
| [`p1-16`](p1-16-usetranslatedmessages-double-renders-app-at-cold-start.md)    | `useTranslatedMessages` double-renders the native app at cold start via needless state+effect                      | `useTranslatedMessages.ts:23`               |
| [`p1-17`](p1-17-native-fee-compose-effects-key-on-whole-account.md)           | Five native fee/allowance-compose effects key on the whole `account` and refire on background churn                | `useResolvedYieldFlowData.ts` +4            |

## P2 — real but colder (22)

| Document                                                                | Title                                                                                                   | Anchors                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [`p2-01`](p2-01-usetradingcomposetransaction-whole-device-dep.md)       | `useTradingComposeTransaction` keys its compose effect on the whole `device`                            | `useTradingComposeTransaction.ts:142`  |
| [`p2-02`](p2-02-usetotalfiatbalance-recomputes-unmemoized.md)           | `useTotalFiatBalance` recomputes the whole-account-list balance unmemoized every render                 | `useTotalFiatBalance.ts:8`             |
| [`p2-03`](p2-03-usecurrentref-read-inside-usememo-three-sites.md)       | `useCurrentRef` read inside `useMemo` at three sites — stale until an unrelated render                  | `useAccountWithTokensOptions.ts:57` +2 |
| [`p2-04`](p2-04-connectionglobalmodalcontext-value-unmemoized.md)       | `ConnectionGlobalModalContext` Provider value is unmemoized                                             | `ConnectionGlobalModalContext.tsx:176` |
| [`p2-05`](p2-05-suitebanners-filters-accounts-every-render.md)          | `SuiteBanners` filters the full account list on every render of an always-mounted component             | `SuiteBanners.tsx:119`                 |
| [`p2-06`](p2-06-accountname-exhaustive-deps-suppression.md)             | `AccountName`'s `exhaustive-deps` suppression hides a ref-staleness gap                                 | `AccountName.tsx:23`                   |
| [`p2-07`](p2-07-tokeniconset-memo-defeated-by-wrapper.md)               | `TokenIconSet`'s memo is correct but permanently defeated by its wrapper                                | `TokenIconSetWrapper.tsx:26`           |
| [`p2-08`](p2-08-accountsection-gettokens-per-sidebar-row.md)            | `AccountSection` runs `getTokens()` unmemoized for every sidebar row                                    | `AccountSection.tsx:34`                |
| [`p2-09`](p2-09-earn-staking-dashboard-filter-crosses-hook-boundary.md) | Staking dashboard `.filter()` crosses the hook boundary and defeats two downstream memos                | `useStakingTableData.ts:47`            |
| [`p2-10`](p2-10-transactionitem-createtargets-unmemoized.md)            | `TransactionItem` rebuilds `createTargets()` on every render                                            | `TransactionItem.tsx:86`               |
| [`p2-11`](p2-11-tokenselect-revalidation-keyed-on-whole-account.md)     | `TokenSelect` revalidation effect keyed on the whole `account`                                          | `TokenSelect.tsx:70`                   |
| [`p2-12`](p2-12-usebuildtokenoptions-keyed-on-whole-account.md)         | `useBuildTokenOptions` keys its token-list memo on the whole `account` (staleness tradeoff — see Notes) | `useBuildTokenOptions.tsx:68`          |
| [`p2-13`](p2-13-ethereumnonce-refilters-history-per-keystroke.md)       | `EthereumNonce` re-filters the account's transaction history on every keystroke                         | `EthereumNonce.tsx:90`                 |
| [`p2-14`](p2-14-tokensnavigation-tab-counts-per-render.md)              | `TokensNavigation` recomputes tab counts over the full token list per render                            | `TokensNavigation.tsx:126`             |
| [`p2-15`](p2-15-trading-forms-bare-watch-rerenders-per-keystroke.md)    | Five trading-form components call bare `watch()`, re-rendering on every field change                    | `TradingFormApproval.tsx:63` +4        |
| [`p2-16`](p2-16-pinstep-effect-keyed-on-whole-device.md)                | `PinStep` status effect keyed on the whole `device` object                                              | `PinStep.tsx:49`                       |
| [`p2-17`](p2-17-virtualizedlist-scroll-debounce-reset-by-caller.md)     | `VirtualizedList`'s scroll-end debounce is silently reset by its caller's unstable callback             | `VirtualizedList.tsx:126`              |
| [`p2-18`](p2-18-usenetworkselect-memos-defeated-per-keystroke.md)       | `useNetworkSelect`'s memos are defeated on every keystroke by inline selector props                     | `useNetworkSelect.ts:15`               |
| [`p2-19`](p2-19-menu-rebuilds-global-keydown-listeners.md)              | `Menu` rebuilds two global `document` keydown listeners on every render while open                      | `Menu.tsx:131`                         |
| [`p2-20`](p2-20-selectfilterknowntokens-unmemoized-native.md)           | `selectFilterKnownTokens` is unmemoized — native consumers re-render on every dispatch                  | `tokenDefinitionsSelectors.ts:44`      |
| [`p2-21`](p2-21-accountimportloading-stale-retry-closure.md)            | `AccountImportLoadingScreen`'s retry calls a stale closure                                              | `AccountImportLoadingScreen.tsx:56`    |
| [`p2-22`](p2-22-native-analytics-effects-whole-account-deps.md)         | Native analytics effects keyed on whole `account`/`transaction` over-fire on background churn           | `AccountDetailContentScreen.tsx:24` +1 |

## P3 — cleanups, batched by subsystem (4)

| Document                                                    | Findings | Scope                                                                                     |
| ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| [`p3-01`](p3-01-cleanups-suite-hooks-and-components.md)     | 10       | `packages/suite` hooks + suite/wallet components                                          |
| [`p3-02`](p3-02-cleanups-suite-views-and-support.md)        | 6        | `packages/suite` views (trading detail, tokens/nfts, onboarding, notifications) + support |
| [`p3-03`](p3-03-cleanups-suite-common-and-design-system.md) | 5        | `suite-common` hooks + `packages/components` compound Providers                           |
| [`p3-04`](p3-04-cleanups-suite-native.md)                   | 10       | `suite-native` shared libs + modules (one low-confidence item flagged verify-first)       |

## Merges (raw findings → documents)

`p1-03` ← F-01-3 + F-02-1 + F-02-15 · `p1-12` ← F-05-2 + F-05-3 · `p1-17` ← F-09-1…5 ·
`p2-03` ← F-02-6 + F-04-6 · `p2-07` ← F-03-2 + F-07-3 · `p2-22` ← F-10-3 + F-10-6 ·
dropped: F-02-14 (subsumed by `../asymptotic-complexity/p2-16` — reasoning in `p3-01`).
