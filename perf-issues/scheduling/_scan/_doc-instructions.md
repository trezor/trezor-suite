# Per-document instructions for the remaining scheduling documents

Read [`_writer-brief.md`](_writer-brief.md) first — it carries the skill summary, repo ground truth,
document structure and the honesty rules. This file adds only what is specific to each document.

Every entry gives: the output filename, the raw finding id(s) and the `_scan/` file they live in.

---

## p1-12 — `p1-12-token-search-rebuilds-the-unvirtualised-table-per-keystroke.md`

Raw: F5.1 in `05-render.md`

Read `packages/suite/src/views/wallet/tokens/TokensNavigation.tsx`, `views/wallet/tokens/index.tsx`,
`coins/CoinsTable.tsx` and `common/TokensTable/TokensTable.tsx`. The claim: the search query is
urgent state, and the token table it drives is not virtualised, so every keystroke commits a full
re-render of every row. Establish how many rows there really are (an account's token list — what
bounds it? some EVM accounts hold hundreds), and confirm the table is genuinely un-virtualised by
reading the render path, not by assuming.

The lever is `useDeferredValue` on the query, NOT a chunked loop. Be precise about the split: the
controlled `<input value>` must stay urgent so typing never lags; only the derived filtered list is
deferred. Show both halves in the `After`. Note whether a `useMemo` already sits between the query
and the rows — if so, the memo is not the fix and does not make the render cheap; say why.

## p1-13 — `p1-13-accounts-sidebar-filters-urgently-on-every-keystroke.md`

Raw: F5.3 in `05-render.md`

Read `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx`,
`AccountSearchBox.tsx` and `AccountSection.tsx`. Same lever as p1-12 (`useDeferredValue`), different
tree: this one is the always-mounted sidebar, so it re-renders on a surface the user sees on every
wallet screen. Establish what `n` is — accounts across all enabled networks for the selected device,
plus tokens rendered per account row — and whether the list is virtualised.

Check whether a debounce already exists. If it does, the honest document argues `useDeferredValue`
is better than the debounce (it is interruptible and has no fixed delay) rather than claiming the
defect is "no debouncing". Cross-reference p1-12 and p2-05 as the same lever at three call sites; a
reviewer may reasonably want one PR for all three.

## p1-14 — `p1-14-transaction-export-freezes-the-wallet.md`

Raw: F8.1 in `08-heavy-sync.md`

Read `packages/suite/src/utils/wallet/exportTransactionsUtils.ts` end to end — `prepareContent`,
`prepareCsv`, `preparePdf` — and find the UI call site that triggers the export. This is the
clearest long-task case in the set: the user clicks Export and the whole account history is
formatted in one synchronous pass, so the app is frozen for the length of the history with no
progress indication.

Establish what the per-transaction work actually is for each format (string building? a PDF
library's row API? date formatting per row?) and which format is worst. The `After` is chunk +
`yieldToMain`. Say what the user sees during the export today versus after — and be honest that
yielding alone does not make the export faster, it makes the app responsive while it runs, which is
a different (and arguably better) claim. If a progress indicator becomes possible as a result, note
it as a follow-up rather than folding it in.

## p1-15 — `p1-15-signtransaction-parses-every-referenced-tx-in-one-task.md`

Raw: F8.2 in `08-heavy-sync.md`

Read `packages/connect/src/api/signTransaction.ts` around the referenced-transaction handling, plus
`parseTransactionHexes` and `transformReferencedTransactions` wherever they live. The claim: every
input's previous transaction is deserialised from hex in one task.

Platform is the crux and must be stated per platform: connect's core runs **in-process** on every
platform — renderer main thread on suite-web, RN JS thread on suite-native, Electron main process on
suite-desktop (verify this by reading `packages/connect/package.json`'s `browser` entry and the
`CoreInModule` variants). `n` is the number of inputs, which for a consolidating BTC transaction is
large. The user is waiting on a device confirmation, so argue carefully about whether main-thread
responsiveness matters at that exact moment — if the UI is showing a modal and the user cannot act
anyway, the honest claim is smaller. Do not overstate it. Cross-reference p2-12.

## p2-05 — `p2-05-coin-control-rescans-the-utxo-set-per-keystroke.md`

Raw: F5.2 in `05-render.md`

Read `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSearch.tsx`,
`CoinControl.tsx` and `UtxoSelectionList/UtxoSelectionList.tsx`. Same `useDeferredValue` lever as
p1-12/p1-13. `n` is the account's UTXO count, which is unbounded for a heavily-used or coinjoined
account.

Important scope boundary: #31125 and #31126 are already filed against this same component for
**complexity** defects (an outpoint `Set`, a comparator rescan), and `p1-09` of the sibling
`asymptotic-complexity` draft set extends them. This document must be about **scheduling only** —
the keystroke commits an urgent render — and must say explicitly that it is orthogonal to and
stacks with those. Do not re-report their findings.

## p2-06 — `p2-06-transactionsummary-aggregates-in-the-render-body.md`

Raw: F5.4 in `05-render.md`

Read `packages/suite/src/views/wallet/transactions/components/TransactionSummary.tsx` and
`packages/suite/src/components/suite/graph/GraphRangeSelector.tsx`. The claim: changing the graph
range synchronously re-aggregates balance history in the render body.

Establish where the aggregation actually happens — in the component body, in a `useMemo`, or in a
selector — because that decides the fix. If it is in a `useMemo` keyed on the range, the memo does
not help when the range is what changed, and `startTransition` around the range setter is the lever
(the range control stays responsive, the chart catches up). Say which of `startTransition` and
`useDeferredValue` fits and why — for a control whose own value must update immediately,
`useDeferredValue` on the value passed downward is usually cleaner. Cross-reference p2-07, which is
the same graph pipeline's other half.

## p2-07 — `p2-07-preparegraphdataasync-is-a-settimeout-zero-poor-mans-worker.md`

Raw: F5.5 in `05-render.md`

Read `packages/suite/src/utils/wallet/graph/utilsWorker.ts` (especially around `:134` and `:143`)
and the call site in `packages/suite/src/views/dashboard/PortfolioCard/DashboardGraph.tsx`.

This is the most interesting document in the set because the code **already tried** to solve this
problem and picked the wrong primitive: it chunks with `setTimeout(…, 0)`. The skill names exactly
this — `setTimeout(0)` appends to the **back** of the queue rather than the front, and after five
nested timeouts the browser clamps each to a 5 ms floor, so a long chunked run accumulates 5 ms of
dead time per chunk. Work out how many chunks a realistic run produces and therefore how much clamp
time accrues; that arithmetic is the heart of the document (state it as arithmetic from the spec'd
5 ms floor, never as a measurement).

Two candidate fixes, and the document should recommend one: swap `setTimeout(0)` for `yieldToMain`
(minimal diff, keeps the existing structure, resumes at the front of the queue), or move the whole
thing into a real Web Worker (the file is named `utilsWorker.ts` but verify whether it actually runs
in a worker — if it does not, say so plainly, because the filename is then actively misleading).

## p2-12 — `p2-12-coinselect-branch-and-bound-is-unbounded-per-fee-level.md`

Raw: F8.3 in `08-heavy-sync.md`

Read `packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts` and the `composeTransaction` path
that calls it. The claim: the search is bounded only by a large iteration cap, and it runs once per
fee level, so a single compose can burn a very large number of iterations in one task.

Read the actual iteration cap in the source and state it exactly — do not guess the number. Verify
how many fee levels are tried. Be honest that the worst case may be rare (the search usually exits
early when it finds an exact match) and that the typical case is fast; the argument is about the
tail, and the document should say which inputs produce the tail. `n` here is the UTXO count.
This is `@trezor/utxo-lib`, a published package with an established test suite — note that the
fix must not change selection results, only when they are computed, and that the existing tests are
the guard. Cross-reference p1-15 (same in-process connect core, same signing flow).

## p1-16 — `p1-16-balance-history-reduction-holds-the-rn-js-thread.md`

Raw: F9.1 in `09-native-render.md`

Read `suite-common/graph/src/graphDataFetching.ts` around the per-transaction balance-history
reduction. `n` is the account's whole transaction history; the thread is the RN JS thread (Hermes,
no JIT, mid-range Android), and the user is looking at the portfolio graph.

Note the package is `suite-common`, so it is shared — check whether the web app hits the same code
path, and if it does, say the fix helps both but the native case is the one that hurts.
**Read the `InteractionManager` correction in the writer brief before proposing a native primitive.**
The yield primitive available on Hermes is `setImmediate`/`setTimeout(0)`; `scheduler.yield` does not
exist there, so `yieldToMain`'s fallback path is what native gets — say so. Cross-reference p1-17.

## p1-17 — `p1-17-native-graph-refetch-competes-with-the-navigation-transition.md`

Raw: F9.2 in `09-native-render.md`

Read `suite-native/graph/src/hooks.ts` around the refetch in `useGraphData`. The claim: the refetch
fires on mount and competes with the navigation transition animation.

**This document is directly affected by the `InteractionManager` correction in the writer brief** —
the raw finding proposed `InteractionManager.runAfterInteractions`, but on the pinned RN that is
`setImmediate` with no interaction awareness. Deferring by one tick does not protect a
multi-hundred-millisecond navigation animation. So either argue for a different mechanism (defer
until the navigation transition actually ends — React Navigation exposes transition events; check
what the app already uses) or be honest that the available primitive is weak and size the claim
accordingly. Do not propose a fix that the pinned RN cannot deliver. Cross-reference p1-16.

## p2-02 — `p2-02-coinjoin-scanaccount-block-filter-loop-never-yields.md`

Raw: F4.1 in `04-workers.md`

Read `packages/coinjoin/src/backend/scanAccount.ts` (`:49`, `:53`) and
`packages/coinjoin/src/backend/CoinjoinFilterController.ts` (`:95`, `:111`). Establish which thread
this runs on — coinjoin runs in the Electron **main** process on desktop; verify that rather than
assuming, and state what a blocked main process costs (every renderer IPC round trip waits).
`n` is the number of block filters scanned, which grows with the blockchain and with how far behind
the account is. Note that a first scan of a fresh account is the worst case.

Do not re-report the complexity findings already drafted for coinjoin in the sibling set — this is
about the loop never yielding, not about how the lookup inside it is indexed.

## p2-03 — `p2-03-coinjoin-mempool-controller-init-never-yields.md`

Raw: F4.2 in `04-workers.md`

Read `packages/coinjoin/src/backend/CoinjoinMempoolController.ts` (`:122`, `:141`, `:146`). Same
subsystem and thread as p2-02, different loop: the mempool filter matching at init. Establish what
`n` is (mempool size at the moment of init — unbounded and spiky, which is a good argument) and how
often `init` runs. Keep this document tight and cross-reference p2-02 rather than repeating its
thread argument in full.

## p2-04 — `p2-04-getanonymityscores-derives-a-script-per-transaction.md`

Raw: F4.3 in `04-workers.md`

Read `packages/coinjoin/src/client/analyzeTransactions.ts` (`:31`, `:69`). Per-transaction script
derivation is real CPU work (hashing/encoding), not just object churn — establish exactly what the
per-item cost is by reading the derivation it calls. Same Electron-main-process argument as p2-02.
`n` is the account's transaction history, which for a coinjoined account is large by construction —
that is the strongest version of this argument, since coinjoin accounts accumulate transactions far
faster than ordinary ones. Say so.

## p2-08 — `p2-08-token-definitions-retry-timer-has-no-backoff.md`

Raw: F6.1 in `06-nonessential.md`

Read `suite-common/token-definitions/src/tokenDefinitionsThunks.ts` around `:102`. Two defects in
one: a self-rescheduling `setTimeout` used as the scheduler (timeout-misuse) and no backoff, so a
persistently failing definition endpoint retries forever at a fixed interval on the main thread.

Establish the interval and what one tick costs (a fetch plus a parse per network per definition
type?). The fix has two parts: exponential backoff with a cap, and running the tick via
`runWhenIdle`. Be honest about which matters more — if the interval is already long, the backoff is
the real fix and the idle scheduling is a refinement; say that rather than inflating it. Note the
offline case explicitly, since that is when this misbehaves worst.

## p2-09 — `p2-09-commondb-additems-clones-every-record-in-one-task.md`

Raw: F7.2 in `07-storage.md`

Read `packages/suite-storage/src/index.ts` around `:166` (`CommonDB.addItems`). Each `put` into IDB
structured-clones its record synchronously on the main thread, so a bulk add of an account's whole
transaction history clones every record in one uninterruptible task. Establish the callers that pass
unbounded arrays. The fix is chunk + `yieldToMain` between batches inside one transaction — but
verify whether an IDB transaction stays alive across a yield: **an IDB transaction auto-commits when
the event loop goes idle**, so yielding mid-transaction can abort it. That is the crux of this
document. If the yield must therefore happen between transactions rather than inside one, say so and
write the `After` that way, and note the durability implication (a partial write becomes possible).
This is `@trezor/suite-storage`, a published package.

## p2-10 — `p2-10-commondb-getitemswithkeys-walks-a-cursor-per-record.md`

Raw: F7.3 in `07-storage.md`

Read `packages/suite-storage/src/index.ts` around `:306` (`CommonDB.getItemsWithKeys`). It walks a
cursor one record at a time, awaiting each `continue()`, when `getAllKeys()` + `getAll()` would
return everything in two round trips. The scanner notes eight of these are awaited before Suite can
render — verify that count by finding the callers, and if it is not eight, say the real number.

Frame this correctly: it is `await`-in-a-loop serialising work that should be batched — a scheduling
defect in the sense the skill's `timeout-misuse` class covers, not a complexity defect (the total
work is the same, the number of task boundaries is not). Be precise about that distinction, since a
reviewer will ask. Cross-reference p1-04, which is the boot-path consumer.

## p2-11 — `p2-11-updateall-rewrites-every-record-even-when-unchanged.md`

Raw: F7.4 in `07-storage.md`

Read `packages/suite/src/storage/migrations/utils.ts` around `:25` (`updateAll`) and a couple of the
migrations that use it. It writes back every record even when the migration changed nothing, and
migrations run before the app is usable — so a no-op migration still pays a full rewrite of the
store on the boot path.

The fix: let a migration return `undefined` to mean "unchanged" and skip the write. Read the actual
migration call sites to check how many would benefit and whether any rely on the unconditional
write. Consult `skills/idb-migrations/SKILL.md` — migrations are versioned and already-run
migrations must never change behaviour, so be careful that this is a change to the **helper's**
contract for future migrations, and say explicitly whether existing migrations may be retrofitted.

## p2-13 — `p2-13-native-transactionlist-rebuild-lands-with-the-load-more-press.md`

Raw: F9.3 in `09-native-render.md`

Read `suite-native/transactions/src/components/TransactionList.tsx` around `:210`. The claim: the
list model rebuild lands in the same task as the load-more press, so the press feels unresponsive.
Verify how paging is actually triggered — batch B established for a sibling document that it is a
footer **button press**, not `onEndReached` infinite scroll; confirm that here rather than assuming
either. `n` grows monotonically as the user pages.

Lever: `useDeferredValue` over the list model. Read the `InteractionManager` correction in the brief
before proposing any native scheduling primitive. Note the list component in use (FlashList or
FlatList) and whether it is virtualised — if it is, the row rendering is already bounded and the
cost is the model rebuild, which narrows and sharpens the claim.

## p2-14 — `p2-14-native-searchform-debounce-should-be-usedeferredvalue.md`

Raw: F9.4 in `09-native-render.md`

Read `suite-native/search/src/components/SearchForm.tsx` around `:35`. It has a 200 ms debounce over
a non-virtualised accounts list. The argument is not "there is no debounce" — there is one — but
that a fixed debounce is the wrong primitive: it delays every keystroke by 200 ms whether the device
needs it or not, and it is not interruptible, whereas `useDeferredValue` adapts to the device and
lets React abandon a stale render.

That makes this the most rejectable document in the set, so be scrupulous: on a slow Android device
a debounce may genuinely be doing useful work by cutting the number of renders outright. Give the
reviewer the honest trade-off in Notes and do not oversell. Confirm the list is really
un-virtualised.

## p2-15 — `p2-15-electron-awaits-background-modules-before-the-window.md`

Raw: F10.1 in `10-desktop-connect.md`

Read `packages/suite-desktop-core/src/app.ts` around `:201` and the module-loading machinery it
awaits. The claim: background modules are awaited before the Electron `BrowserWindow` is created, so
the user sees no window at all until they finish.

Establish which modules are loaded and whether any is a genuine prerequisite for the window (some
almost certainly are — anything registering a protocol handler, setting up the session, or
installing IPC handlers the renderer calls immediately). The strong version of this document splits
the module list into "must precede the window" and "can follow it" by reading each one, and proposes
the split rather than a blanket deferral. If that split cannot be made confidently from reading, say
so and mark the document as needing a maintainer's judgement — that is a legitimate outcome.

## p2-16 — `p2-16-connect-ws-reruns-process-discovery-per-core-call.md`

Raw: F10.3 in `10-desktop-connect.md`

Read `packages/suite-desktop-core/src/libs/connect-ws.ts` around `:142`. The claim: subprocess
process-discovery and icon extraction re-run inline on every connect-ws core call rather than being
cached. Establish what the discovery actually does (spawns a subprocess? reads the process table?
extracts an icon from a binary?) — that cost per call is the whole argument, and it is an Electron
main-process cost, so every renderer IPC waits behind it.

The fix here is probably caching rather than scheduling. Be honest about that: if the right fix is a
cache with invalidation, say so, and frame the scheduling angle as secondary. A document that
correctly identifies the wrong fix is worth more than one that forces the skill's primitive onto it.

## p3-01 — `p3-01-scheduling-cleanups.md`

Raw: F1.8, F3.4, F3.5, F6.2, F10.2 across `01-suite-startup.md`, `03-native.md`,
`06-nonessential.md`, `10-desktop-connect.md`

ONE document batching five small findings, following the `p3-*` convention of the sibling
`asymptotic-complexity` set: a short shared lead, then one `###` section per item with its own
Where / Before / After / why-it-is-P3. Keep each item tight — these are cleanups, not campaigns.

1. **`Preloader.tsx:70`** — `analyticsActions.init()` in a mount effect. This is the skill's own
   `bad` example, quoted verbatim in `SKILL.md`, so it must be here for completeness. But the
   scanner rated it "high on the facts, low on the value of the mechanical fix": read the comment
   above it, which says analytics must resolve before anything is shown because of the consent
   screen and the THP autoconnect flow. If that comment is right, the skill's own example is one the
   repo has a deliberate reason not to follow — say that plainly. That is a genuinely useful finding
   and should feed back into `SKILL.md`.
2. **`useAllTradesReloadTimer.ts:38`** (native) — sequential per-trade awaits; batch them.
3. **`InactiveTokensTab.tsx:62`** (native) — undebounced keystroke filter over Stellar coin
   definitions; `useDeferredValue`. Bounded `n`, hence P3.
4. **`useGuideSearch.ts:66`** — scans all guide articles in one task per keystroke. Read the actual
   article count from the guide index and state it; if it is genuinely fixed and small, this is P3
   precisely because `n` is bounded, and the document should say so rather than implying growth.
5. **`info.ts:63`** (desktop main) — a synchronous `execSync` computer-name lookup on the
   `TrezorConnect.init` path. `execSync` blocks the Electron main process on a process spawn; the
   fix is the async variant or a cached value. Small, clear, and worth doing.
