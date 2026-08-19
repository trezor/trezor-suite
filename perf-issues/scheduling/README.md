# perf-issues/scheduling — one document per proposed GitHub issue

Issue-ready write-ups from the repo-wide sweep against
[`skills/performance-scheduling/SKILL.md`](../../skills/performance-scheduling/SKILL.md).

Each file is the **body of one future issue** on `trezor/trezor-suite`, following the structure of
[#31137](https://github.com/trezor/trezor-suite/issues/31137): a lead paragraph naming the skill
section, then `## Where`, `## Before`, `## After`, `## Why it matters`, `## Notes`, and a
verification footer.

- **Nothing here is filed yet.** These are drafts for review.
- **Suggested labels**, matching #31137: `perf`, `no-QA`.
- **Parent:** all of these belong under [#28886](https://github.com/trezor/trezor-suite/issues/28886).
- **Base commit:** `develop` @ `77d47ea064`. Every `file:line` was valid at that commit.
- **Raw scan output** lives in [`_scan/`](_scan/) — ten area files, 43 raw findings, which triage
  merged into the 34 documents below. Keep them: they carry the "what I checked and why it was
  clean" notes that never make it into an issue.

## Before filing, read this

**No number in these documents is a measurement.** The sweep verified locations, code and
scheduling behaviour by reading, but nothing was profiled. The 50 ms long-task threshold is the
spec's, not an observation about any of these call sites. Do not carry a figure into an issue as if
someone had traced it.

**The `After` hunks have not been compiled.** They are written against the surrounding types by
reading, not by running `tsc`.

**This repo has no scheduling primitives yet.** There are zero call sites of `requestIdleCallback`,
`cancelIdleCallback`, `scheduler.yield`, `yieldToMain`, `scheduler-polyfill` and
`InteractionManager` in product code, and `startTransition` / `useDeferredValue` appear only in
`packages/analytics-docs` (a standalone docs app). So the first of these issues to land also
decides the shared helpers:

| Helper                         | Needed by                 | Note                                                                                                                                      |
| ------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `yieldToMain()`                | every `long-task` doc     | `scheduler.yield()` with a `setTimeout(resolve, 0)` fallback — Safari has none, `suite-desktop` is Chromium and always has the real thing |
| `runWhenIdle(fn, { timeout })` | every `non-essential` doc | `requestIdleCallback` + `setTimeout` fallback; **always** pass `timeout`                                                                  |
| —                              | native docs               | RN has neither API — **and `InteractionManager` is a deprecated stub here, see below**                                                    |

Filing `p1-01` or `p1-07` first is the cheapest way to establish both helpers.

**Proposed home, so every document agrees:** `packages/utils/src/yieldToMain.ts` and
`packages/utils/src/runWhenIdle.ts`, exported from `@trezor/utils` — that package is already
one-function-per-file with `export * from './name'` in `index.ts` and a colocated `.test.ts`, and it
is the only utility package all four scopes may import. `scheduler-polyfill` is **not** currently a
dependency, so `yieldToMain` ships with a `setTimeout(resolve, 0)` fallback rather than pulling the
polyfill in. `runWhenIdle` degrades to `setTimeout` where `requestIdleCallback` is missing (Safari,
React Native); **native code should not use it** — the RN lever is
`InteractionManager.runAfterInteractions`, and the native documents say so individually.

## The skill needs one correction

`skills/performance-scheduling/SKILL.md` names `InteractionManager.runAfterInteractions` as React
Native's nearest equivalent to `requestIdleCallback`. That is not true on this repo's React Native.
Verified at HEAD: `node_modules/react-native/Libraries/Interaction/InteractionManager.js` exports
`InteractionManagerStub` — every member `@deprecated`, `runAfterInteractions` is a bare
`setImmediate` returning `{ then, cancel }`, `createInteractionHandle()` returns `-1`,
`clearInteractionHandle` only asserts, and `setDeadline` is `// Do nothing.`. It does **not** wait
for interactions or animations to finish. (Installed 0.86.0; `suite-native/app/package.json:145`
pins `0.85.3`.)

Consequences for the native documents (`p1-10`, `p1-11`, `p1-16`, `p1-17`, `p2-13`, `p2-14`, and the
native rows of `p3-01`): the real levers on suite-native are **re-ordering work off the gating
path**, `startTransition` / `useDeferredValue` for renders, and `setImmediate` / `setTimeout(0)` to
break a task — noting both append to the back of the queue, since Hermes has no `scheduler.yield`.
Where a document still proposes `runAfterInteractions` it says that it resolves to `setImmediate`
today and claims no animation-awareness. **This should be fixed in the skill**, independently of
whether any of these issues is filed.

## Verification status

All 34 documents are written. Automated check over the finished set:

- **1,136 cited `file:line` anchors across 328 distinct source files — 0 broken.** Every anchor
  resolves to a file that exists at a line that exists, at `77d47ea064`.
- Every document carries the required sections and the verification footer. `p3-01` uses inline
  `**Where.** / **Before** / **After**` per item instead of `##` headings, matching the batched
  `p3-*` convention of the sibling set.
- The only millisecond figures in the set are the long-task spec's 50 ms, the nested-timeout 5 ms
  clamp, Node's 1 ms timer floor, chosen `throttle`/`timeout` values, and one explicitly-labelled
  piece of arithmetic (`p1-15`: "arithmetic from the spec, not a measurement"). No document reports
  a measurement, because nothing was profiled.

## Two corrections this sweep owes back to `SKILL.md`

The sweep found that the skill is wrong on two points. Both are worth fixing in
`skills/performance-scheduling/SKILL.md` regardless of whether any issue here is ever filed.

1. **`InteractionManager` is a deprecated stub, not React Native's idle scheduler.** The skill calls
   `InteractionManager.runAfterInteractions` RN's "nearest equivalent" to `requestIdleCallback`. On
   the pinned `react-native@0.85.3` (`suite-native/app/package.json:145`), the installed module
   exports `InteractionManagerStub`: every member is `@deprecated`, `runAfterInteractions` is a bare
   `setImmediate` with a `cancel()`, `createInteractionHandle()` returns `-1`, and `setDeadline()` is
   literally `// Do nothing.`. It defers by one tick with **no** interaction or frame awareness.
   Verified by reading `node_modules/react-native/Libraries/Interaction/InteractionManager.js`.
   Consequence: the native documents here use re-ordering, `setImmediate`/`setTimeout(0)` yields and
   `useDeferredValue` instead — see `p1-17`, which had to abandon the raw finding's proposed fix.
2. **The skill's own idle-callback example is a call site the repo deliberately does not follow.**
   `SKILL.md:51` quotes `Preloader.tsx:70` as its `bad` example — with the three-line comment above
   it stripped. That comment says analytics must resolve before anything is shown, because of the
   consent screen and the THP autoconnect flow. `p3-01` item 1 works this through and recommends **no
   change to `Preloader.tsx`**, and proposes the metadata fetch at `initAction.ts:123` (`p2-01`) as a
   genuine replacement example for the skill.

## Scope

Out of scope by construction, because a sibling skill already owns it and the drafts already exist:
complexity (`Map`/`Set`/accumulator — see [`../asymptotic-complexity`](../asymptotic-complexity)),
memoization and dependency arrays, and forced layout. Everything under
[#28886](https://github.com/trezor/trezor-suite/issues/28886) is excluded — see
[`PROGRESS.md`](PROGRESS.md) for the full issue-number list.

## P1 — blocks the user on a hot path (17)

| Document                                                                           | Title                                                                                    | Anchors                                                | Class                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------- |
| [`p1-01`](p1-01-initaction-awaits-definitions-and-rates-before-routerinit.md)      | `initAction` awaits definitions and rates before `routerInit()`                          | `initAction.ts:98`                                     | startup-serialisation |
| [`p1-02`](p1-02-initblockchainthunk-awaits-a-handshake-to-every-coin-backend.md)   | `initBlockchainThunk` awaits a handshake to every coin backend, and fee info             | `blockchainThunks.ts:148`, `:127`                      | startup-serialisation |
| [`p1-03`](p1-03-updatemissingtxfiatrates-scans-every-persisted-transaction.md)     | `updateMissingTxFiatRatesThunk` scans every persisted transaction in one task            | `fiatRatesThunks.ts:333`                               | long-task             |
| [`p1-04`](p1-04-preloadstore-loads-the-whole-transaction-history-before-render.md) | `preloadStore` loads the whole persisted transaction history before first render         | `preloadStore.ts:75`                                   | startup-serialisation |
| [`p1-05`](p1-05-rootreducer-hydrates-the-whole-idb-snapshot-in-one-task.md)        | `rootReducer` hydrates the whole IndexedDB snapshot in one synchronous task              | `store.ts:191`                                         | long-task             |
| [`p1-06`](p1-06-maindesktop-init-awaits-bluetooth-and-serialises-preload.md)       | `MainDesktop.init` awaits Bluetooth init and serialises preload with the handshake       | `MainDesktop.tsx:128`, `:67`                           | non-essential         |
| [`p1-07`](p1-07-discovery-drains-the-accountqueue-in-one-task.md)                  | Discovery drains `accountQueue` in one task (**named in the skill**)                     | `discoveryThunks.ts:468`                               | long-task             |
| [`p1-08`](p1-08-discovery-completion-fires-analytics-synchronously.md)             | Discovery completion fires per-account analytics and four whole-list scans synchronously | `discoveryThunks.ts:284`, `analyticsMiddleware.ts:186` | non-essential         |
| [`p1-09`](p1-09-connect-holds-device-discovery-behind-firmware-releases.md)        | connect holds device discovery behind the remote firmware-releases fetch                 | `connect/src/core/index.ts:982`                        | startup-serialisation |
| [`p1-10`](p1-10-native-gates-first-render-on-the-connect-init-chain.md)            | suite-native gates `setIsAppReady` on the Connect chain and inits non-essentials first   | `appInitThunks.ts:131`, `:124`                         | startup-serialisation |
| [`p1-11`](p1-11-mmkv-persist-rewrites-the-whole-wallet-per-state-change.md)        | MMKV persist re-transforms and double-stringifies the whole wallet per state change      | `typedPersistReducer.ts:31`                            | long-task             |
| [`p1-12`](p1-12-token-search-rebuilds-the-unvirtualised-table-per-keystroke.md)    | Token search rebuilds the un-virtualised token table on every keystroke                  | `TokensNavigation.tsx:185`                             | render-as-long-task   |
| [`p1-13`](p1-13-accounts-sidebar-filters-urgently-on-every-keystroke.md)           | Accounts sidebar filters urgently on every keystroke                                     | `AccountsList.tsx:93`                                  | render-as-long-task   |
| [`p1-14`](p1-14-transaction-export-freezes-the-wallet.md)                          | Transaction export freezes the wallet for the length of the history                      | `exportTransactionsUtils.ts:152`                       | long-task             |
| [`p1-15`](p1-15-signtransaction-parses-every-referenced-tx-in-one-task.md)         | `signTransaction` parses every referenced transaction in one task                        | `signTransaction.ts:293`                               | long-task             |
| [`p1-16`](p1-16-balance-history-reduction-holds-the-rn-js-thread.md)               | Balance-history reduction holds the RN JS thread for the whole account history           | `graphDataFetching.ts:180`                             | long-task             |
| [`p1-17`](p1-17-native-graph-refetch-competes-with-the-navigation-transition.md)   | Native graph refetch competes with the navigation transition                             | `suite-native/graph/src/hooks.ts:79`                   | non-essential         |

## P2 — real, colder path (16)

| Document                                                                          | Title                                                                              | Anchors                             | Class                 |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------- | --------------------- |
| [`p2-01`](p2-01-metadata-fetch-for-all-devices-races-first-paint.md)              | `fetchAndSaveMetadataForAllDevices` races first paint                              | `initAction.ts:123`                 | non-essential         |
| [`p2-02`](p2-02-coinjoin-scanaccount-block-filter-loop-never-yields.md)           | Coinjoin `scanAccount` block-filter loop never yields                              | `scanAccount.ts:49`                 | long-task             |
| [`p2-03`](p2-03-coinjoin-mempool-controller-init-never-yields.md)                 | `CoinjoinMempoolController.init` never yields between filter matches               | `CoinjoinMempoolController.ts:146`  | long-task             |
| [`p2-04`](p2-04-getanonymityscores-derives-a-script-per-transaction.md)           | `getAnonymityScores` derives a script per transaction on the Electron main process | `analyzeTransactions.ts:69`         | long-task             |
| [`p2-05`](p2-05-coin-control-rescans-the-utxo-set-per-keystroke.md)               | Coin control re-scans `account.utxo` on every keystroke                            | `UtxoSearch.tsx:37`                 | render-as-long-task   |
| [`p2-06`](p2-06-transactionsummary-aggregates-in-the-render-body.md)              | `TransactionSummary` aggregates balance history in the render body                 | `TransactionSummary.tsx:48`         | render-as-long-task   |
| [`p2-07`](p2-07-preparegraphdataasync-is-a-settimeout-zero-poor-mans-worker.md)   | `prepareGraphDataAsync` is a `setTimeout(…, 0)` poor man's worker                  | `utilsWorker.ts:143`                | timeout-misuse        |
| [`p2-08`](p2-08-token-definitions-retry-timer-has-no-backoff.md)                  | Token-definitions retry timer has no backoff and ticks on the main thread          | `tokenDefinitionsThunks.ts:102`     | non-essential         |
| [`p2-09`](p2-09-commondb-additems-clones-every-record-in-one-task.md)             | `CommonDB.addItems` structured-clones every record in one task                     | `suite-storage/src/index.ts:166`    | long-task             |
| [`p2-10`](p2-10-commondb-getitemswithkeys-walks-a-cursor-per-record.md)           | `CommonDB.getItemsWithKeys` walks a cursor; eight are awaited before render        | `suite-storage/src/index.ts:306`    | timeout-misuse        |
| [`p2-11`](p2-11-updateall-rewrites-every-record-even-when-unchanged.md)           | `updateAll` rewrites every record even when the migration changed nothing          | `migrations/utils.ts:25`            | startup-serialisation |
| [`p2-12`](p2-12-coinselect-branch-and-bound-is-unbounded-per-fee-level.md)        | Coinselect branch-and-bound is unbounded per fee level                             | `branchAndBound.ts:58`              | long-task             |
| [`p2-13`](p2-13-native-transactionlist-rebuild-lands-with-the-load-more-press.md) | Native `TransactionList` model rebuild lands with the load-more press              | `TransactionList.tsx:210`           | render-as-long-task   |
| [`p2-14`](p2-14-native-searchform-debounce-should-be-usedeferredvalue.md)         | Native `SearchForm`'s 200 ms debounce should be `useDeferredValue`                 | `SearchForm.tsx:35`                 | render-as-long-task   |
| [`p2-15`](p2-15-electron-awaits-background-modules-before-the-window.md)          | Electron awaits background-module load before creating the window                  | `suite-desktop-core/src/app.ts:201` | startup-serialisation |
| [`p2-16`](p2-16-connect-ws-reruns-process-discovery-per-core-call.md)             | `connect-ws` re-runs process discovery and icon extraction per core call           | `connect-ws.ts:142`                 | startup-serialisation |

## P3 — batched cleanups (1)

| Document                                | Title                  | Anchors                                                                                                                                        |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [`p3-01`](p3-01-scheduling-cleanups.md) | P3 scheduling cleanups | `Preloader.tsx:70` (**named in the skill**), `useAllTradesReloadTimer.ts:38`, `InactiveTokensTab.tsx:62`, `useGuideSearch.ts:66`, `info.ts:63` |

## Merges applied during triage

Two scanners independently found the same defect in three places; those are merged, and the
independent confirmation is itself worth noting when the issue goes up.

| Document                                                                         | Merged raw findings               | Why                                                         |
| -------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| [`p1-02`](p1-02-initblockchainthunk-awaits-a-handshake-to-every-coin-backend.md) | F1.2 + F2.5                       | two awaits in the same `initBlockchainThunk` chain — one PR |
| [`p1-03`](p1-03-updatemissingtxfiatrates-scans-every-persisted-transaction.md)   | F1.3 + F2.1                       | **found twice independently** (areas 1 and 2)               |
| [`p1-06`](p1-06-maindesktop-init-awaits-bluetooth-and-serialises-preload.md)     | F1.5 + F1.6                       | both in `MainDesktop.init`                                  |
| [`p1-08`](p1-08-discovery-completion-fires-analytics-synchronously.md)           | F2.2 + F2.4                       | same trigger (discovery completion), same fix               |
| [`p1-10`](p1-10-native-gates-first-render-on-the-connect-init-chain.md)          | F3.1 + F3.2                       | both in `applicationInit`                                   |
| [`p3-01`](p3-01-scheduling-cleanups.md)                                          | F1.8 + F3.4 + F3.5 + F6.2 + F10.2 | bounded `n` or cosmetic; not worth an issue each            |

`p1-04` and `p1-05` are the two halves of the same boot bottleneck (IDB read, then hydration) but
have different fixes in different files, so they stay separate and cross-reference each other.
