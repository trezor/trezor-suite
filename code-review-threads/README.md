# Code-review threads — `@cermakjiri` as reviewer

Every inline code-review comment `@cermakjiri` left on **other people's** pull requests in `trezor/trezor-suite` between **2026-05-11** and **2026-08-11**, grouped into *review-thread-groups* and sorted by the topic each thread discusses.

## What a review-thread-group is

One entity per review thread the reviewer participated in. Each contains:

- the **PR** it lives on (number, title, author, state),
- the **file and line** the thread is anchored to,
- the **diff hunk** — the code actually under discussion,
- a **link to the discussion thread** on GitHub,
- a **permalink to that exact line of code** at the PR head commit,
- the **full conversation** — the reviewer’s comments and every reply.

## Numbers

| | |
| --- | --- |
| Review-thread-groups | **86** |
| Reviewer comments inside them | **98** |
| Distinct PRs | **31** |
| Distinct PR authors | **13** |
| Window | 2026-05-11 → 2026-08-11 |
| First / last comment | 2026-05-12 / 2026-08-10 |
| Topics | 14 |

## Topics

| # | Topic | Groups | |
| --- | --- | --- | --- |
| 01 | **[Acknowledgements & cross-references](by-topic/01-acknowledgements-and-pointers.md)** | 14 | Approvals, thanks, "nice catch" notes, and pointers to another thread — no actionable request. Kept for completeness. |
| 11 | **[TypeScript type safety](by-topic/11-typescript-type-safety.md)** | 12 | Type predicates, `satisfies`, narrowing account types via `AccountWithNetworkType`, avoiding casts, fixing types instead of working around them. |
| 14 | **[Readability & simplification](by-topic/14-readability-and-simplification.md)** | 11 | Extracting named helpers/variables, early returns over nesting, dropping redundant branches, naming, and reusing existing utils. |
| 03 | **[Data fetching — prefer TanStack Query](by-topic/03-data-fetching-tanstack-query.md)** | 7 | Replacing imperative effect/thunk-driven fetching with `useQuery`/`useMutation`, exposing `queryOptions` on shared hooks, and picking the narrowest query hook. |
| 05 | **[Performance & memoization](by-topic/05-performance-and-memoization.md)** | 7 | Redundant or missing `useMemo`, stable references that stop breaking memoization, and running independent async work concurrently. |
| 09 | **[Component structure & file layout](by-topic/09-component-structure-and-files.md)** | 7 | One React component per file, extracting sub-components, hooks in their own file next to the component, and package/folder structure (tree-like vs. linear). |
| 10 | **[Nullability & sentinel values](by-topic/10-nullability-and-sentinel-values.md)** | 6 | Avoiding `''`/`0` sentinel fallbacks, preferring explicit `undefined`, and narrowing null/undefined upstream so components get asserted types. |
| 12 | **[Code placement, package boundaries & reuse](by-topic/12-code-placement-and-reuse.md)** | 6 | Moving shared logic to `suite-common` so `suite-native` can reuse it, avoiding circular deps via nested exports, and where selectors/abstractions belong. |
| 07 | **[Error handling & developer experience](by-topic/07-error-handling-and-devx.md)** | 4 | Unhandled thunk rejections crashing components, validation that returns `null` instead of throwing, silently skipping instead of failing loudly. |
| 02 | **[CI, tooling & guardrails](by-topic/02-ci-tooling-and-guardrails.md)** | 3 | GitHub Actions workflow configuration and lint rules that prevent whole classes of regressions. |
| 06 | **[Runtime validation & parsing](by-topic/06-runtime-validation-and-parsing.md)** | 3 | Zod schemas for parsing `unknown` data instead of casting, and questioning validation constraints in low-level converters. |
| 08 | **[Single source of truth](by-topic/08-single-source-of-truth.md)** | 3 | Deriving behaviour from network config features and from the Earn yield worker API rather than duplicating constants in the client. |
| 04 | **[React hooks & effects](by-topic/04-react-hooks-and-effects.md)** | 2 | Refs vs. state, effect dependencies and stale closures (`useFreshRef` / `useCurrentRef`). |
| 13 | **[Comments & documentation](by-topic/13-comments-and-docs.md)** | 1 | Code comments that do not explain the whole rule they document. |
| 99 | [Review summary comments](by-topic/99-review-summary-comments.md) | 13 | Top-level review bodies — no file/line anchor. |

### Distribution

```
Acknowledgements & cross-references             14  ██████████████
TypeScript type safety                          12  ████████████
Readability & simplification                    11  ███████████
Data fetching — prefer TanStack Query            7  ███████
Performance & memoization                        7  ███████
Component structure & file layout                7  ███████
Nullability & sentinel values                    6  ██████
Code placement, package boundaries & reuse       6  ██████
Error handling & developer experience            4  ████
CI, tooling & guardrails                         3  ███
Runtime validation & parsing                     3  ███
Single source of truth                           3  ███
React hooks & effects                            2  ██
Comments & documentation                         1  █
```

## Index by pull request

| PR | Author | State | Groups | Title |
| --- | --- | --- | --- | --- |
| [#31076](https://github.com/trezor/trezor-suite/pull/31076) | `@izmy` | merged | 1 | fix(suite-native): polish standalone wrap/unwrap UI |
| [#31071](https://github.com/trezor/trezor-suite/pull/31071) | `@TomasBoda` | merged | 1 | fix(suite-native): communicate weth vault as eth |
| [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `@TomasBoda` | merged | 8 | Mobile - Asset Detail Screen Revamp |
| [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `@53gur0` | merged | 4 | fix(suite-desktop): double-check nonces origination |
| [#30797](https://github.com/trezor/trezor-suite/pull/30797) | `@53gur0` | merged | 1 | feat(suite-desktop): ensure auto-tracked wrapped native assets |
| [#30791](https://github.com/trezor/trezor-suite/pull/30791) | `@TomasBoda` | merged | 1 | Earn Yield - Add Rewards Tooltips |
| [#30255](https://github.com/trezor/trezor-suite/pull/30255) | `@53gur0` | merged | 1 | feat(suite-native): label wrap/unwrap transactions |
| [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `@vojtatranta` | open | 4 | WIP: 28878 playwright perf tracking |
| [#30091](https://github.com/trezor/trezor-suite/pull/30091) | `@MiroslavProchazka` | open | 2 | fix(workflows): adjust aws session duration for icon workflow |
| [#30028](https://github.com/trezor/trezor-suite/pull/30028) | `@tomasklim` | merged | 2 | Cardano staking updates |
| [#29947](https://github.com/trezor/trezor-suite/pull/29947) | `@peter-sanderson` | merged | 1 | fix(earn): reduce Yield.xyz declaration size |
| [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `@53gur0` | open | 7 | feat(suite-native): evm cancel  |
| [#29445](https://github.com/trezor/trezor-suite/pull/29445) | `@tomasklim` | merged | 2 | fix(suite): keep account graph data visible while refetching |
| [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `@53gur0` | merged | 6 | perf(suite-desktop): tanstack query improvements |
| [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `@TomasBoda` | merged | 3 | Tron - Earn dashboard + Staking limits |
| [#28948](https://github.com/trezor/trezor-suite/pull/28948) | `@53gur0` | merged | 3 | fix(suite-native): display aggregated amounts on tx list item |
| [#28908](https://github.com/trezor/trezor-suite/pull/28908) | `@matusbalascak` | merged | 1 | feat(suite): implement tron staking dashboard |
| [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `@53gur0` | merged | 4 | feat(wallet-core): improve nonce discovery for EVM |
| [#28797](https://github.com/trezor/trezor-suite/pull/28797) | `@mroz22` | closed | 1 | chore(validators): remove dead validator types |
| [#28761](https://github.com/trezor/trezor-suite/pull/28761) | `@OriginalEveres` | merged | 1 | refactor(suite): extract shared debug utilities |
| [#28414](https://github.com/trezor/trezor-suite/pull/28414) | `@marekrjpolak` | merged | 1 | Eth conversion utils |
| [#28374](https://github.com/trezor/trezor-suite/pull/28374) | `@matusbalascak` | merged | 1 | feat(suite): add Tron staking page basics |
| [#28234](https://github.com/trezor/trezor-suite/pull/28234) | `@matusbalascak` | merged | 2 | feat(suite): add transaction data editor to tron send form |
| [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `@matusbalascak` | merged | 4 | Yield speed up transaction support |
| [#27829](https://github.com/trezor/trezor-suite/pull/27829) | `@unknown` | unknown | 1 | (PR no longer accessible — deleted or hidden) |
| [#27725](https://github.com/trezor/trezor-suite/pull/27725) | `@izmy` | merged | 2 | fix(suite): handle Solana tx timeout in review modal |
| [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `@BrantalikP` | merged | 12 | feat(suite-native): yield deposit |
| [#27716](https://github.com/trezor/trezor-suite/pull/27716) | `@matusbalascak` | merged | 1 | Yield issues |
| [#27621](https://github.com/trezor/trezor-suite/pull/27621) | `@BrantalikP` | merged | 1 | fix(suite-native): fee selector balance error |
| [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `@matusbalascak` | merged | 6 | Self-composed `withdraw` / `redeem` calldata for stablecoin yield |
| [#27584](https://github.com/trezor/trezor-suite/pull/27584) | `@izmy` | merged | 1 | Control Earn actions through message-system feature flags |

## Index by PR author

| Author | Groups |
| --- | --- |
| `@53gur0` | 26 |
| `@matusbalascak` | 15 |
| `@BrantalikP` | 13 |
| `@TomasBoda` | 13 |
| `@izmy` | 4 |
| `@vojtatranta` | 4 |
| `@tomasklim` | 4 |
| `@MiroslavProchazka` | 2 |
| `@unknown` | 1 |
| `@marekrjpolak` | 1 |
| `@OriginalEveres` | 1 |
| `@mroz22` | 1 |
| `@peter-sanderson` | 1 |

## Full group → topic map

| Group | PR | File:line | Topic |
| --- | --- | --- | --- |
| G01 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:119` | TypeScript type safety |
| G02 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:118` | TypeScript type safety |
| G03 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:170` | Nullability & sentinel values |
| G04 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:205` | Acknowledgements & cross-references |
| G05 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/actions/wallet/stablecoin-yield/composeYieldWithdrawTransaction.ts:111` | Performance & memoization |
| G06 | [#27590](https://github.com/trezor/trezor-suite/pull/27590) | `packages/suite/src/actions/wallet/stablecoin-yield/composeYieldWithdrawTransaction.ts:87` | Acknowledgements & cross-references |
| G07 | [#27584](https://github.com/trezor/trezor-suite/pull/27584) | `packages/suite/src/components/earn/dashboard/yield/EarnYieldAccountOpportunity.tsx:44` | Single source of truth |
| G08 | [#27621](https://github.com/trezor/trezor-suite/pull/27621) | `suite-native/module-earn/src/hooks/useComposeEarnFees.ts:164` | Data fetching — prefer TanStack Query |
| G09 | [#27716](https://github.com/trezor/trezor-suite/pull/27716) | `suite-common/suite-constants/src/evm.ts:18` | Single source of truth |
| G10 | [#27725](https://github.com/trezor/trezor-suite/pull/27725) | `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModalBody.tsx:49` | React hooks & effects |
| G11 | [#27725](https://github.com/trezor/trezor-suite/pull/27725) | `packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModal.tsx:74` | Error handling & developer experience |
| G12 | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `packages/suite/src/views/wallet/trading/common/TradingForm/TradingApproveModal.tsx:96` | Readability & simplification |
| G13 | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `suite-common/calldata/src/calldata.ts:56` | Acknowledgements & cross-references |
| G14 | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `suite-common/wallet-core/src/accounts/accountsThunks.ts:166` | Readability & simplification |
| G15 | [#27901](https://github.com/trezor/trezor-suite/pull/27901) | `suite-common/wallet-utils/src/ethUtils.ts:91` | Acknowledgements & cross-references |
| G16 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `packages/suite/src/actions/wallet/stablecoin-yield/claimMerkleRewardsThunk.ts:7` | Code placement, package boundaries & reuse |
| G17 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `packages/suite/src/components/tx-simulation/earn-stablecoin/EarnYieldTxSimulationModal.tsx:24` | Acknowledgements & cross-references |
| G18 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-common/earn-stablecoin/src/signing/stablecoinYieldSigningUtils.ts:220` | Error handling & developer experience |
| G19 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-common/wallet-core/src/index.ts:65` | Code placement, package boundaries & reuse |
| G20 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/tx-simulation/package.json:28` | Component structure & file layout |
| G21 | [#27829](https://github.com/trezor/trezor-suite/pull/27829) | `suite-common/earn-staking-api/src/staking/hooks/useEthereumValidatorsQueue.ts:19` | Data fetching — prefer TanStack Query |
| G22 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/components/YieldPendingTransactionModal.tsx:129` | React hooks & effects |
| G23 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/components/YieldPendingTransactionModalConstants.ts:9` | Component structure & file layout |
| G24 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:49` | TypeScript type safety |
| G25 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/hooks/__tests__/useResolvedYieldFlowData.test.ts:27` | TypeScript type safety |
| G26 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/hooks/useYieldDepositReview.ts:34` | Readability & simplification |
| G27 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts:40` | Code placement, package boundaries & reuse |
| G28 | [#27718](https://github.com/trezor/trezor-suite/pull/27718) | `suite-native/module-earn/src/screens/YieldDepositReviewScreen.tsx:162` | Component structure & file layout |
| G29 | [#28234](https://github.com/trezor/trezor-suite/pull/28234) | `suite-common/wallet-core/src/send/tron/buildContract.ts:9` | Readability & simplification |
| G30 | [#28234](https://github.com/trezor/trezor-suite/pull/28234) | `suite-common/wallet-core/src/send/sendFormThunks.ts:84` | Acknowledgements & cross-references |
| G31 | [#28374](https://github.com/trezor/trezor-suite/pull/28374) | `packages/suite/src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal.tsx:28` | Code placement, package boundaries & reuse |
| G32 | [#28414](https://github.com/trezor/trezor-suite/pull/28414) | `suite-common/wallet-utils/src/ethConverter.ts:33` | Runtime validation & parsing |
| G33 | [#28761](https://github.com/trezor/trezor-suite/pull/28761) | `suite/settings/src/settingsSelectors.ts:30` | Code placement, package boundaries & reuse |
| G34 | [#28797](https://github.com/trezor/trezor-suite/pull/28797) | `suite-common/validators/src/types.ts:1` | TypeScript type safety |
| G35 | [#28908](https://github.com/trezor/trezor-suite/pull/28908) | `packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronResourcesCard/TronResourcesCard.tsx:15` | TypeScript type safety |
| G36 | [#28948](https://github.com/trezor/trezor-suite/pull/28948) | `suite-native/transactions/src/components/TransactionTarget.tsx:125` | Performance & memoization |
| G37 | [#28948](https://github.com/trezor/trezor-suite/pull/28948) | `suite-native/transactions/src/components/TransactionTarget.tsx:119` | Readability & simplification |
| G38 | [#28948](https://github.com/trezor/trezor-suite/pull/28948) | `suite-native/transactions/src/components/TransactionListItem.tsx:134` | Performance & memoization |
| G39 | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:68` | Acknowledgements & cross-references |
| G40 | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:439` | TypeScript type safety |
| G41 | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:82` | Runtime validation & parsing |
| G42 | [#28816](https://github.com/trezor/trezor-suite/pull/28816) | `suite-common/wallet-core/src/send/sendFormEthereumThunks.ts:75` | TypeScript type safety |
| G43 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts:73` | CI, tooling & guardrails |
| G44 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `packages/suite/src/components/earn/dashboard/yield/EarnYieldTable.tsx:63` | Performance & memoization |
| G45 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `suite-common/earn-stablecoin-api/src/hooks/useYieldOpportunity.ts:22` | Acknowledgements & cross-references |
| G46 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `suite-native/module-earn/src/hooks/useResolvedYieldFlowData.ts:239` | Acknowledgements & cross-references |
| G47 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `suite-native/module-earn/src/hooks/useStablecoinYieldListData.ts:47` | Acknowledgements & cross-references |
| G48 | [#29054](https://github.com/trezor/trezor-suite/pull/29054) | `suite-common/earn-stablecoin-api/src/hooks/useGetYieldOpportunities.ts:32` | Acknowledgements & cross-references |
| G49 | [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:52` | Single source of truth |
| G50 | [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `packages/suite/src/hooks/earn/useStakingYield.ts:46` | Performance & memoization |
| G51 | [#29031](https://github.com/trezor/trezor-suite/pull/29031) | `packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx:386` | Readability & simplification |
| G52 | [#30091](https://github.com/trezor/trezor-suite/pull/30091) | `.github/workflows/release-suite-coin-icons.yml:46` | CI, tooling & guardrails |
| G53 | [#30091](https://github.com/trezor/trezor-suite/pull/30091) | `.github/workflows/release-suite-coin-icons.yml:46` | CI, tooling & guardrails |
| G54 | [#29947](https://github.com/trezor/trezor-suite/pull/29947) | `suite-common/earn-stablecoin-api/src/services/yieldxyz.ts:50` | Code placement, package boundaries & reuse |
| G55 | [#30255](https://github.com/trezor/trezor-suite/pull/30255) | `suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:134` | Component structure & file layout |
| G56 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:66` | Data fetching — prefer TanStack Query |
| G57 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-common/wallet-core/src/send/composeCancelTransaction/composeEthereumCancelTransactionThunk.ts:100` | TypeScript type safety |
| G58 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-common/wallet-core/src/send/useEvmNonceInfo.ts:95` | Data fetching — prefer TanStack Query |
| G59 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-native/module-transactions/src/hooks/useCancelEvmTransaction.ts:67` | Runtime validation & parsing |
| G60 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-native/module-transactions/src/hooks/useDeviceGuardedSign.ts:74` | Data fetching — prefer TanStack Query |
| G61 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-native/module-transactions/src/components/CancelEvmTransactionButton.tsx:46` | Component structure & file layout |
| G62 | [#29622](https://github.com/trezor/trezor-suite/pull/29622) | `suite-native/module-transactions/src/redux.d.ts:11` | TypeScript type safety |
| G63 | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `packages/suite/src/support/suite/Main.tsx:39` | Component structure & file layout |
| G64 | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `suite/e2e/performance/perfMeasure.ts:53` | Error handling & developer experience |
| G65 | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `packages/perf-e2e/src/instrumentation.ts:69` | Error handling & developer experience |
| G66 | [#30154](https://github.com/trezor/trezor-suite/pull/30154) | `packages/perf-e2e/src/instrumentation.ts:91` | Acknowledgements & cross-references |
| G67 | [#30791](https://github.com/trezor/trezor-suite/pull/30791) | `packages/suite/src/components/earn/dashboard/yield/hooks/useYieldClaimRewardsData.ts:85` | Performance & memoization |
| G68 | [#30028](https://github.com/trezor/trezor-suite/pull/30028) | `suite-common/wallet-utils/src/cardanoStakingUtils.ts:111` | Readability & simplification |
| G69 | [#30028](https://github.com/trezor/trezor-suite/pull/30028) | `packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:421` | Readability & simplification |
| G70 | [#30797](https://github.com/trezor/trezor-suite/pull/30797) | `packages/suite/src/actions/wallet/wrapNativeTokenThunks.ts:93` | Comments & documentation |
| G71 | [#29445](https://github.com/trezor/trezor-suite/pull/29445) | `packages/suite/src/actions/wallet/graphActions.ts:105` | Acknowledgements & cross-references |
| G72 | [#29445](https://github.com/trezor/trezor-suite/pull/29445) | `packages/suite/src/actions/wallet/graphActions.ts:171` | Data fetching — prefer TanStack Query |
| G73 | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `suite-common/wallet-utils/src/transactionUtils.ts:182` | Readability & simplification |
| G74 | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumNonce.tsx:90` | Performance & memoization |
| G75 | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `suite-common/wallet-utils/src/transactionUtils.ts:80` | Readability & simplification |
| G76 | [#30910](https://github.com/trezor/trezor-suite/pull/30910) | `suite-common/wallet-utils/src/transactionUtils.ts:93` | TypeScript type safety |
| G77 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-earn/src/hooks/useYieldBadge.tsx:41` | Nullability & sentinel values |
| G78 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-earn/src/hooks/useYieldBadge.tsx:45` | Nullability & sentinel values |
| G79 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:30` | Readability & simplification |
| G80 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:103` | Component structure & file layout |
| G81 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:113` | Nullability & sentinel values |
| G82 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:122` | Nullability & sentinel values |
| G83 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-earn/src/components/YieldBadge.tsx:52` | Data fetching — prefer TanStack Query |
| G84 | [#30994](https://github.com/trezor/trezor-suite/pull/30994) | `suite-native/module-accounts-management/src/components/YourPositionCard.tsx:52` | Nullability & sentinel values |
| G85 | [#31076](https://github.com/trezor/trezor-suite/pull/31076) | `suite-native/module-earn/src/components/YieldCompleteScreenPresets.tsx:166` | Acknowledgements & cross-references |
| G86 | [#31071](https://github.com/trezor/trezor-suite/pull/31071) | `suite-native/module-accounts-management/src/components/StablecoinYieldTokenOverview.tsx:262` | TypeScript type safety |

## Scope & method

- **Window** comments created between **2026-05-11** and **2026-08-11**.
- **Reviewer only.** PRs `@cermakjiri` authored are excluded — comments there are author replies, not review. That removed 33 comment(s) across 19 own PR(s).
- **Collection** a repo-wide REST sweep of `/pulls/comments?since=…` unioned with `gh search prs --reviewed-by` and `--commenter`, then every `reviewThreads` node fetched over GraphQL (paginated), keeping threads with at least one reviewer comment in the window.
- **Reconciliation** the REST sweep saw 94 reviewer comment(s) in the window. 94 are in this report; 0 could not be attached to a reachable PR. 4 further comment(s) appear here that REST cannot see (unsubmitted PENDING reviews).
- **Topics** 86 group(s) classified from `scripts/review-threads/overrides.json`, 0 by keyword heuristic, 0 unclassified.

### Caveats

- **Unsubmitted drafts.** 4 group(s) (G63, G64, G65, G66) belong to PENDING reviews that were never submitted — nobody else can see them. Worth submitting or discarding.
- **Inaccessible PRs.** 1 group(s) (G21) sit on PRs the API will not return, so PR title, author, and replies are unrecoverable. The comment body and diff hunk survived.
- Groups marked *outdated* are anchored to a diff that has since changed, so the "line of code" permalink points at the original diff position and may no longer match.
- Reactions-only participation (👍 on someone else's comment without writing one) is not captured — GitHub does not surface it as a comment.
- Topic assignment is keyword-heuristic unless pinned in `overrides.json`. Treat auto-tagged groups as a first pass.

## Regenerate

```bash
node scripts/review-threads/collect.mjs --since 2026-05-11 --until 2026-08-11
```

_Generated 2026-08-11 from the GitHub API (REST + GraphQL)._
