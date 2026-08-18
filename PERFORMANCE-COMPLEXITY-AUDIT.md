# Performance audit — asymptotic complexity

Repo-wide sweep against [`skills/performance-complexity/SKILL.md`](skills/performance-complexity/SKILL.md).

- **Base:** `develop` @ `c50ebc116d`. Working tree touches only `skills/` + `AGENTS.md`, so every `file:line` below is valid against `develop`.
- **Scope:** the three rules in the skill — (1) index by key before iterating, (2) keep sort comparators O(1), (3) don't spread the `reduce` accumulator — plus the same principle on non-array-method surfaces (nested `for`, array-as-queue, `Object.keys` in a loop, `JSON`/clone in a loop, recursion copying an accumulator).
- **Excluded:** everything already filed under [#28886](https://github.com/trezor/trezor-suite/issues/28886) and its 21 sub-issues. See [Already filed](#already-filed) for the exact anchors that were skipped. Sub-issue list re-checked at time of writing — nothing new had landed.
- **Status:** report only. No GitHub issues created, no code changed.
- **Result:** **106 verified findings** — 11 P1, 44 P2, 51 P3 — across two sweeps.

## Method

**Wave 1** — three multiline `rg` sweeps (nested scans, sort comparators, spread accumulators), every hit read in context and triaged by hand. Produced findings 5, 7, 8, 9, 10 below plus most of P2/P3.

**Wave 2** — an orchestrated deep sweep, because the skill itself warns that the costliest instances _"span two files, so no grep finds them"_, which no regex can reach:

- **15 hunters** — 12 by package scope (suite views, suite logic, wallet-core, wallet-utils, rest of suite-common, suite-native UI, suite-native logic, connect, blockchain-link + networks, coinjoin/utxo-lib/transport, components/utils/desktop, `suite/*`) and 3 by _modality_: cross-file list-row scans, non-array-method quadratics, and an exhaustive enumeration of every `.sort(`/`.reduce(` call site in the repo.
- **15 paired adversarial verifiers**, one per hunter, instructed to default to REJECTED, re-read the actual file at the actual line, and decide the deciding question — _is `n` really unbounded?_ — by tracing real call sites.
- **3 critic lenses** afterwards: unsearched areas, hot paths reached by reading rather than grepping, and _sibling_ defects (the same shape usually repeats in the parallel implementation for another coin or backend), each then re-verified.

35 agents, 5.5M tokens, 1741 tool calls, ~57 min. Of 94 candidates, **13 were rejected** by verification — see [Rejected by verification](#rejected-by-verification), which is worth reading: several were plausible-looking scans over collections that turn out to be curated/bounded.

**Conflict resolution.** Two anchors were confirmed by one verifier and rejected by another (`suite-native/accounts/src/selectors.ts:397`, `suite/metadata/src/metadataDataThunks.ts:44`). In both cases the _rejecting_ argument was stronger — the token list is pre-filtered through curated coin definitions so `n` is tens, and the clone loop is linear in total data rather than superlinear — so both were dropped.

**Confidence.** Locations, line contents and complexity classes are verified by reading, twice, by different agents; I independently re-read all 10 P1 anchors. Runtime cost is _estimated from `n` at the call site_ — nothing here was benchmarked, unlike #31123/#31126 which carry measured numbers. Treat P1/P2/P3 as a review queue, not as measured impact.

---

## The two findings that share one trigger

Worth stating before the list, because it changes the fix order. **#1 and #2 are driven by the same loop.**
`fetchAllTransactionsForAccountThunk` ([`transactionsThunks.ts:742`](suite-common/wallet-core/src/transactions/transactionsThunks.ts#L742)) walks a `while (true)` paging loop at 25 transactions per page. Each iteration dispatches `addTransaction`, which pays:

- a linear scan of the account's whole stored array _per incoming transaction_ (#1, in the reducer), and
- a full delete-and-rewrite of every persisted transaction row _per page_ (#2, in the storage middleware).

For a 10 000-transaction account that is 400 pages × 10 000 — roughly 5·10⁷ element visits on an immer draft, plus ~4M IDB deletes and ~4M puts with a structured clone each. They should be fixed together, or at minimum filed as siblings, since debouncing the paging loop's persistence would also blunt #2 on its own.

---

## P1 — unbounded `n`, hot path

### 1. `addTransaction` reducer scans the whole account history once per incoming transaction

**Where:** [`suite-common/wallet-core/src/transactions/transactionsReducer.ts:71`](suite-common/wallet-core/src/transactions/transactionsReducer.ts#L71) (+80, +84)

```ts
transactions.forEach((transaction, i) => {
    const existingTx = findTransaction(transaction.txid, accountTxs);   // linear scan, per tx
    if (!existingTx) {
        if (page && perPage) { accountTxs[txIndex] = transaction; }
        else { accountTxs.unshift(transaction); }                       // O(len) shift, per tx
    } else {
        const existingTxIndex = accountTxs.findIndex(t => t?.txid === existingTx.txid);  // second scan
```

`findTransaction` ([`transactionUtils.ts:605`](suite-common/wallet-utils/src/transactionUtils.ts#L605)) is a plain `.find` over the account's entire stored array, run once per incoming transaction — the inner collection is loop-invariant and hoistable. Line 84 then re-scans to recover an index the first scan already had.

**Complexity:** O(incoming × accountTxs) per dispatch; cumulative **O(N²/25)** across a full paged history fetch. Separately **O(m²)** on the `unshift` branch, which `fetchUtxoTransactionsForAccountThunk` ([`transactionsThunks.ts:678`](suite-common/wallet-core/src/transactions/transactionsThunks.ts#L678)) takes for _every_ insert because it passes no `page`/`perPage` — one `unshift` per UTXO, thousands on a coinjoin account.

All of it runs inside the reducer, blocking the dispatch, on an immer draft (so each element visit is a proxy get).

**Fix.** Build the index once above the loop and drop the redundant second scan:

```ts
const indexByTxid = new Map<string, number>();
accountTxs.forEach((t, i) => {
    if (t?.txid && !indexByTxid.has(t.txid)) indexByTxid.set(t.txid, i); // FIRST-wins
});
```

> **Issue notes.** The map **must be first-wins**, not last-wins: today `findTransaction` returns the first match and `findIndex` returns that same index, and a txid can appear twice in the sparse paged array — a naive `new Map(txs.map(...))` keeps the _last_ index and would write the update to the wrong slot. The map must also be maintained as the loop inserts, and since `unshift` shifts every index, batching the no-page branch into a single prepend is a prerequisite for keeping indices valid. `Array.prototype.find` does not skip holes, so the sparse paged array is scanned over its full length today. Other `addTransaction` caller: `accountsThunks.ts:266` — a batched-prepend rewrite must preserve its existing `.reverse()` ordering. Already-filed lines 51/58 of this file (#31131 neighbourhood) are a _different_ case (`removeTransaction`); this is new.

**Size:** medium. Highest-value fix in the report.

---

### 2. Every transaction page deletes and rewrites the account's entire persisted history

**Where:** [`packages/suite/src/middlewares/wallet/storageMiddleware.ts:178`](packages/suite/src/middlewares/wallet/storageMiddleware.ts#L178)

```ts
save: ({ action }, { dispatch }) => {
    const { account } = action.payload;

    storageActions.removeAccountTransactions(account);        // cursor-deletes EVERY row
    dispatch(storageActions.saveAccountTransactions(account)); // re-puts EVERY row
},
```

Matched on `addTransaction` / `removeTransaction`. `removeAccountTransactions` → `db.removeItemByIndex` opens a cursor on the `accountKey` index and deletes every row one at a time; `saveAccountTransactions` then re-materialises `accTxs.map((tx, order) => ({ tx, order }))` for the whole account and puts every row back.

**Complexity:** O(pages × N) deletes + puts + wrapper allocations. A 10 000-tx account over 400 pages ≈ **4M deletes + 4M puts**, each with a structured clone on the main thread.

**Fix.** Do not persist the whole account per page. See the caveat — a naive delta write is unsafe.

> **Issue notes.** **Gate the issue on this:** the handler only runs when `getIsDeviceRemembered(device)` is true ([`storageMiddleware.ts:320`](packages/suite/src/middlewares/wallet/storageMiddleware.ts#L320)) — standard/unremembered wallets never persist transactions and are unaffected. **The obvious fix is not safe as written:** `txs` rows carry `order` = the transaction's index inside the state array, and a new pending tx is _prepended_, shifting `order` for every existing row, so a pure delta write would leave stale/duplicate `order` values and corrupt list ordering on reload. Viable directions: (a) write the affected index range plus the shifted rows, (b) **debounce/coalesce persistence so the paging loop writes once at `fetchAllTransactionsForAccountThunk.fulfilled`** rather than per page — simplest and also fixes the interaction with #1, (c) derive ordering from `blockTime`/`txid` instead of position. The sibling handler at [`storageMiddleware.ts:193`](packages/suite/src/middlewares/wallet/storageMiddleware.ts#L193) has the same per-page rewrite problem for historic rates — fix together.

**Size:** medium–large; needs a design decision on the `order` scheme.

---

### 3. Transaction search builds its address→txid map in O(transactions²)

**Where:** [`suite-common/transaction-search/src/simpleSearchTransactions.ts:29`](suite-common/transaction-search/src/simpleSearchTransactions.ts#L29)

```ts
addrs.forEach(address => {
    if (!addresses[address]) {
        addresses[address] = [];
    }
    if (!addresses[address].includes(txid)) {
        // linear scan of the bucket, per insertion
        addresses[address].push(txid);
    }
});
```

`addAddress` runs for every vin, every vout and every target of every transaction, and each call linearly scans the txid list already accumulated for that address. On EVM/XRP/Stellar the account's own descriptor appears in essentially _every_ transaction, so that one bucket grows to the full transaction count and each of ~3 insertions per tx rescans it — **exactly quadratic**. Reused BTC receive/change addresses behave the same way.

**Fix.** Make the bucket a `Set`:

```ts
const addresses: Record<string, Set<string>> = {};
addresses[address] ??= new Set();
addresses[address].add(txid);
```

> **Issue notes.** Path is gated — `simpleSearchTransactions` returns early for empty/operator-only searches and for `</>/=` amount and date searches, so this only runs for **free-text** search. It then runs on every debounced keystroke ([`TransactionList.tsx:68`](packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx#L68), 200 ms) and once per `&`/`|` term. Second caller: `exportTransactionsActions.ts:93` (CSV/PDF export). **Companion edit:** line 184 `return txsForAddresses[address] ?? []` must become `[...(txsForAddresses[address] ?? [])]` — `flatMap` needs an array, a `Set` is not spreadable by it. `groupTransactionsByLabel` (:47) has the same bucket shape but no `includes` scan, so it is unaffected. Note this file now carries **four** distinct anchors — see [Bundling](#bundling-findings-that-share-a-file).

**Size:** small.

---

### 4. Blockbook re-derives the change-output set once per output

**Where:** [`packages/blockchain-link-utils/src/blockbook.ts:238`](packages/blockchain-link-utils/src/blockbook.ts#L238) (used at 277, 290)

```ts
const isNonChangeOutput = (o: VinVout) =>
    addresses ? !filterTargets(addresses.change, tx.vout).includes(o) : true;
// ...
targets = outputs.filter(isNonChangeOutput); // :277
const intentionalOutputs = outputs.filter(isNonChangeOutput); // :290
```

Nothing inside the predicate derives from `o` except the final `.includes(o)`. `filterTargets(addresses.change, tx.vout)` is itself O(vout × changeAddresses) with a fresh mapped string array per call ([`utils.ts:17`](packages/blockchain-link-utils/src/utils.ts#L17)) — and it is re-executed **once per output**.

**Complexity:** O(vout² × changeAddresses) per transaction. Both factors grow with real data: consolidation and exchange batch-payout transactions carry hundreds to thousands of vouts, and `addresses.change` gains an entry for every outgoing transaction the account ever makes.

**Fix.** Hoist the invariant:

```ts
const changeOutputs = addresses ? new Set(filterTargets(addresses.change, tx.vout)) : undefined;
const isNonChangeOutput = (o: VinVout) => !changeOutputs?.has(o);
```

> **Issue notes.** Blockbook is the default backend for all bitcoin-like _and_ EVM accounts, so this has the widest blast radius in the report. The **reference-identity `Set` above is the correct form** — `filterTargets` returns elements of `tx.vout` by reference and `outputs` is that same array, so `.has()` is exactly equivalent to today's `.includes()`. Do _not_ use the address-string-Set variant: it changes the matching rule from object identity to address equality and drops the `Array.isArray(vinVout.addresses)` guard in `isAccountOwned`. The EVM/descriptor path is unaffected — when `addressesOrDescriptor` is a string, `addresses` is undefined and the predicate short-circuits to `true`; the quadratic only fires for xpub-style accounts. Hot callers: `transformAccountInfo` maps every transaction of a page, and the blockbook worker's `onTransaction` ([`workers/blockbook/index.ts:234`](packages/blockchain-link/src/workers/blockbook/index.ts#L234)) runs it per address notification. Regression cover exists in `packages/blockchain-link/tests/unit` (sent/self classification).

**Size:** small.

---

### 5. `arrayPartition` is O(n²) in allocations — and it runs over full transaction lists

**Where:** [`packages/utils/src/arrayPartition.ts:12-17`](packages/utils/src/arrayPartition.ts#L12)

```ts
export const arrayPartition: ArrayPartition = <T>(array: T[], condition: (elem: T) => boolean) =>
    array.reduce<[T[], T[]]>(
        ([pass, fail], elem) =>
            condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
        [[], []],
    ) as any;
```

Every element copies the whole accumulated `pass` **or** `fail` array, plus a fresh 2-tuple per element — ~`n²/2` element copies and `2n` array allocations.

**Fix**

```ts
export const arrayPartition: ArrayPartition = <T>(array: T[], condition: (elem: T) => boolean) => {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach(elem => (condition(elem) ? pass : fail).push(elem));

    return [pass, fail] as any;
};
```

**Why it matters.** The exact anti-pattern named in the skill, in a `@trezor/utils` primitive with **~25 call sites**. Two are transaction-sized: [`transactionUtils.ts:721`](suite-common/wallet-utils/src/transactionUtils.ts#L721) (`analyzeTransactions` partitions the account's whole stored history on every fetch) and [`suite-native TransactionList.tsx:214`](suite-native/transactions/src/components/TransactionList.tsx#L214) (partitions `transactions` inside the list's `useMemo`, on mobile). The rest are bounded but get the win free. It also supplies the idiomatic fix for #9.

**Size:** small, self-contained, behaviour identical. `packages/utils` has an existing test file to extend.

---

### 6. Legacy labeling rebuilds the entire account list per row, per dispatch

**Where:** [`suite/metadata/src/metadataReducer.ts:304`](suite/metadata/src/metadataReducer.ts#L304) (list built at 273–293)

```ts
selectLabelableEntityByKey = (state, deviceState, entityKey) =>
    selectLabelableEntities(state, deviceState).find(e => { ... });
```

`selectLabelableEntities` does not merely scan — it **rebuilds a fresh array and spreads `{...account.metadata}` into a new object for every account and every device**, then `.find()`s over the result, all to answer a single keyed lookup. It is a plain function, not a `createSelector`, so nothing is memoized.

**Complexity:** O(accounts + devices) array build + object spreads, ×2 calls per `Labeling` instance, × rows, re-run on **every dispatched action** (it lives inside `useSelector`, so it re-executes for every mounted row whether or not that row re-renders).

`Labeling` is a per-row component: `UtxoSelection` renders **two** per UTXO row in coin control ([`UtxoSelection.tsx:156`](packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx#L156), :249), `TransactionTarget` one per transaction target, `AddressHistoryRow` three per address row. A coin-control screen with a few hundred UTXOs issues ~4 calls per row; with 50–150 accounts that is hundreds of thousands of object spreads per Redux action.

**Fix.** Two tiers, and the cheap one is worth taking immediately:

1. **Reorder the guard.** Move `if (!selectIsLabelingAvailable(state)) return false;` _above_ the `selectLabelableEntityByKey` call in `selectIsLabelingAvailableForEntity` (:353–368). The two conditions are already ANDed, so this is a pure no-op semantically, and it removes the scan entirely in the now-common Suite-Sync/legacy-off case.
2. **Structural.** Look the entity up directly — `selectAccountByKey(state, entityKey)` / `selectDeviceByStaticSessionId` — and read `[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName` off it.

> **Issue notes.** A direct lookup must preserve **account-key-before-session-id precedence** to match today's first-wins behaviour over the union. `selectLabelableEntities` is exported and also used by `metadataLabelingActions.ts:41`, so it cannot simply be deleted. Both selectors are marked `@deprecated Legacy Labeling` — **worth confirming with the team whether deleting the legacy branch beats optimising it.**

**Size:** small for tier 1, medium for tier 2.

---

### 7. `WorkerState` address/account bookkeeping is quadratic throughout

**Where:** [`packages/blockchain-link/src/workers/state.ts`](packages/blockchain-link/src/workers/state.ts)

| Line                                                                                                               | Code                                                  | Complexity              |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------- |
| [25](packages/blockchain-link/src/workers/state.ts#L25)                                                            | `if (seen.includes(a)) return false;`                 | O(n²) dedup             |
| [33](packages/blockchain-link/src/workers/state.ts#L33)                                                            | `.filter(a => !this.addresses.includes(a))`           | O(new × subscribed)     |
| [44](packages/blockchain-link/src/workers/state.ts#L44)                                                            | `this.addresses.filter(a => !unique.includes(a))`     | O(subscribed × removed) |
| [55](packages/blockchain-link/src/workers/state.ts#L55)                                                            | `if (seen.includes(a.descriptor)) return false;`      | O(n²) dedup             |
| [80](packages/blockchain-link/src/workers/state.ts#L80), [112](packages/blockchain-link/src/workers/state.ts#L112) | `this.accounts.reduce((addr, a) => addr.concat(...))` | O(n²) allocations       |

**Fix.** `seen` → `Set`; keep a parallel `Set` for `this.addresses` (or make it authoritative and derive the array in `getAddresses`); the two `concat` reduces → `flatMap`.

`this.addresses` is the union of every address of every subscribed account — thousands on a wallet with several fully-discovered UTXO accounts. `addAccounts` additionally recomputes the full address list for _all_ accounts each time _any_ account is added. Worker-thread work, so it does not block the UI, but it delays every subscription round-trip.

**Size:** medium — check `addAddresses`'s return value, whose callers rely on it being _only_ the newly added addresses.

---

### 8. `selectHistoricRatesByTransactions` rebuilds the rate-key list once per transaction

**Where:** [`suite-common/wallet-utils/src/fiatRatesUtils.ts:109-137`](suite-common/wallet-utils/src/fiatRatesUtils.ts#L109)

```ts
txs.forEach(tx => {
    const { symbol, blockTime, tokens } = tx;
    typedObjectKeys(historicRates).forEach(fiatRateKey => {   // fresh array per transaction
        if (fiatRateKey.startsWith(symbol) ||
            tokens.some(token => fiatRateKey.startsWith(`[${symbol}-${token.contract}]`))) {
```

Three compounding problems inside the per-transaction loop: the key array is re-materialised per transaction, `tokens.some(...)` rescans per (tx × key), and the template literal allocates per (tx × key × token). **O(txs × rateKeys × tokens)** with an O(txs × rateKeys) allocation on top.

**Fix.** Hoist `fiatRateKeys` above the loop and precompute the token prefixes per transaction. The `startsWith`-on-prefix shape means a `Set` needs the key normalised first; hoisting alone already removes both allocations.

The only caller is [`storageActions.ts:341`](packages/suite/src/actions/suite/storageActions.ts#L341) (`saveAccountHistoricRates`), where `txs` is the account's full history and `historicRates` spans every symbol/token the wallet has seen.

**Size:** small. Pure function, no callers to update.

---

### 9. `transformAddresses` partitions account addresses by identity scan

**Where:** [`packages/blockchain-link-utils/src/blockbook.ts:431-432`](packages/blockchain-link-utils/src/blockbook.ts#L431)

```ts
const internal = addresses.filter(a => a.path.split('/')[4] === '1');
const external = addresses.filter(a => !internal.includes(a)); // O(n) identity scan per address
```

O(n²) over the account's full address list, plus `n` redundant `path.split('/')` calls. Runs on every `transformAccountInfo`, i.e. every account-info response.

**Fix.** One pass over a hoisted predicate — `arrayPartition(addresses, isInternal)` once #5 lands, or two `filter`s over the shared predicate otherwise.

**Size:** small. **Bundle with #4, #26 and #27** — same file.

---

### 10. Coin control: the O(n²) UTXO scans that #31125 / #31126 do _not_ cover

**Where:** [`packages/suite/src/hooks/wallet/form/useUtxoSelection.ts`](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts)

#31126 fixes line 94 and #31125 fixes line 125. Six more remain in the same hook:

| Line                                                                 | Code                                                                    | Complexity               |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------ |
| [63](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L63)   | `selectedUtxos.filter(s => !account.utxo?.some(u => isSameUtxo(s, u)))` | O(selected × utxos)      |
| [66](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L66)   | `selectedUtxos.filter(s => coinjoinRegisteredUtxos.some(...))`          | O(selected × registered) |
| [73](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L73)   | `.filter(u => !spentUtxos.includes(u) && !registeredUtxos.includes(u))` | O(selected²)             |
| [141](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L141) | `account.utxo?.filter(u => composedInputs.some(...))`                   | O(utxos × inputs)        |
| [173](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L173) | `selectedUtxos.filter(s => !topCategory?.find(u => isSameUtxo(s, u)))`  | O(selected × utxos)      |
| [179](packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L179) | `.filter(u => !coinjoinRegisteredUtxos.includes(u))`                    | O(utxos × registered)    |

The `selectedUtxoOutpoints: Set<string>` that #31125 already introduces covers 63/66/73/173 directly. Lines 173/179 sit in `toggleCheckAllUtxos` — the _"select all"_ handler, i.e. precisely the action that makes `selectedUtxos` as large as `account.utxo`, so the quadratic lands exactly when `n` peaks.

**Recommendation:** fold into **#31125** rather than filing separately — same file, same `Set`.

**Size:** small if stacked on #31125; medium standalone.

---

---

### 11. `arrayDistinct` is O(n²) by construction — a second quadratic `@trezor/utils` primitive

**Where:** [`packages/utils/src/arrayDistinct.ts:4`](packages/utils/src/arrayDistinct.ts#L4)

```ts
export const arrayDistinct = <T>(item: T, index: number, self: T[]) => self.indexOf(item) === index;
```

Used as `array.filter(arrayDistinct)`, this runs a full `indexOf` scan **per element** — O(n²) string comparisons for every dedup in the repo that uses it. This is the same class of defect as #5 (`arrayPartition`) and the already-filed #31122 (`arrayToDictionary`): a shared primitive in `@trezor/utils` whose cost multiplies across every call site.

**Fix.** The helper cannot be made O(1) in place — a `filter` predicate receives `self` on every call, so there is nowhere to hold the seen-set without a `WeakMap` cache keyed on the array, which is worse than the alternative. Replace call sites with `[...new Set(xs)]`, which preserves first-insertion order **identically** to `filter(arrayDistinct)`, then deprecate or delete the helper.

**Call-site triage.** 14 call sites; severity varies enormously, so grade per site rather than sweeping blindly:

| Call site                                                                                                                                          | `n`                                                                               | Verdict                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [`electrum/utils/transaction.ts:103`](packages/blockchain-link/src/workers/electrum/utils/transaction.ts#L103), :115, :126                         | full unpaginated account history (thousands)                                      | **Severe** — 10⁶–10⁸ comparisons. Detailed as #35                                                      |
| [`coinjoin/backend/backendUtils.ts:18`](packages/coinjoin/src/backend/backendUtils.ts#L18)                                                         | vin+vout addresses of one tx (hundreds for a WabiSabi coinjoin), called A×T times | **Severe** — detailed as #37                                                                           |
| [`electrum/utils/addressManager.ts:22`](packages/blockchain-link/src/workers/electrum/utils/addressManager.ts#L22)                                 | addresses being subscribed                                                        | **Real.** ⚠️ Sits two lines above the spread-reduce already filed as **#31129**                        |
| [`wallet-utils/src/accountUtils.ts:372`](suite-common/wallet-utils/src/accountUtils.ts#L372)                                                       | addresses in one tx, inside a `flatMap` over the whole tx list                    | **Real** for coinjoin/batch txs. ⚠️ Sits two lines above the spread-reduce already filed as **#31131** |
| [`CoinjoinMempoolController.ts:62`](packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L62)                                                | colliding txids per address                                                       | Marginal — grows with mempool collisions                                                               |
| `blockchainThunks.ts:214`, `:236`, `DeviceList.ts:257`, `CoinjoinRound.ts:139`, `:240`, `coinjoinMiddleware.ts:92`, `coinjoinClientActions.ts:373` | symbols / identities / round inputs                                               | **Bounded — leave alone**                                                                              |

> **Issue notes.** The two ⚠️ rows are the actionable insight here: `addressManager.ts:22` and `accountUtils.ts:372` each sit immediately above a line that is _already filed_ (#31129 and #31131 respectively). Whoever picks up those two issues is editing that exact function body, so the `arrayDistinct` fix should be folded into them rather than filed separately — otherwise two PRs touch the same four lines. Behaviour is identical in every case: `[...new Set(...)]` preserves first-occurrence order, and no call site depends on the predicate's `index`/`self` arguments for anything else.

**Size:** small per call site; the value is in doing the unbounded five together and deleting the helper.

## P2 — unbounded `n`, colder path or narrower blast radius

Grouped by subsystem. Every entry was confirmed by an adversarial verifier that re-read the file and traced call sites.

### A. Suite app — UI (packages/suite)

#### 12. `AccountLabelForOwnAddress` — `packages/suite/src/components/suite/labeling/AccountLabelForOwnAddress.tsx:22` (+16)

`O(accountsOfSymbol x addressesPerAccount) per rendered address, per render` · **hot** path · rule: _index-before-iterate_

```ts
const relevantAccounts = findAccountsByAddress(symbol, address, accounts);
```

**n grows because** The scan is two files away from the loop that drives it: TransactionList -> TransactionItem -> TransactionTargetsList (allOutputs.map) -> TransactionTarget -> TargetAddressLabel, which maps `target.addresses` at TargetAddressLabel.tsx:42 and renders one <AccountLabelForOwnAddress> per address for every `sent` transaction. It is also rendered per internal transfer (TransactionTarget.tsx:183) and per token transfer (TokenTransferAddressLabel.tsx:19,21). Nothing is memoized: findAccountsByAddress allocates two intermediate arrays and runs three `.some()` passes per account on every render. A page shows 25 transactions, each with one or more targets, so a Bitcoin wallet with a few accounts of a few thousand used+change addresses does millions of string comparisons per render of the transaction list.

**Fix.** Index once, look up per row: add a memoized selector that builds `Map<string, Account>` from address -> account for the given symbol (keyed off `state.wallet.accounts`) and have AccountLabelForOwnAddress do a single `map.get(address)`. The same map removes the per-line scan at TransactionReviewOutput.tsx:715 and TransactionReviewOutputList.tsx:120.

> **Issue notes.** Held at P2 rather than P1 deliberately: I could not confirm babel-plugin-react-compiler is wired into the web build (only compiler-era eslint suppressions referencing plans/react-compiler-follow-ups.md exist under packages/suite). If the compiler IS on, the body auto-memoizes on (symbol, address, accounts, knownOnly) and the sweep runs on mount and on every accounts-identity change (each sync/block) rather than every render — still O(rows x addresses) per account update. If it is off, it is per render and this is P1. State that uncertainty in the issue instead of asserting either. The memoized address->Account map must be keyed per symbol and must preserve first-wins: the component uses relevantAccounts[0], today the first match in `state.wallet.accounts` array order, so build the map skip-if-present, not last-writer-wins. The same map removes identical scans at TransactionReviewOutput.tsx:715, TransactionReviewOutputList.tsx:120, SignMessageModal.tsx:81 and suite-common/wallet-core/src/selectors.ts:245 — list them as follow-ups, do not file separately. Do not touch migrateToV56.ts:50 (one-time migration).

_Spans:_ `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:42`

#### 13. `TransactionRenderer` — `packages/suite/src/components/suite/notifications/NotificationRenderer/TransactionRenderer.tsx:46` (+47,53)

`O(notifications x (accounts + txsOfMatchedAccount)) per render of the Activity list` · **hot** path · rule: _index-before-iterate_

```ts
const networkAccounts = findAccountsByNetwork(symbol, accounts);
```

**n grows because** `NotificationList.tsx:14` maps over the notification array with no pagination and no cap — the reducer only ever `unshift`s (suite-common/toast-notifications/src/notificationsReducer.ts:42), so notifications accumulate for the whole session (one per tx-received / tx-sent / tx-confirmed / tx-approved / tx-staked / tx-yield-* event). The Activity page (packages/suite/src/views/suite/notifications/index.tsx:73) renders every one of them, and `TransactionRenderer` handles all 14 `tx-*` types, i.e. the entire default tab. Each row independently linear-scans the global account list and then the matched account's whole tx history. Worse, the row subscribes to `selectAccounts`, `selectTransactions`, `selectBlockchainState` and `selectDevices`, so every new block / account update re-renders all rows and repeats all scans.

**Fix.** Resolve the account and the transaction through the existing weakMap-memoized selectors instead of scanning per row: build the account key once with `createAccountKey({ accountDescriptor: descriptor, networkSymbol: symbol, deviceStaticSessionId: device?.state?.staticSessionId })` and use `selectAccountByKey(state, accountKey)`, then `selectTransactionByAccountKeyAndTxid(state, accountKey, txid)` (suite-common/wallet-core/src/transactions/transactionsSelectors.ts:130) — that one is `createMemoizedSelector`/weakMapMemoize, so repeated calls with the same txid are free across dispatches. Same treatment for `findAccountDevice`. That drops the per-row cost to O(1) after the first render.

> **Issue notes.** One correction to the candidate's analysis: `getAccountTransactions` (transactionUtils.ts:60-63) is `transactions[accountKey] || []`, i.e. O(1) — it is NOT a scan. The transaction-side cost is entirely line 53 (`findTransaction`). Fix feasibility: `createAccountKey` is exported from @suite-common/wallet-types (re-exported as the deprecated `getAccountKey` at accountUtils.ts:1133) and `selectTransactionByAccountKeyAndTxid` exists at transactionsSelectors.ts:130 as a createMemoizedSelector, so the proposed rewrite compiles in principle — but note a BEHAVIOUR DELTA: today `findAccountsByDescriptor` matches on descriptor alone across ALL devices and takes `.at(0)`, whereas an account key built from the notification's `device.state.staticSessionId` is device-scoped. A notification carrying a stale/absent device state would stop resolving where it resolves today. Also `createAccountKey` expects a branded `AccountDescriptor` (see `asAccountDescriptor` in accountUtils.test.ts), so the raw `descriptor: string` needs the brand helper. `findAccountDevice` scans `devices`, which is bounded at a handful — leave it alone.

_Spans:_ `packages/suite/src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationList.tsx:14`

#### 14. `TokenIconSetWrapper` — `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:26` (+32,60)

`O(tokenRows x totalTokensAcrossAllAccounts) instead of O(tokensOfThatNetwork), plus 2 BigNumber allocations per token per row` · **hot** path · rule: _index-before-iterate_

```ts
    const allTokensWithRates = accounts.flatMap(account =>
```

**n grows because** The component is rendered once per _network row_ of the dashboard's My Assets section, but is handed the whole unfiltered account list. `AssetRow.tsx:230` renders `<TokenIconSetWrapper accounts={accounts} symbol={network.symbol} />` where `accounts` is `asset.accounts` === the full `selectAllAccountsToList` result (AssetsView.tsx:162), not the accounts of that row's network. `AssetCardTokensAndStakingInfo.tsx:61` does the same for the grid layout. So an ETH account with 800 tokens is re-scanned for the BTC row, the SOL row, the ADA row... For each row this does 2 BigNumber allocations per token in `enhanceTokensWithRates`, then a third in `getTokens` (line 32), then a full sort (line 60) — all on tokens that will be discarded because they do not match the row's `coinDefinitions`. Entry point: dashboard `AssetsView`, whose body is entirely unmemoized and re-runs on every fiat-rate tick and account update; `AssetRow` is `memo`ed but its `assetsFiatBalances` prop is rebuilt fresh every render (AssetsView.tsx:78-90), so the memo never holds.

**Fix.** Pass only the row's own accounts. `AssetsView` already builds the index — `assets: PartialRecord<NetworkSymbol, Account[]>` at lines 110-122 — so thread `assets[symbol]` through `AssetData.accounts` instead of the global `accounts`, i.e. in AssetsView.tsx:162 use `accounts: assets[symbol] ?? []`. Nothing downstream wants the cross-network accounts: `TokenIconSetWrapper` only ever emits tokens whose contract is known to `coinDefinitions` for `symbol`. Optionally also wrap the flatMap/getTokens/sort chain in a `useMemo` keyed on `[accounts, symbol, baseCurrencyCode, fiatRates, coinDefinitions]` since packages/suite is not React-Compiler-compiled.

> **Issue notes.** The row multiplier is itself bounded (one per enabled network that renders a token row, ~5-10 in practice), so this is a large constant factor on an unbounded n rather than true quadratic growth — grade accordingly, but the wasted portion is 100% pure waste. Fix as proposed: AssetsView.tsx already builds `assets: PartialRecord<NetworkSymbol, Account[]>` at lines 110-122, so change line 162 from `accounts,` to `accounts: assets[symbol] ?? []`. Behaviour delta is nil in practice (getTokens already drops tokens not in the row's coinDefinitions) but it is not a pure no-op: today a foreign-network contract that happened to appear in this symbol's coinDefinitions would leak into the icon set. `AssetData.accounts` is typed `Account[]` (AssetData.ts) so `assets[symbol] ?? []` needs the `?? []` for noUncheckedIndexedAccess. Companion consideration: AssetRow is `memo`ed but never actually memoizes, because `stakingAccounts` and `assetsFiatBalances` are rebuilt fresh each render (see candidate 3) — fixing only this file does not stop the re-renders. packages/suite is not React-Compiler-compiled, so a useMemo around the flatMap/getTokens/sort chain is a legitimate extra step.

_Spans:_ `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:230`

### B. Suite app — hooks, actions, middleware, utils

#### 15. `saveAccountHistoricRates` — `packages/suite/src/actions/suite/storageActions.ts:341` (+338,339)

`O(pages x N x R) with the current inner scan, O(pages x N) = O(N^2/25) even after fiatRatesUtils.ts:119 is indexed; N = account transactions, R = keys in wallet.fiat.historic` · **warm** path · rule: _other-quadratic_

```ts
const accHistoricRates = selectHistoricRatesByTransactions(historicRates, accTxs);
```

**n grows because** storageMiddleware.ts:196 fires this on every `updateTxsFiatRatesThunk.fulfilled`, and that thunk is dispatched once per `addTransaction` batch (suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts:57). So paging a 10,000-tx account (400 pages) re-walks all 10,000 txs 400 times, each walk also re-deriving and re-writing the whole `historicRates` IDB record after `removeAccountHistoricRates`. This is a separate defect from the already-filed inner nested scan in fiatRatesUtils.ts: even if that inner loop is indexed to O(1) per tx, the outer full-history walk per rate batch remains O(N) per page = O(N^2/perPage) overall.

**Fix.** Pass the just-updated txs through instead of re-deriving from the whole account: `updateTxsFiatRatesThunk.fulfilled` already knows which transactions it fetched rates for, so merge those keys into the stored record (read-modify-write of the existing `historicRates` entry) rather than recomputing the account-wide map from `wallet.transactions` on every batch.

> **Issue notes.** OVERLAPS with the already-reported suite-common/wallet-utils/src/fiatRatesUtils.ts:119 (`typedObjectKeys(historicRates).forEach` inside `txs.forEach`, plus `typedObjectKeys` re-materialised inside the loop body). If both are filed, cross-link them: fixing only :119 leaves the quadratic paging behaviour intact, and fixing only this one leaves the inner O(N x R) intact. Consider folding this into the existing fiatRatesUtils issue as 'the caller is also quadratic'. Same remembered-device gate as the previous finding (storageMiddleware.ts:320) — unremembered wallets never hit it. Behaviour note for the fix: `removeAccountHistoricRates` + full re-derive is currently what prunes rate entries belonging to txs that disappeared. A read-modify-write delta merge would stop pruning, so the issue should say the pruning needs to move somewhere else (e.g. `removeTransaction` / `fetchAllTransactionsForAccountThunk.fulfilled`) rather than just be dropped.

_Spans:_ `packages/suite/src/middlewares/wallet/storageMiddleware.ts:196`

#### 16. `useEvmNonceInfo` — `packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:90` (+43,86,91)

`O(rows x N x ~8 passes) per transaction-list re-derivation; rows = 25 (getTxsPerPage), N = account transactions` · **hot** path · rule: _other-quadratic_

```ts
const nonceInfo = data.isTrusted;
```

**n grows because** This is the two-file case the skill warns about: `TransactionItem.tsx:103` calls `useEvmNonceInfo(nonceAccount)` unconditionally for every row, and `TransactionList.tsx:130` renders `perPage` = 25 rows (`getTxsPerPage`). Each row's `useMemo` runs `getOwnEvmNonceSets(transactions)` (suite-common/wallet-utils/src/transactionUtils.ts:130), which is 4 `.filter` + 2 `.map` passes plus two `Set` builds plus two spread-to-array allocations over the WHOLE account tx array -- and every row computes the identical value. On an EVM account after a full history load (10k+ txs) that is 25 x 10,000 x ~8 passes per list render, and it re-runs for all 25 rows on every `transactions` identity change, i.e. once per page fetched during `fetchAllTransactionsForAccountThunk` and once per new-tx notification. Only `pendingEvmNonce !== undefined` rows actually consume the result (TransactionItem.tsx:112).

**Fix.** Derive the nonce sets once per account instead of once per row: wrap `getOwnEvmNonceSets` in a `createMemoizedSelector` keyed on `accountKey` (next to `selectAccountTransactions` in suite-common/wallet-core/src/transactions/transactionsSelectors.ts) and have the hook read the memoized sets, or compute `nonceInfo` once in `TransactionList` and pass it down as a prop. Either collapses 25 full scans into 1.

> **Issue notes.** `selectAccountTransactions` IS a `createMemoizedSelector`, so the array identity is stable across unrelated renders — the 25 scans do NOT run on every render, only when the account's tx list actually changes. That is still once per page during `fetchAllTransactionsForAccountThunk` (i.e. up to ~N/25 times) and once per new-tx notification, so the total work over a full history load is O(N^2 x 8). Only reached for `networkType === 'ethereum'` accounts (TransactionItem.tsx:100-102 narrows, otherwise `nonceAccount` is undefined -> `isEnabled` false -> early return). Also only reached once the react-query `data` resolves; the query itself is deduped by react-query across rows, so the network side is fine — only the derivation is duplicated. Fix caveat: if hoisting into a memoized selector, note the existing consumers `TxDetailModal.tsx:103`, `AccountNonce.tsx:12`, `EthereumOptions.tsx:37` also call the hook and must keep working; and the derivation depends on the fetched `data.nonce` (react-query state), not just redux, so a pure redux selector can only memoize `getOwnEvmNonceSets`, with the nonce-walking arithmetic staying in the hook. That is the right split anyway — the sets are the O(N) part.

_Spans:_ `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103`

#### 17. `sortTokensWithRates` — `packages/suite/src/utils/wallet/tokenUtils.ts:24` (+27,33)

`O(tokens log tokens) BigNumber + Intl.Collator allocations` · **hot** path · rule: _sort-comparator_

```ts
export const sortTokensWithRates = (a: TokensWithRates, b: TokensWithRates) => {
    const balanceSort =
        b.fiatValue.minus(a.fiatValue).toNumber() ||
        (b.fiatRate?.rate || -1) - (a.fiatRate?.rate || -1) ||
        (a.symbol || '').length - (b.symbol || '').length ||
        (a.symbol || '').localeCompare(b.symbol || '', undefined, { sensitivity: 'base' });
```

**n grows because** Every comparison allocates: `.minus()` builds a fresh BigNumber, and `localeCompare(x, undefined, { sensitivity: 'base' })` allocates an options object and forces V8 to construct a non-default Intl.Collator (the cached default-collator fast path does not apply when options are passed). The collator branch is not rare — it fires exactly for the long tail of zero-balance spam tokens, where fiatValue is 0, rate is missing on both sides, and symbol lengths tie. n is an account's token list, which for EVM accounts is dominated by unsolicited airdrops and reaches hundreds to thousands. Named hot callers: `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:60` sorts on every render with no useMemo at all (the whole component body re-runs `enhanceTokensWithRates` + `getTokens` + `sort` per dashboard asset row); `packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx:53` and `packages/suite/src/views/dashboard/AssetsView/assetsViewUtils.ts:39` re-sort whenever `fiatRates` changes, i.e. on every rate poll.

**Fix.** Decorate-sort-undecorate: above the sort, build `const key = new Map(tokens.map(t => [t, { fiat: t.fiatValue.toNumber(), rate: t.fiatRate?.rate ?? -1, sym: t.symbol ?? '' }]))`, and hoist one module-level `const collator = new Intl.Collator(undefined, { sensitivity: 'base' })`. The comparator then reads two Map entries and calls `collator.compare(...)` — no allocation per comparison. Also wrap `TokenIconSetWrapper`'s whole derivation in a `useMemo`.

> **Issue notes.** Correction to the sweeper's caller analysis: TokenIconSetWrapper.tsx:60 sorts `getTokens(...).shownWithBalance`, which EXCLUDES the unverified bucket (suite-common/wallet-core/src/tokens/tokenUtils.ts:85-86) — so that call site is bounded and is only a 'no useMemo at all' smell, not the unbounded one. The unbounded call sites are CoinsTable.tsx:53 and views/wallet/tokens/defi/DefiTokensTable.tsx:45 (both sort pre-categorisation). Fix: hoist one module-level `const collator = new Intl.Collator(undefined, { sensitivity: 'base' })` and precompute `fiatValue.toNumber()` per token above the sort. Behaviour delta to watch: `fiatValue.toNumber()` loses precision beyond 2^53 where `BigNumber.minus` does not — for a tie-break-ordering comparator that is acceptable, but reviewers will ask. Also note `tokensWithRates.sort(...)` mutates the array from enhanceTokensWithRates (freshly built by .map, so safe today). Since the comparator is exported and used by 7 call sites, changing its signature to a factory that closes over a precomputed Map means touching all of them; the cheapest scoped fix is just the hoisted collator.

_Spans:_ `packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:60`

### C. wallet-core (shared Redux)

#### 18. `getTokens` — `suite-common/wallet-core/src/tokens/tokenUtils.ts:63` (+58)

`O(T^2) key-function invocations with 2 template-string allocations per comparison, T = distinct tickers (accounts + known-definition tokens with balance) across ALL remembered wallets; multiplied by account count during discovery` · **hot** path · rule: _other-quadratic_

```ts
        A.uniqBy(ticker =>
```

**n grows because** `searchQuery` does not change across the loop, so `searchQuery.trim().toLowerCase()` is pure loop-invariant work executed once per token. The search-bearing call sites are the interactive ones: packages/suite/src/views/wallet/tokens/coins/CoinsTable.tsx:57, hidden-tokens/HiddenTokensTable.tsx:25 and :31 (two full passes), inactive/defi tables, TokensNavigation.tsx:126, and packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:105 which calls `getTokens` per account inside a filter over the whole account list — so on the accounts-menu search the total is 3 x (sum of tokens over all accounts) throwaway strings per keystroke, and the hidden-tokens tab pays it twice over the spam bucket, which is exactly the largest bucket. n grows with upstream token data and has no ceiling.

**Fix.** Hoist the normalisation above the loop and pass the already-normalised value down: `const query = searchQuery ? searchQuery.trim().toLowerCase() : '';` immediately after `const shownTokens = ...` (line 56), then use `query` inside the callback. Also drop the redundant re-lowercasing in `isTokenMatchesSearch` (suite-common/wallet-utils/src/tokenUtils.ts:102 `const search = rawSearch.toLowerCase();`) — every caller already passes a lowercased query — or rename the parameter to make the precondition explicit.

> **Issue notes.** Not on either exclusion list — fiatRatesReducer.ts:127 is excluded, this is fiatRatesSelectors.ts:122, a different file and a different defect. The proposed Set-keyed rewrite is behaviour-preserving with two caveats the issue must state: (1) the existing pipeline emits a native ticker for EVERY account and dedupes afterwards, so the rewrite must keep the `seen` set shared across the native and token keys as written or duplicate natives leak through — natives key on bare `account.symbol`, tokens on `symbol-contract`, which cannot collide, so a single Set is safe; (2) `A.sortBy(ticker => tokenAddress ? 1 : 0)` at :125 is a STABLE sort that pushes natives ahead of tokens; the manual loop already emits each account's native before its tokens, but across accounts the interleaving differs from the sorted output (sorted: all natives, then all tokens; loop: acc1-native, acc1-tokens, acc2-native, ...). fetchFiatRatesThunk chunks the result 4 at a time (fiatRatesThunks.ts:380-389) and fetches chunks sequentially, so ordering DOES affect which rates arrive first — natives-first is deliberate for perceived load time. Keep the sort, or emit natives and tokens into two arrays and concat. (3) `new BigNumber(token.balance ?? '0').gt(0)` at :106 also allocates per token per call; the suggested `!token.balance || token.balance === '0'` fast path is NOT equivalent for values like '0.0' or '0x0' — guard with a cheap check then fall back to BigNumber rather than replacing it. Wrapping selectTickerFromAccounts in createWeakMapSelector over selectAccounts is the higher-leverage half of the fix since the middleware fires two dispatches back to back.

_Spans:_ `suite-common/wallet-utils/src/tokenUtils.ts:102`

#### 19. `selectAnyAccountIsStakingActive` — `suite-common/wallet-core/src/transactions/transactionsSelectors.ts:281` (+281, 285, 286)

`Per dashboard render: O(sum of loaded transactions across the staking accounts of each rendered symbol) + one intermediate array allocation per row; the weakMap memo never hits because the `Account[]` argument is rebuilt inline in the render body` · **hot** path · rule: _other-quadratic_

```ts
export const selectAnyAccountIsStakingActive = createMemoizedSelector(
```

**n grows because** The selector's second parameter is an `Account[]`, and `createWeakMapSelector` (redux-utils/selectorsUtils.ts:24-27) keys its `argsMemoize`/`memoize` on argument _identity_. Both callers build that array inline in the render body — `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:79` (`stakingAccounts.filter(...)`) and `AssetCard.tsx:109` — so every render produces a fresh reference, the WeakMap misses, and the combiner re-filters each staking account's _entire_ transaction list (allocating a new array) to answer a boolean. The dashboard re-renders on every fiat-rate chunk (fetched 4 tickers at a time by `fetchFiatRatesThunk`) and on every account update from the sync loop, so a user with a 5k-tx ETH account pays a 5k-element filter per asset row per render. Upstream makes it worse: `AssetsView.tsx:156` computes `stakingAccounts: accounts.filter(...)` _inside_ the `assetSymbols.map(...)`, with a predicate that does not even depend on the mapped symbol — a loop-invariant O(accounts) scan repeated once per asset.

**Fix.** Take a stable primitive instead of an array so the memo can actually hold: change the signature to `(state, symbol: NetworkSymbol)` and derive the staking accounts inside from the already-memoized `selectAccounts`/`selectDeviceAccountsByNetworkSymbol`, e.g. export const selectAnyAccountIsStakingActive = createMemoizedSelector( [selectTransactions, selectDeviceAccountsByNetworkSymbol], (transactions, accounts) => accounts.some(account => { ... }), ); Also replace the `filter(...)` + `isAccountStakingActive` pair with a single `some(...)` so no intermediate array is allocated, and hoist the symbol-independent `accounts.filter(...)` in AssetsView.tsx out of the `assetSymbols.map`.

> **Issue notes.** BEHAVIOUR CAVEATS on the proposed fix. (1) `filter` -> `some` is NOT a drop-in: `isAccountStakingActive` (suite-common/wallet-core/src/stake/stakeUtils.ts:10-38) takes `claimTransactions: WalletAccountTransaction[]` and uses it only as `claimTransactions.filter(isPending).length > 0`, so collapsing it needs a signature change on a helper that is also used by `selectAccountIsStakingActive` (line 278) - do it as `some(tx => isClaimTx(...) && isPending(tx))` and pass a boolean, or leave the helper alone and just hoist. (2) Changing the parameter to `NetworkSymbol` + `selectDeviceAccountsByNetworkSymbol` widens the input from 'staking-capable accounts' to 'all device accounts of that symbol'; that is safe only because `isAccountStakingActive` returns false for `!isSupportedStakingNetworkSymbol`, but it does add a full-history filter for non-staking accounts unless the `some`/early-exit rewrite lands with it. (3) Companion edit outside wallet-core: packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:155-160 computes `stakingAccounts: accounts.filter(...)` INSIDE the `assetSymbols.map(...)` with a predicate that does not reference the mapped symbol - a genuinely loop-invariant O(accounts) scan repeated per asset, worth hoisting in the same PR. (4) Cheapest standalone win with zero API change: memoize `stakingAccountsForAsset` with useMemo in AssetRow/AssetCard so the weakMap key stabilises.

_Spans:_ `packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:79`

### D. wallet-utils (shared computation)

#### 20. `findAccountsByAddress` — `suite-common/wallet-utils/src/accountUtils.ts:308` (+313,314,315,318,319,320)

`O(rendered target rows x same-symbol accounts x addresses per account), plus one intermediate array allocation per call from the leading .filter(symbol)` · **hot** path · rule: _index-before-iterate_

```ts
export const findAccountsByAddress = (
```

**n grows because** This is the two-file case the skill warns about: the list maps rows, the ROW component does the scan. TransactionList renders 25 TransactionItems, each renders TransactionTargetsList (packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTargetsList.tsx:24) which maps allOutputs to TransactionTarget, which for a 'sent' tx renders TargetAddressLabel; that component maps target.addresses and renders <AccountLabelForOwnAddress> per address (TargetAddressLabel.tsx:51), and AccountLabelForOwnAddress.tsx:22 calls findAccountsByAddress(symbol, address, accounts) — a fresh linear scan of used+unused+change of every same-symbol account, per row, with no memo. It is the bitcoin/cardano path that hurts (EVM accounts carry no `addresses` and fall through to the O(1) descriptor compare) — exactly where the address book grows. A user with a handful of BTC accounts of ~1000 addresses each and 30-70 sent-target rows on a page does ~10^5-10^6 string comparisons per render, and it re-runs whenever the accounts array identity changes (every account update).

**Fix.** Index the address book once instead of scanning it per row. Add a memoized selector that builds Map<`${symbol}:${address}`, Account[]> from accounts (walking descriptor + addresses.used/unused/change a single time), and have AccountLabelForOwnAddress do one Map.get. Keep findAccountsByAddress for the genuinely one-off callers (SignMessageModal, migrateToV56), but the per-row consumers must go through the index.

> **Issue notes.** Correctness constraints for the index: (a) matching is EXACT-case (`u.address === address`, `a.descriptor === address`) — do NOT lowercase the Map key or EVM descriptor matching semantics change; (b) callers take `[0]`/`.at(0)`, so the index must preserve `accounts`-array order (build by walking accounts in order and pushing into the bucket, first-wins on read); (c) an account can match through several lists, so buckets must dedupe by account key or an account could appear twice in the returned array (today the outer `.filter` returns each account at most once) — TransactionReviewOutputList.tsx:120 only checks `.length > 0`, but keeping the array shape identical avoids surprises. Other callers to leave alone (genuinely one-off): SignMessageModal.tsx:81, migrateToV56.ts:50, TransactionReviewOutput.tsx:715, TransactionReviewOutputList.tsx:120. Also worth flagging in the issue body (not as a separate finding): suite-common/wallet-core/src/selectors.ts:245 and suite-common/wallet-core/src/transactions/transactionsThunks.ts:175 call the same helper inside their own loops and would benefit from the same index. AccountLabelForOwnAddress is a plain function component (no React.memo), so under React Compiler the call still re-runs whenever the component renders — the memoized-selector/index route is the fix, not wrapping the call in useMemo.

_Spans:_ `packages/suite/src/components/suite/labeling/AccountLabelForOwnAddress.tsx:22 (rendered per row from TargetAddressLabel.tsx:51 / TransactionTarget.tsx:183)`

#### 21. `getOwnEvmNonceSets` — `suite-common/wallet-utils/src/transactionUtils.ts:130` (+131,137,144,169,222,257)

`O(rendered EVM rows x account tx history), ~4 full passes per row, plus 2 toLowerCase() allocations per visited vin address` · **hot** path · rule: _index-before-iterate_

```ts
export const getOwnEvmNonceSets = (transactions: WalletAccountTransaction[]) => {
```

**n grows because** getOwnEvmNonceSets is a whole-history scan (filter isSignedByAccount, then two more filter/map chains over the result). It is correct as a once-per-account computation, but every TransactionItem row calls useEvmNonceInfo(nonceAccount) independently (packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103), and that hook's useMemo (packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:86-94) is per component instance, so getEvmNonceInfo/getEvmNonceInfoFromConfirmedNonce runs once PER ROW over the same full array. The list is the account transaction list (TransactionList -> TransactionGroupedList -> TransactionItem), the main screen of an EVM account. On top of that, isSignedByDescriptor (transactionUtils.ts:76-81) recomputes descriptor.toLowerCase() inside the per-address .some(), so each visited tx allocates 2 strings. With 3-5k stored txs and 25 rows that is ~100k+ tx visits and ~250k string allocations per pass, re-run whenever the account's tx array identity changes (every fetchAndUpdateAccountThunk).

**Fix.** Compute the nonce sets once per account and share them across rows. Either (a) add a memoized selector — createMemoizedSelector([selectAccountTransactions], getOwnEvmNonceSets) — and have useEvmNonceInfo read that instead of recomputing in a per-instance useMemo, or (b) hoist useEvmNonceInfo up to TransactionList/TransactionGroupedList and pass nonceInfo down to TransactionItem as a prop (it already receives network/disableBumpFee the same way). Separately, hoist the invariant out of the inner scan: `const lower = descriptor.toLowerCase();` above `details.vin.some(...)` in isSignedByDescriptor (transactionUtils.ts:76).

> **Issue notes.** Scope caveats to keep the issue honest: (1) the scan is EVM-only — TransactionItem.tsx:101-102 passes `undefined` for non-ethereum accounts, so `isEnabled` is false and useEvmNonceInfo.ts:86-87 returns before computing anything; bitcoin/cardano accounts pay nothing. (2) The useQuery backend fetch IS already deduped across rows (same queryKey), only the derivation is not — so the fix is purely about the useMemo, not the network call. (3) useMemo deps are [isEnabled, data, transactions, isLoading]: it re-runs per row on mount and whenever the tx array identity changes (every fetchAndUpdateAccountThunk), not on every render. Fix caveats: option (a) a memoized selector must be per-accountKey (createSelector with a parameter has cache size 1 and will thrash between accounts — use a weak/instance-per-key memo, e.g. the repo's memoizeWithArgs-style helper); option (b) hoisting into TransactionList means TxDetailModal.tsx:103 (a legitimate single-instance caller) still needs its own call, so keep the hook exported. Separately, the cheap independent fix in this file is hoisting `const lowerDescriptor = descriptor.toLowerCase();` above the `details.vin.some(...)` at transactionUtils.ts:76-81 — pure constant-factor, no behaviour change, no companion edits. getOwnEvmNonceSets itself has 3 other callers (:173, :226, :252) that are once-per-call and unaffected.

_Spans:_ `packages/suite/src/components/wallet/TransactionItem/TransactionItem.tsx:103 (and packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:86)`

### E. suite-common (other packages)

#### 22. `prepareDateTimeFormatter (format callback)` — `suite-common/formatters/src/formatters/prepareDateTimeFormatter.ts:16` (+9)

`O(rendered rows) Intl.DateTimeFormat constructions + O(rendered rows) options-object allocations` · **hot** path · rule: _other-quadratic_

```ts
return new Intl.DateTimeFormat(undefined, options).format(value);
```

**n grows because** `makeFormatter` (suite-common/formatters/src/makeFormatter.tsx) does not memoize anything: it just wraps the raw callback, so every `.format()` call and every `<DateTimeFormatter>` render runs the body verbatim. The concrete caller is `suite-native/transactions/src/components/TransactionListItemContainer.tsx:195` (`{DateTimeFormatter.format(transactionBlockTime)}`), which is the per-row container of the mobile transaction SectionList — so one `new Intl.DateTimeFormat` per transaction row, re-paid on every scroll-driven re-render. `prepareDateFormatter.ts:12` has the identical defect and is called per row from `suite-native/module-send/src/components/CoinControl/UtxoCard.tsx:159` (per UTXO) and `suite-native/module-activity-center/src/components/notifications/TransactionNotificationItem.tsx:133` (per notification). On Hermes/RN, Intl construction is materially more expensive than on V8, and the fresh `options` object also defeats any engine-side internal cache.

**Fix.** Cache the constructed formatters. `config.is24HourFormat` has two values and the locale is the ambient default, so a module-level `Map` keyed on `is24HourFormat` suffices: `ts const dateTimeFormatters = new Map<boolean, Intl.DateTimeFormat>(); const getDateTimeFormatter = (is24HourFormat: boolean) => {     let formatter = dateTimeFormatters.get(is24HourFormat);     if (!formatter) {         formatter = new Intl.DateTimeFormat(undefined, {             ...dateFormatterOptions, hour: '2-digit', minute: '2-digit', hour12: !is24HourFormat,         });         dateTimeFormatters.set(is24HourFormat, formatter);     }      return formatter; }; ` Apply the same to `prepareDateFormatter.ts:12`, where `dateFormatterOptions` is already a module constant so a single hoisted instance is enough.

> **Issue notes.** Prefer the simpler fix over the proposed module-level boolean Map: `prepareDateTimeFormatter(config)` is already called once per FormatterConfig, so build the formatter in the prepare function's body — above the makeFormatter callback — and just call `.format(value)` inside. That closes over `config.is24HourFormat` correctly with no cache key and no stale-config risk, and prepareDateFormatter.ts:12 needs only a single module-level instance since its options are already the module constant `dateFormatterOptions`. Caveat against a module-level cache: the locale argument is `undefined` (ambient host locale), so a process-global cache would survive a runtime locale change on Android/iOS; a per-prepare closure is re-created when the formatter provider re-runs and avoids that. `if (!value) return null;` at line 7 must stay before the format call.

_Spans:_ `suite-native/transactions/src/components/TransactionListItemContainer.tsx:195`

#### 23. `selectSuiteSyncOutputLabel` — `suite-common/suite-sync/src/data/output/suiteSyncOutputSelectors.ts:56` (+53,54,17)

`O(rendered rows x output labels), where an O(1) dictionary read already exists` · **hot** path · rule: _index-before-iterate_

```ts
return outputs.find(output => output.id === id)?.label ?? null;
```

**n grows because** suiteSyncDataReducer.ts:15 stores the labels as `outputs: Record<SuiteSyncOutput['id'], SuiteSyncOutput>` — keyed by exactly the id this selector searches for. selectAllOutputsForWallet (suiteSyncWalletSelectors.ts:53) flattens that dictionary to an array with typedObjectValues, and the selector then linearly scans it for a key the dictionary already indexes. It is called once per row: suite-native/transactions/src/components/TransactionOutputLabel.tsx:23 per transaction output row and suite-native/module-send/src/components/CoinControl/UtxoCoinControlLabel.tsx:40 per UTXO row. n grows with every label the user creates and is loaded in bulk by the BIP-329 import path (suite-common/bip329/src/suiteSync/createBip329ToSuiteSync.ts), which can insert a whole label backup at once. The weakMapMemoize cache is keyed on the `outputs` array identity, so the full rows x labels cost is repaid on first list paint and again after every label edit or sync push.

**Fix.** Select the dictionary instead of the flattened array and read the key directly. Add a `selectOutputsRecordForWallet` (returning `selectWalletById(state, walletDescriptor)?.outputs`) and make the combiner `(outputsById, txId, txOutputId) => outputsById?.[createSuiteSyncOutputId(txId, txOutputId)]?.label ?? null`.

> **Issue notes.** Confirmed row-level callers: suite-native/transactions/src/components/TransactionOutputLabel.tsx:23, TransactionOutputLabelEditable.tsx:42, and suite-native/module-send/src/components/CoinControl/UtxoCoinControlLabel.tsx:40 (the UTXO coin-control list is the longest of the three). Also reached non-visually via createSuiteSyncWriteLabels.ts:37 as getOutputLabel. Memoization detail the writer should keep accurate: createWeakMapSelector (weakMapMemoize) caches per distinct argument tuple, so the rows x labels cost is paid on first list paint and again after every label edit / sync push that replaces the `outputs` object identity — it is not repaid on every re-render. Fix: add a `selectOutputsRecordForWallet` returning `selectWalletById(state, walletDescriptor)?.outputs ?? null` (selectWalletById already exists at suiteSyncWalletSelectors.ts:14 and returns `WalletData | null`) and make the combiner `(outputsById, txId, txOutputId) => outputsById?.[createSuiteSyncOutputId(txId, txOutputId)]?.label ?? null`. Semantics are identical because the Record key IS the id. TypeScript note: with noUncheckedIndexedAccess the indexed read is already `| undefined`, so `?.label ?? null` type-checks without a cast. Do NOT change selectAllOutputsForWallet itself — selectSuiteSyncOutputLabelsByAccount (:14-36) and selectSuiteSyncOutputLabels (:60) still legitimately need the array form, and returnStableArrayIfEmpty there guards referential stability for React.

_Spans:_ `suite-native/transactions/src/components/TransactionOutputLabel.tsx:23`

### F. suite-native (mobile)

#### 24. `useStablecoinYieldListData (listData useMemo)` — `suite-native/module-earn/src/hooks/useStablecoinYieldListData.ts:111` (+115, 143)

`O(100 vaults x accounts x tokensPerAccount) contract normalisations` · **hot** path · rule: _index-before-iterate_

```ts
const accountsWithPosition = receiptTokenContract;
```

**n grows because** The `for (const vault of yieldOpportunities)` at line 88 re-scans the ENTIRE account list per vault, and `hasPositiveContractTokenBalance` (suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:55) re-scans that account's whole token array, normalising each contract through `getContractAddressForNetworkSymbol` (a `.toLowerCase()` allocation per token) and building `new BigNumber(token.balance)` on every match. Nothing inside the filter depends on the vault except `network.symbol` and `receiptTokenContract`. With 100 vaults x 30 accounts x 100 tokens that is 300k normalisations per recomputation. Line 143 repeats the pattern: `account.tokens?.find(token => token.contract.toLowerCase() === outputTokenAddress)` re-scans the same token array a second time for every (vault, account) pair.

**Fix.** Index once above the vault loop. Build `accountsBySymbol = Map<NetworkSymbol, Account[]>` from `accounts`, and for each account a `Map<normalizedContract, TokenInfo>` (key with the existing `getContractAddressForNetworkSymbol` helper, computed once per token instead of once per vault-token pair). Then the body becomes `accountsBySymbol.get(network.symbol) ?? []` filtered by an O(1) `tokensByContract.get(receiptTokenContract)` lookup, and line 143's `.find()` becomes the same `Map.get`.

> **Issue notes.** BigNumber is NOT allocated per token — `isAccountTokenContractMatch(...) && new BigNumber(...)` short-circuits, so it is built only on a contract match; do not repeat that claim in the issue. The fix must key the token map with `getContractAddressForNetworkSymbol(account.symbol, token.contract)`, not a bare `.toLowerCase()` — the helper is symbol-aware (tokenUtils.ts:20) and Cardano policy-id handling depends on it. Building the index inside the same useMemo (above the vault loop) keeps React Compiler out of it; no new hook needed. `accountsWithPosition` currently also filters on `account.symbol === network.symbol`, so an `accountsBySymbol` Map must preserve the original account order to keep the resulting `activeItems` order stable before the two sorts at 171-176. Companion file: suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:56 (hasPositiveContractTokenBalance) and :21 (getAccountTokenByContract) share the same scan.

_Spans:_ `suite-native/module-earn/src/utils/contractTokenBalanceUtils.ts:55`

#### 25. `NetworkTransactionDetailSummary` — `suite-native/transactions/src/utils.ts:52` (+71)

`O(n^2) ts-belt caml_equal deep-equality compares (uniqBy inside A.difference) + O(n*m) for A.intersection, per inputs and again per outputs` · **warm** path · rule: _other-quadratic_

```ts
            A.intersection(addresses, targetAddresses),
```

**n grows because** Both useSelector calls end in sortTargetAddressesToBeginning (suite-native/transactions/src/utils.ts:52-53), which calls ts-belt's A.intersection and A.difference. A.difference is implemented as `reject(uniqBy(xs, identity), v => includes(ys, v))` and ts-belt's `_uniqBy` is a nested while/someU loop -> O(n^2), where every comparison is `caml_equal`, a recursive ReScript structural compare that runs two for-in passes with hasOwnProperty over each 4-field object (node_modules/@mobily/ts-belt/dist/cjs/Array/index.js:1644 and :402). A.intersection adds another O(n*m) + uniqBy. n is whatever blockbook returned for the tx and is stored verbatim: a Bitcoin consolidation the user made, or an exchange batch payout they received, routinely carries several hundred to a few thousand vin/vout. Entry point: opening any transaction from the TransactionList (TransactionDetailScreen -> NetworkTransactionDetailSummary). Note the UI only ever displays `targetAddresses.slice(0, 2)` (TransactionDetailAddressesSection.tsx:70), so the whole quadratic pass is spent ordering rows that are then thrown away.

**Fix.** Replace the ts-belt set ops with a Set keyed on the same fields the structural compare uses, so semantics are unchanged and cost drops to O(n+m): const key = (a: VinVoutAddress) => `${a.address}|${a.outputIndex}|${a.isChangeAddress}|${a.txTargetId}`; export const sortTargetAddressesToBeginning = (addresses, targetAddresses) => { const targetKeys = new Set(targetAddresses.map(key)); const [inTargets, rest] = arrayPartition(addresses, a => targetKeys.has(key(a))); return [...inTargets, ...rest]; }; (The current code also de-duplicates via uniqBy inside difference but not inside the intersection branch, which is inconsistent; if de-duplication is actually wanted, do it once with a Set of keys.)

> **Issue notes.** Downgraded P1 -> P2: it is a selector on a render path, but the screen is opened per-transaction by the user, not a per-frame/per-notification path, and the large-n case (hundreds-to-thousands of vin/vout) is real but not the common transaction. Behaviour deltas the fix must preserve: (1) A.intersection picks the LONGER of the two arrays as the filter base (`match = xs.length > ys.length ? [xs, ys] : [ys, xs]`, index.js:1976), so when targetAddresses is longer than addresses the current result is ordered by targetAddresses, not by addresses — a Set/partition fix always keeps `addresses` order; (2) both A.intersection and A.difference run uniqBy, so today duplicates are collapsed in BOTH halves — the proposed arrayPartition fix drops that dedup entirely, so either keep a seen-Set or state the delta explicitly. Objects are re-allocated per selector run, so a Set of object identities cannot work; key on `${address}|${outputIndex}|${isChangeAddress}|${txTargetId}` as proposed. Companion edit: A/F/pipe imports in utils.ts stay used elsewhere (mapTransactionInputsOutputsToAddresses), but A.concat/A.intersection/A.difference become unused — no import change needed since it is a namespace import. Confirmed the consumer only shows targetAddresses.slice(0, 2) (TransactionDetailAddressesSection.tsx:72), with a show-more sheet behind it.

_Spans:_ `suite-native/transactions/src/utils.ts:52`

### G. blockchain-link + networks (backend transforms)

#### 26. `transformTokenInfo` — `packages/blockchain-link-utils/src/blockbook.ts:396` (+399)

`O(tokens^2) array copies` · **hot** path · rule: _reduce-accumulator_

```ts
const info = tokens.reduce((arr, token) => {
    if (token.type === 'XPUBAddress') return arr;

    return arr.concat([
        { ...token, decimals: token.decimals || DEFAULT_TOKEN_DECIMALS, standard: token.standard },
    ]);
}, [] as TokenInfo[]);
```

**n grows because** `arr.concat([x])` allocates a fresh array containing everything accumulated so far on each iteration, so building the list copies 1+2+...+n elements. n is the token list blockbook returns for an EVM account, which includes every airdrop/spam token ever sent to the address — routinely hundreds, and thousands on an old ETH/BSC/Polygon address. Entry point: `transformAccountInfo` at blockbook.ts:471, i.e. every `getAccountInfo` response handled by the blockchain-link blockbook worker.

**Fix.** Replace the reduce with a filter+map (no accumulator copying): `tokens.filter(t => t.type !== 'XPUBAddress').map(token => ({ ...token, decimals: token.decimals || DEFAULT_TOKEN_DECIMALS, standard: token.standard }))`. If the reduce shape must be kept, mutate the accumulator the reduce already owns: `arr.push({...}); return arr;`.

> **Issue notes.** Fix is filter+map or `arr.push(...); return arr;`. TypeScript caveat: the current reduce is typed via `[] as TokenInfo[]`; a `tokens.filter(t => t.type !== 'XPUBAddress')` does NOT narrow the union, so the `.map` callback will still see the wide element type — either keep the explicit `TokenInfo[]` annotation on the result or use a type-guard predicate. Behaviour is otherwise identical (order preserved, same object shape). `transformAddresses` in the same file (:415) has the identical shape and both are called from the same place, so they should be fixed in one change. Worker-thread path, not the UI main thread — that is why P2 rather than P1.

_Spans:_ `packages/blockchain-link-utils/src/blockbook.ts:471`

#### 27. `transformAddresses (and transformTokenInfo)` — `packages/blockchain-link-utils/src/blockbook.ts:415` (+418, 396, 399)

`O(addresses^2) allocations` · **warm** path · rule: _reduce-accumulator_

```ts
const addresses = tokens.reduce((arr, t) => {
    if (t.type !== 'XPUBAddress') return arr;

    return arr.concat([
        { address: t.name, path: t.path, ... },
    ]);
}, [] as Address[]);
```

**n grows because** `arr.concat([...])` allocates a brand-new array containing everything accumulated so far on every kept element, so building an n-element result copies n(n+1)/2 elements. transformAddresses is called from transformAccountInfo (:470) on every GET_ACCOUNT_INFO response from the blockbook worker (workers/blockbook/index.ts:61) — i.e. on every account discovery and every account refresh. The address list grows one change address per outgoing transaction plus the used receive addresses, so accounts with thousands of addresses are ordinary; at 3,000 addresses that is ~4.5e6 element copies and 3,000 dead intermediate arrays per response. transformTokenInfo at :396 has the identical shape over an EVM account's token list (airdrop-spammed addresses hold hundreds).

**Fix.** Mutate the accumulator the reduce already owns, or just use a plain loop / filter+map: `const addresses = tokens.filter(t => t.type === 'XPUBAddress').map(t => ({ address: t.name, ... }));`. Same for transformTokenInfo at :396: `tokens.filter(t => t.type !== 'XPUBAddress').map(token => ({ ...token, decimals: token.decimals || DEFAULT_TOKEN_DECIMALS, standard: token.standard }))`.

> **Issue notes.** Overlaps the already-filed blockbook.ts:431,432 — same function, so both should land in one PR; :432's `!internal.includes(a)` is itself O(addresses^2) and the natural rewrite (`external = addresses.filter(a => a.path.split('/')[4] !== '1')`) removes it at the same time. TypeScript gotcha: the `[] as Address[]` seed exists to widen the accumulator, and `t.type === 'XPUBAddress'` does NOT narrow the element type in a plain `.filter()` without a type predicate — so a naive filter+map will not typecheck against `Address`; use an explicit loop with push, a type-predicate filter, or `.flatMap(t => t.type === 'XPUBAddress' ? [{...}] : [])`. Same narrowing issue for transformTokenInfo at :396. Order is preserved by all variants, and the `addresses.length < 1 -> undefined` and `info.length > 0` sentinels must be kept.

#### 28. `filterTokenTransfers` — `packages/blockchain-link-utils/src/blockfrost.ts:167` (+173, 174, 175, 176, 177, 181, 205)

`O(outputs x assetsPerOutput x ((inputs + outputs) x accountAddresses))` · **hot** path · rule: _index-before-iterate_

```ts
tx.txUtxos.outputs.forEach(output => {
    output.amount.filter(a => a.unit !== 'lovelace').forEach(asset => {
        const inputs = transformInputOutput(tx.txUtxos.inputs, tokenUnit);
        const outputs = transformInputOutput(tx.txUtxos.outputs, tokenUnit);
        const outgoing = filterTargets(myAddresses, inputs);
        const incoming = filterTargets(myAddresses, outputs);
        const isChange = accountAddress.change.find(a => a.address === output.address);
```

**n grows because** For each (output, non-lovelace asset) pair the body rebuilds BOTH full transformed input and output lists, then runs filterTargets twice — and each filterTargets re-maps the whole myAddresses array to strings and then does `addresses.includes(a)` per UTXO (utils.ts:8). Nothing inside depends on `output` except `isChange` and `incomingForOutput`. On top of that :177 linearly scans change addresses and :205 does a nested find-inside-find over all inputs. The caller is transformTransaction (:316), invoked for every transaction of an account page by transformAccountInfo (:356) and per notification by the blockfrost worker's onTransaction (packages/blockchain-link/src/workers/blockfrost/index.ts:143). A multi-asset Cardano tx with 50 outputs carrying 5 assets each against an account with 500 addresses is ~2.5e7 comparisons plus ~500 throwaway array allocations, per transaction.

**Fix.** Above the forEach build `const myAddressSet = new Set(myAddresses.map(a => a.address))`, `const changeAddressSet = new Set(accountAddress.change.map(a => a.address))` and a `Map<unit, {inputs, outputs}>` computed once per distinct asset unit in the transaction (collect the distinct units first). Replace :177 with `changeAddressSet.has(output.address)` and :205 with a precomputed `Map<unit, senderAddress>` built in one pass over tx.txUtxos.inputs.

> **Issue notes.** Two traps in the rewrite. (1) `if (incoming.length === 0 && outgoing.length === 0) return null;` at :179 is a `return` inside a forEach callback — a no-op continue, not a filter (which also makes the `.filter(isNotNullOrUndefined)` at :212 effectively dead for it). Preserve continue semantics; do not convert the forEach to a map. (2) Caching inputs/outputs must be keyed on `asset.unit`: transformInputOutput defaults `value` to '0' when the unit is absent, so the arrays are per-unit and cannot be shared across units. `isChange` at :177 is only a truthiness test, so a Set `.has` is safe. `from` at :203-205 takes the FIRST input carrying the unit — any precomputed Map<unit, address> must be first-wins or the `from` field changes.

_Spans:_ `packages/blockchain-link/src/workers/blockfrost/index.ts:143`

#### 29. `filterTokenTransfers` — `packages/blockchain-link-utils/src/blockfrost.ts:173` (+174,175,176,177,181)

`O(outputs x assetsPerOutput x ((vin+vout) x accountAddresses + changeAddresses)) per transaction` · **hot** path · rule: _index-before-iterate_

```ts
const inputs = transformInputOutput(tx.txUtxos.inputs, tokenUnit);
```

**n grows because** Everything inside the inner forEach except `tokenUnit` is derived from the transaction, not from the (output, asset) pair being visited, yet it is all recomputed per pair: two full transformInputOutput rebuilds of the tx's inputs and outputs, two filterTargets calls (each of which re-maps the entire address list to strings and then does an O(addresses) `.includes` per vin/vout — see utils.ts:8), and a linear `.find` over every change address. transformTransaction calls this for every transaction, and transformAccountInfo maps it over the whole history page (blockfrost.ts:356). Cardano token/NFT transactions commonly carry dozens of assets across several outputs, and a used Cardano account accumulates hundreds of addresses.

**Fix.** Hoist per-transaction work above the loops: build `myAddressSet`/`changeAddressSet` once, and cache transformInputOutput results per `tokenUnit` in a Map (or restructure to iterate assets once and index outputs by address). Replace `accountAddress.change.find(...)` with a Set lookup on the change addresses.

> **Issue notes.** Cardano-only, inside the blockfrost worker — colder than blockbook, hence P2 not P1. Note `outgoing`/`incoming` (175,176) feed ONLY the `if (incoming.length === 0 && outgoing.length === 0) return null;` early-out at 179, so the cheapest correct fix is not caching transformInputOutput but replacing that emptiness test with a per-transaction precomputed 'does this tx touch my addresses for unit X' check — behaviourally identical because the current test ignores array contents. `myAddresses`/`myNonChangeAddresses` are already hoisted at 165-166; only Set-ification and the change-address index are missing. Watch the `return null` statements inside the forEach callbacks (179,196): they are `continue`, not a value, so any restructure into map/flatMap must preserve that, and the function's contract is push-order into `transfers`. `accountAddress.change.find(...)` is only used as a boolean (`isChange`, lines 188/191), so a Set<string> of change addresses is a drop-in.

_Spans:_ `packages/blockchain-link-utils/src/blockfrost.ts:356`

#### 30. `transformTransaction` — `packages/blockchain-link-utils/src/blockfrost.ts:258` (+259, 272, 302)

`O(outputs x changeAddresses) at :258, O(outputs^2) at :272/:302` · **hot** path · rule: _index-before-iterate_

```ts
const allOutputsAreChange =
    fullData &&
    blockfrostTxData.txUtxos.outputs.every(o =>
        accountAddress?.change.some(c => c.address === o.address),
    );
// :272 and :302 -> targets = outputs.filter(o => !internal.includes(o));
```

**n grows because** `.some()` over the change list is nested inside `.every()` over the outputs, and `internal.includes(o)` is nested inside `outputs.filter(...)` — neither inner collection depends on the callback parameter beyond a single field comparison. transformTransaction runs for every transaction of an account page via transformAccountInfo (:356) and per notification via the blockfrost worker's onTransaction (packages/blockchain-link/src/workers/blockfrost/index.ts:143). Cardano accounts accumulate change addresses without bound and multi-output transactions are common, so both factors are set by upstream data.

**Fix.** Build the lookups once above the branches: `const changeAddressSet = new Set(accountAddress?.change.map(c => c.address) ?? []);` then `outputs.every(o => changeAddressSet.has(o.address))`, and `const internalSet = new Set(internal);` then `outputs.filter(o => !internalSet.has(o))` at both :272 and :302.

> **Issue notes.** `accountAddress` is optional (the descriptor branch leaves it undefined), and `accountAddress?.change.some(...)` currently yields false for every output in that case; `new Set(accountAddress?.change.map(c => c.address) ?? [])` reproduces this exactly, including the edge case where `outputs` is empty and `.every` returns true both before and after. `internal` holds references out of `outputs`, so `new Set(internal)` + `.has(o)` is identity-equivalent to `.includes(o)` — hoist it once and reuse at both :272 and :302 rather than building it twice. allOutputsAreChange is typed `boolean | undefined` via the `fullData &&` short-circuit and getSubtype's signature expects that; do not coerce to a plain boolean.

_Spans:_ `packages/blockchain-link/src/workers/blockfrost/index.ts:143`

#### 31. `getTokens / getUiType` — `packages/blockchain-link-utils/src/solana.ts:634` (+638, 640, 669, 678)

`O(instructions x tokenAccounts) scans plus one full array allocation per instruction` · **warm** path · rule: _index-before-iterate_

```ts
const getUiType = ({ parsed }: TokenTransferInstruction) => {
    const accountAddresses = [
        ...tokenAccountsInfos.map(({ address }) => address),
        accountAddress,
    ];
    const isAccountDestination = accountAddresses.includes(parsed.info.destination);
```

**n grows because** getUiType is called from inside `.map()` at :702, so the entire token-account address array is re-allocated and re-scanned for every token-transfer instruction; the filter at :669 and the lookup at :678 likewise scan tokenAccountsInfos once per instruction. tokenAccountsInfos comes from the worker at packages/blockchain-link/src/workers/solana/index.ts:304, which maps ALL accounts returned by getTokenAccountsByOwner across every token program — unfiltered, so airdrop-spammed Solana addresses carry hundreds to thousands of entries. A DeFi transaction expands to dozens of inner instructions, and transformTransaction runs over every transaction of the requested page. (The same array is also re-walked per token account at :717-722, where each entry does a full accountKeys.findIndex via extractAccountBalanceDiff.)

**Fix.** Hoist the invariant above the instruction loop: `const accountAddressSet = new Set([...tokenAccountsInfos.map(t => t.address), accountAddress]);` and build `const tokenAccountByAddress = new Map(tokenAccountsInfos.map(t => [t.address, t]));` once. matchTokenAccountInfo then becomes three Map lookups on parsed.info.source/destination/authority instead of a scan, and getUiType two Set lookups with no allocation.

> **Issue notes.** getTokens is called once per transaction from solana.ts:829 inside transformTransaction and the page size is small (payload.pageSize default 5, index.ts:297), so the outer multiplier is modest — the value here is killing the per-instruction allocation, not an asymptotic collapse. Behaviour caveat on the Map rewrite: matchTokenAccountInfo matches an address against source OR destination OR authority, and the `.find` at :678 returns the FIRST tokenAccountsInfos entry in array order — a `Map<address, info>` keyed by token-account address changes tie-breaking when more than one of source/destination/authority is an owned token account (self-transfers between two owned token accounts). If that matters, look up source, then destination, then authority in that priority and verify against the solana fixtures in packages/blockchain-link/tests/unit. The getUiType Set has no such hazard: hoist `const accountAddressSet = new Set([...tokenAccountsInfos.map(t => t.address), accountAddress])` above the instruction pipeline and keep the two `.has()` calls in the same order.

_Spans:_ `packages/blockchain-link/src/workers/solana/index.ts:304`

#### 32. `isAccountOwned (used by filterTargets and enhanceVinVout)` — `packages/blockchain-link-utils/src/utils.ts:8` (+26, 33)

`O((vin + vout) x accountAddresses) per transaction, x5 per transformTransaction` · **hot** path · rule: _index-before-iterate_

```ts
export const isAccountOwned = (addresses: string[]) => (vinVout: VinVout) =>
    Array.isArray(vinVout?.addresses) && vinVout.addresses.some(a => addresses.includes(a));
```

**n grows because** `addresses.includes(a)` is a linear array scan run inside `.some()` inside `targets.filter()` (:26) and inside `inputs.map(enhanceVinVout(...))` / `outputs.map(enhanceVinVout(...))` (:33, called from blockbook.ts:383-384 and blockfrost.ts:337-338). Per transaction blockbook's transformTransaction pays this five times (filterTargets at blockbook.ts:227, :232, :239 plus the two enhanceVinVout maps), and transformAccountInfo (blockbook.ts:484) runs transformTransaction over every transaction of the page while the blockbook/electrum workers run it per notification. Both factors grow with the account: a heavily used account has thousands of derived addresses and consolidation transactions have hundreds of inputs. filterTargets additionally re-materialises the mapped string array on every call (:17-24).

**Fix.** Change the helper to take a `Set<string>`: `export const isAccountOwned = (addresses: ReadonlySet<string>) => (vinVout: VinVout) => vinVout?.addresses?.some(a => addresses.has(a)) ?? false;`. Build the Set once at the top of blockbook.ts/blockfrost.ts transformTransaction (where myAddresses is already computed) and pass it to filterTargets and enhanceVinVout instead of re-deriving it per call.

> **Issue notes.** Anchor detail: the declaration begins at line 7; line 8 holds the `addresses.includes(a)` half — either reads fine. IMPORTANT fix caveat: changing only isAccountOwned to take a Set is NOT a win, because filterTargets would then build a fresh Set per call — the same allocation it does today. The win requires the Set to be built ONCE in blockbook/blockfrost transformTransaction where `myAddresses` is already computed (blockbook.ts:220-222, blockfrost.ts ~230) and threaded through filterTargets/enhanceVinVout, i.e. filterTargets' `Addresses` union must gain a Set case or a new Set-based helper must be added. Companion edit: packages/blockchain-link-utils/src/utils.test.ts:9 calls `filterTargets(f.addresses, f.targets)` with fixture data. Do not drop the `Array.isArray(vinVout?.addresses)` guard — VinVout.addresses is optional and coinbase vins arrive without it. Overlaps blockbook.ts:238: fixing this reduces that one from O(vout^2 x C) to O(vout^2), so sequence or merge them.

_Spans:_ `packages/blockchain-link-utils/src/blockbook.ts:383`

#### 33. `getAccountInfo / extendAddressInfo + sumAddressValues` — `packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts:158` (+61, 69, 159, 181, 182, 183)

`O((used + change addresses with transfers > 0) x transactions x (vin + vout))` · **warm** path · rule: _other-quadratic_

```ts
sent: sumAddressValues(transactions, address, tx => tx.details.vin).toString(),
received: sumAddressValues(
    transactions,
    address,
    tx => tx.details.vout,
).toString(),
```

**n grows because** extendAddressInfo is mapped over addresses.change, addresses.unused and addresses.used at :181-183, and each invocation calls sumAddressValues TWICE; each sumAddressValues flatMaps over every transaction and every vin/vout doing `addresses?.includes(address)` (:69). The caller that makes both factors large is the electrum worker's GET_ACCOUNT_INFO with details 'txs'/'txids'/'tokenBalances' (workers/electrum/index.ts:70), which is issued on every account load/refresh for users on their own node or Tor. An account with 2,000 addresses and 5,000 transactions averaging 8 vin+vout performs ~8e7 membership tests, all inside the worker's single thread, before the account can render.

**Fix.** Replace the per-address rescans with one pass over `transactions` that accumulates into a Map: iterate each tx's details.vin/details.vout once, and for every address listed on a vin/vout add the parsed value into `sums.get(addr)`. Then extendAddressInfo becomes two O(1) Map reads. Same total information, O(transactions x (vin+vout)) instead of multiplying by the address count.

> **Issue notes.** sumAddressValues is exported from this module; grep shows no other importer, so replacing it wholesale is safe. Behaviour delta to preserve in a single-pass rewrite: values are parsed with Number.parseFloat and summed as JS numbers (lossy for large satoshi values) — keep the same arithmetic or the reported sent/received strings change and fixtures break. The vin/vout entries read are `tx.details.vin` / `tx.details.vout` of the ALREADY transformed transactions, so the pre-pass must run after the transactions array is built (:143-147), not on raw electrum data. Note this file dedups `history` via a Map at :121, which the sibling getAccountBalanceHistory does not — relevant to the transaction.ts finding.

_Spans:_ `packages/blockchain-link/src/workers/electrum/index.ts:70`

#### 34. `createAddressManager / getInfo` — `packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:81` (+84, 86)

`O(subscribedAddresses + accounts x addressesPerAccount) allocations and scans per notification` · **hot** path · rule: _index-before-iterate_

```ts
const [address, _sh] =
    Object.entries(subscribedAddrs).find(([_addr, sh]) => sh === scripthash) || [];
if (!address) return { descriptor: scripthash };
const [account, addresses] =
    Object.entries(subscribedAccs).find(
        ([_acc, { change, unused, used }]) =>
            !!change.concat(used, unused).find(ad => ad.address === address),
```

**n grows because** getInfo is called once per electrum scripthash-status notification from txListener.onTransaction (workers/electrum/listeners/txListener.ts:40) — i.e. for every new block or mempool event touching any subscribed address. Line 81 materialises an entries array of the entire address map just to do a reverse scripthash->address lookup, and lines 84-86 then allocate a fresh concatenated array of ALL of an account's addresses inside the find callback, for every account, and scan it linearly. With 20 accounts x 500 addresses that is ~10,000 element allocations plus two full scans on every single notification; during initial sync notifications arrive in bursts of hundreds. This is separate from the :25 and :49 reduce-spread issues already filed.

**Fix.** Maintain reverse indexes alongside subscribedAddrs/subscribedAccs: a `Map<scripthash, address>` populated in addAddresses (and pruned in removeAddresses) and a `Map<address, descriptor>` populated in addAccounts (pruned in removeAccounts). getInfo then becomes two O(1) Map lookups with no allocation.

> **Issue notes.** The proposed fix is a module-level refactor, not a hoist: a scripthash->address Map must be populated in addAddresses (:21-33) and pruned in removeAddresses (:35-43), and an address->descriptor Map populated in addAccounts (:45-59) and pruned in removeAccounts (:61-73); both removers use objectPartition and return the removed values, so the indexes must be kept in sync or getInfo resolves stale descriptors after unsubscribe. Cheaper interim fix with no state to maintain: replace `change.concat(used, unused).find(...)` with three `.some(ad => ad.address === address)` calls, removing the allocation while keeping the scan. Contract to preserve: when no address matches, getInfo returns `{ descriptor: scripthash }` and txListener.ts:41-44 treats that sentinel as 'internal subscription, ignore'.

_Spans:_ `packages/blockchain-link/src/workers/electrum/listeners/txListener.ts:40`

#### 35. `getTransactions` — `packages/blockchain-link/src/workers/electrum/utils/transaction.ts:103` (+115)

`O(historyEntries^2) at :103 and O(totalVins^2) at :115` · **warm** path · rule: _other-quadratic_

```ts
const txids = history.map(({ tx_hash }) => tx_hash).filter(arrayDistinct);
// ...
Object.values(origTxs)
    .flatMap(({ vin }) => vin.filter(isNotCoinbase).map(({ txid }) => txid))
    .filter(arrayDistinct);
```

**n grows because** `arrayDistinct` is `(item, index, self) => self.indexOf(item) === index` (packages/utils/src/arrayDistinct.ts:4), so each `.filter(arrayDistinct)` is a full linear scan per element. getTransactions is fed the complete, unpaginated account history by getAccountInfo (methods/getAccountInfo.ts:143) and by getAccountBalanceHistory (methods/getAccountBalanceHistory.ts:110-116, where the histories of all receive+change addresses are concatenated WITHOUT deduplication first, so n is inflated by the address count). For an account with 5,000 transactions touching several addresses each, n is 10,000+ at :103 (1e8 string compares) and ~15,000 at :115 (2.25e8).

**Fix.** Use a Set: `const txids = [...new Set(history.map(({ tx_hash }) => tx_hash))];` and likewise wrap the flatMap at :113-115 in `new Set(...)` before the `!origTxs[txid]` filter. O(n) instead of O(n^2), identical output order.

> **Issue notes.** `[...new Set(...)]` preserves first-insertion order, identical to `filter(arrayDistinct)` — no ordering delta, and the downstream arrayToDictionary does not care. Coordination warning: arrayToDictionary is called on the very next lines (:110 and :118) and packages/utils/src/arrayToDictionary.ts:32 is already filed under #28886 — same function body, so both should land in one PR. arrayDistinct is also used at addressManager.ts:22 if a repo-wide sweep of the helper is preferred over a local fix.

_Spans:_ `packages/blockchain-link/src/workers/electrum/methods/getAccountBalanceHistory.ts:110`

### H. coinjoin + utxo-lib

#### 36. `CoinjoinMempoolController.update` — `packages/coinjoin/src/backend/CoinjoinMempoolController.ts:188` (+186, 187)

`O(m x |keepTxids|) ~ O(m^2), m = this.mempool.size` · **warm** path · rule: _index-before-iterate_

```ts
            txid => !keepTxids.includes(txid),
```

**n grows because** `this.mempool` is fed by `onTransactionAdd`, which is subscribed to blockbook's `subscribeNewTransaction` (packages/blockchain-link/src/workers/blockbook/websocket.ts:197) — the entire Bitcoin mempool firehose — and retains any tx with at least one taproot address (`CoinjoinBackend.ts:46` passes `filter: address => isTaprootAddress(...)`), which today is a large share of all traffic. Between purges (`MEMPOOL_PURGE_CYCLE = 10 * 60 * 1000`) the map accumulates thousands of entries. Since `keepTxids` is derived by filtering against that same map, `keepTxids.length` approaches `mempool.size`, making the `.includes` scan inside the `.filter` exactly quadratic: 10k entries is ~100M string comparisons, blocking the coinjoin backend thread. `update()` is called from `scanAccount.ts:91` on every account sync.

**Fix.** Key on the fresh txid list instead of re-scanning an array: `const liveTxids = new Set(mempoolTxids); const removeTxids = Array.from(this.mempool.keys()).filter(txid => !liveTxids.has(txid));`. `keepTxids` then becomes unnecessary and the whole purge is O(m).

> **Issue notes.** The proposed fix is exactly right and behaviour-preserving: `const liveTxids = new Set(mempoolTxids); const removeTxids = Array.from(this.mempool.keys()).filter(txid => !liveTxids.has(txid));`. Note that `keepTxids = mempoolTxids.filter(txid => this.mempool.has(txid))` is a pure subset of mempool keys, so `!keepTxids.includes(txid)` for a txid that IS a mempool key is equivalent to `!mempoolTxids.includes(txid)` — the Set-of-mempoolTxids form is identical, not merely close. `keepTxids` then has no other reader and should be deleted (it is referenced nowhere else in the file). Order of removeTxids is preserved (Map key insertion order), which matters because onTransactionRemove mutates this.addressTxids as it goes. Iterating `this.mempool.keys()` into an array before the forEach at line 190 is required and already done — do not switch to iterating the Map lazily, since onTxRemove deletes from it.

#### 37. `getAllTxAddresses / doesAnyAddressFulfill / doesTxContainAddress` — `packages/coinjoin/src/backend/backendUtils.ts:18` (+14, 23, 28, 29)

`O(k^2) per call, k = vin.length + vout.length of one transaction` · **hot** path · rule: _other-quadratic_

```ts
export const getAllTxAddresses = ({ vin, vout }: VinVoutAddressTx) =>
    vin
        .concat(vout)
        .flatMap(({ addresses = [] }) => addresses)
        .filter(arrayDistinct);
```

**n grows because** `arrayDistinct` is `self.indexOf(item) === index` (packages/utils/src/arrayDistinct.ts:4), i.e. a linear scan per element, so the dedup is O(k^2). The dedup result is then thrown away by the only thing `doesAnyAddressFulfill` does with it: `.some(addr => addr === address)` (line 23) — a membership test that cannot care about duplicates. This helper is the inner loop of the two hottest coinjoin backend paths: `getAccountInfo.ts:44` calls it once per (address, transaction) pair, and `scanAccount.ts:59` calls it once per (address, block-transaction) pair. It also runs for every single transaction pushed by the blockbook `subscribeNewTransaction` firehose via `CoinjoinMempoolController.onTransactionAdd` (line 58), i.e. on every new tx in the Bitcoin mempool while a coinjoin account is active.

**Fix.** Split the two use cases. For membership, short-circuit without materialising anything: `export const doesTxContainAddress = (address: string) => ({ vin, vout }: VinVoutAddressTx) => vin.some(v => v.addresses?.includes(address)) || vout.some(v => v.addresses?.includes(address));`. For the genuine "list the distinct addresses" callers (mempool controller), replace `.filter(arrayDistinct)` with `[...new Set(...)]` so dedup is O(k).

> **Issue notes.** The proposed split is safe but note the semantic detail: `doesTxContainAddress` currently returns true if the address appears anywhere in vin or vout; `vin.some(v => v.addresses?.includes(address)) || vout.some(...)` preserves that exactly, including the `addresses = []` default (optional chaining on undefined yields undefined -> falsy, same as the current `addresses = []` default). Genuine list-the-distinct-addresses callers that must KEEP dedup: CoinjoinMempoolController.ts:58 (onTransactionAdd — filteredAddresses is later used to build addressTxids, duplicates would push the same txid twice into a record) and :82 (onTransactionRemove). Swapping `.filter(arrayDistinct)` for `[...new Set(...)]` preserves first-occurrence order identically, so those two are safe. If doesAnyAddressFulfill loses its only caller, remove it and the now-unused `arrayDistinct` import at line 1 (it is imported in backendUtils.ts only for this). Also note CoinjoinMempoolController.ts:62 uses arrayDistinct on collidingTxids — separate, leave it or convert to Set in the same PR.

_Spans:_ `packages/coinjoin/src/backend/scanAccount.ts:59`

#### 38. `enhanceAddress (called from getAccountInfo)` — `packages/coinjoin/src/backend/getAccountInfo.ts:44` (+45, 46, 85, 86)

`O(A x T) calls to doesTxContainAddress, each O(k) (or O(k^2) until `backendUtils.ts:18` (#37) is fixed) — A = receive+change addresses, T = confirmed txs, k = vin+vout addresses of one tx` · **hot** path · rule: _index-before-iterate_

```ts
const txs = transactions.filter(tx => doesTxContainAddress(address)(tx.details));
const sent = sumAddressValues(txs, address, tx => tx.details.vin);
const received = sumAddressValues(txs, address, tx => tx.details.vout);
```

**n grows because** `enhanceAddress(txsConfirmed)` is mapped over EVERY derived address at lines 85-86, and for each address it re-walks the entire transaction array. Both dimensions grow with the account: `DISCOVERY_LOOKOUT_EXTENDED = 50` change addresses past the last used one, and each coinjoin round consumes up to `ROUND_SELECTION_MAX_OUTPUTS = 20` change addresses, so a few dozen rounds put the address count in the high hundreds; transactions are the full history (one tx per round plus normal history). Worse, the inner `doesTxContainAddress` -> `getAllTxAddresses` allocates concat+flatMap arrays and runs an O(k^2) `arrayDistinct` dedup for every (address, tx) pair, where k is the vin+vout address count of a WabiSabi coinjoin tx (hundreds). Entry points: `suite/coinjoin/src/coinjoinAccountActions.ts:499` (every account sync / new block) and `:366` `updatePendingAccountInfo` (after every completed round and every send-form broadcast), both via `CoinjoinBackend.getAccountInfo`.

**Fix.** Index once, above the address loop: walk `txsConfirmed` a single time building `Map<address, Transaction[]>` from each tx's vin/vout addresses (O(T x k)), then `enhanceAddress` becomes `const txs = byAddress.get(address) ?? []`. Same map can feed `sumAddressValues`, or fold the sent/received sums into the same single pass so vin/vout are visited once in total instead of once per address.

> **Issue notes.** Overlaps deliberately with #37 (`backendUtils.ts:18`): fixing that alone drops the k^2 factor and leaves O(A x T); fixing this one alone drops A x T and leaves O(T x k^2). Both are worth filing but they should cross-reference each other in the issue. Behaviour deltas to watch when indexing: (a) the current filter preserves `txsConfirmed` order, so build the Map by iterating txsConfirmed in order and pushing — do NOT build it from a Set keyed by tx object or the `transfers` count / sortTxsFromLatest-independent ordering can shift; (b) a tx that contains the same address in both vin and vout must be pushed ONCE per address (today the arrayDistinct dedup inside getAllTxAddresses guarantees a single match), so dedupe per-tx when inserting, otherwise `transfers: txs.length` double-counts and `sumAddressValues` is called twice on the same tx; (c) `sumAddressValues` comes from @trezor/blockchain-link and takes the tx array, so it can consume the map value unchanged. Companion: `doesTxContainAddress` import at line 6 becomes unused if the index replaces it entirely. Verified entry points: suite/coinjoin/src/coinjoinAccountActions.ts:366 (updatePendingAccountInfo, after each prepending tx / round) and :499 (inside fetchAndUpdateAccount, per sync).

_Spans:_ `packages/coinjoin/src/backend/backendUtils.ts:28`

#### 39. `scanAccount (addresses.analyze getTxs callback)` — `packages/coinjoin/src/backend/scanAccount.ts:59` (+58, 60, 61)

`O(A x B) doesTxContainAddress calls per matching block, each O(k) after `backendUtils.ts:18` (#37) is fixed (O(k^2) today) — A = derived addresses, B = block.txs.length` · **warm** path · rule: _index-before-iterate_

```ts
addresses.analyze(
    ({ address }) => block.txs.filter(doesTxContainAddress(address)),
    transactions => transactions.forEach(txs.add, txs),
);
```

**n grows because** `CoinjoinAddressController.analyzeType` (CoinjoinAddressController.ts:79-90) invokes the `getTxs` callback once per derived address, and the callback re-filters the entire `block.txs` array each time, paying the O(k^2) `getAllTxAddresses` dedup per (address, tx) pair. The block's transaction list is fixed for the duration of `analyze`, so the address->txs mapping is computable once. This runs for every block whose BIP158 filter matches — every block containing one of the account's coinjoin rounds, plus every filter false positive — during `CoinjoinBackend.scanAccount`, which suite drives from `suite/coinjoin/src/coinjoinAccountActions.ts` on discovery and on every subsequent sync.

**Fix.** Build the index once per matching block, before `analyze`: iterate `block.txs` and for each vin/vout address push the tx into `Map<string, BlockbookTransaction[]>`, then pass `({ address }) => txsByAddress.get(address) ?? []` as `getTxs`. One pass over the block replaces `addresses.length` passes.

> **Issue notes.** Non-obvious constraint on the fix: analyzeType MUTATES `derived` while iterating (line 87 pushes newly derived addresses), so addresses looked up in the index are not known before analyze starts. That is fine — a `Map<string, BlockbookTransaction[]>` built from block.txs covers any address, and `.get(address) ?? []` handles the newly derived ones that have no txs. Order must be preserved: iterate block.txs in order and push, because `transactions.forEach(txs.add, txs)` feeds a Set whose insertion order determines the order of `Array.from(txs, transformTx(addresses))` at line 64 and therefore the transactions handed to onProgress. Also dedupe per (tx, address) when building the map — today getAllTxAddresses's arrayDistinct means a tx matching an address in both vin and vout is returned once by the filter, and Set.add would mask a double push here but the per-address txs.length check at CoinjoinAddressController.ts:83 would not. Same PR should touch #37 (`backendUtils.ts:18`), since fixing that alone already removes the k^2 factor here.

_Spans:_ `packages/coinjoin/src/backend/CoinjoinAddressController.ts:79`

#### 40. `accumulative` — `packages/utxo-lib/src/coinselect/inputs/accumulative.ts:65` (+47, 57)

`O(n^2) time and O(n^2) allocated elements, n = candidate UTXO count` · **hot** path · rule: _other-quadratic_

```ts
inAccum = inAccum + utxoValue;
inputs.push(utxo);

const fee = getFee(inputs, outputs, feeRate, options);
```

**n grows because** `getFee` -> `transactionBytes` -> `transactionWeight` (coinselectUtils.ts:89-100) walks the whole `inputs` array on every call: `inputs.filter(i => SEGWIT_INPUT_SCRIPT_TYPES.includes(i.type))` allocates an array of size |inputs| and two `reduce`s traverse it. Because `inputs` grows by one per loop iteration, the loop pays sum(1..n). The file's own comment claims "worst-case: O(n)", which is wrong. The full-length loop is reached whenever the target is never covered — i.e. the very common "amount exceeds available balance" state the send form passes through on nearly every keystroke while a user types an amount. Entry point: `packages/connect/src/api/composeTransaction.ts:86` runs `compose(level.feePerUnit)` once per fee level (3-4) per `TrezorConnect.composeTransaction`, which suite's send form issues on every form change. UTXO counts run into the thousands for coinjoin accounts (each round mints many small outputs) and for long-lived receive-heavy accounts.

**Fix.** Make the fee incremental instead of recomputed. Track running `weight` (and the segwit-input count) as inputs are pushed — `weight += inputWeight(utxo)` — and compute the fee from the running total plus the fixed output/base weight, so each iteration is O(1). Alternatively pass a precomputed accumulator into `getFee`/`transactionWeight` rather than the whole array.

> **Issue notes.** Fix is more involved than the candidate implies — do not accept a naive 'track a running weight' patch without checking all three fee policies. transactionWeight also depends on `getVarIntSize(inputs.length)` and on `(segwitInputs ? 2 + (inputs.length - segwitInputs) : 0)`, both derivable from running counters (total weight, segwit-input count, input count), so the bitcoin path incrementalises cleanly. getZcashFee (coinselectUtils.ts:~213) additionally does `inputs.reduce((sum, i) => sum + inputBytes(i), 0)` — needs its own running accumulator. getDogeFee only reduces over OUTPUTS, which are loop-invariant here, so it is fine. Also beware `Math.ceil` placement: transactionBytes ceils the weight/4 for the whole tx, so a running BYTE total is NOT equivalent to ceil(running weight / 4) — accumulate WEIGHT and ceil once, or fees will drift by a satoshi and break the existing fixtures. Line 57 `getFee([...inputs, utxo], ...)` allocates a copy but runs at most once (only when i === utxos.length - 1), so leave it. branchAndBound (which anyOf runs first) has its own MAX_TRIES = 1000000 budget — unrelated, do not conflate.

_Spans:_ `packages/utxo-lib/src/coinselect/coinselectUtils.ts:90`

### I. connect SDK

#### 41. `createPendingTransaction / findAddress` — `packages/connect/src/api/bitcoin/createPendingTx.ts:31` (+28, 54, 68)

`O((inputs + outputs) x accountAddresses), plus 2 array allocations per call` · **cold** path · rule: _index-before-iterate_

```ts
return allAddresses;
```

**n grows because** Entry point: packages/connect/src/api/signTransaction.ts:373 calls createPendingTransaction(bitcoinTx, { addresses: params.addresses, inputs, outputs }) on every successful Bitcoin-like signature that produced a serialized tx. findAddress is invoked once per input (line 54) and once per non-address output (line 68), and each invocation scans the whole concatenated address list AND allocates two intermediate arrays (.filter().map()). Both factors grow: a send-max / consolidation from a long-lived account is hundreds of inputs against thousands of known addresses. `allAddresses` is correctly hoisted at line 27, but the scan inside findAddress is not.

**Fix.** Index the addresses by serialized path once, above findAddress: const addressesByPath = new Map<string, string[]>(); allAddresses.forEach(({ path, address }) => { const list = addressesByPath.get(path); if (list) list.push(address); else addressesByPath.set(path, [address]); }); const findAddress = ({ address_n }: { address_n?: number[] }) => { const path = address_n ? getSerializedPath(address_n) : undefined; return (path !== undefined && addressesByPath.get(path)) || []; }; Turns O(n*m) plus 2n allocations into O(n+m) with one allocation.

> **Issue notes.** Cold path (once per signing, immediately after a multi-second device interaction), so real-world win is a few ms at most — P2 only by the strict rubric (unbounded n, cold path); do not oversell it as user-visible. Behaviour deltas to call out in the issue: (1) with a Map, two vin/vout entries sharing a path would receive the SAME array instance instead of fresh copies — safe here because the result is only serialized into `response.signedTransaction` and sent over postMessage, but a caller mutating `vin[i].addresses` would now affect siblings; (2) the current code returns [] when `path` is undefined (no stored address has an undefined path), so the replacement must return [] for the undefined-path case — prefer `path === undefined ? [] : (addressesByPath.get(path) ?? [])` over the sweeper's `&& ... || []`, which types as `string[] | false | undefined` before the `||` and reads badly. `getSerializedPath` import stays used; no companion edits needed.

_Spans:_ `packages/connect/src/api/signTransaction.ts:373`

#### 42. `transformUtxos` — `packages/connect/src/api/cardano/cardanoUtils.ts:10`

`O(utxoRows^2) per call, times feeLevels per compose` · **warm** path · rule: _index-before-iterate_

```ts
        const foundItem = result.find(
```

**n grows because** Entry point: suite-common/wallet-core/src/send/sendFormCardanoThunks.ts:66 calls TrezorConnect.cardanoComposeTransaction({ feeLevels: predefinedLevels, account: { utxo: account.utxo } }) with the account's FULL utxo set on every debounced send-form compose. cardanoComposeTransaction.ts:50 maps over feeLevels and calls getCoinSelectionParams -> transformUtxos once per level, so the quadratic scan is re-run per fee level, per compose. A Cardano account holding a few hundred NFTs/native tokens produces thousands of rows; the group-by is done by linear .find over the already-built result array.

**Fix.** Key the grouping by outpoint in a Map instead of scanning `result`: const byOutpoint = new Map<string, types.Utxo>(); utxos?.forEach(utxo => { if (!utxo.cardanoSpecific) return; const key = `${utxo.txid}:${utxo.vout}`; const entry = { quantity: utxo.amount, unit: utxo.cardanoSpecific.unit }; const existing = byOutpoint.get(key); if (existing) existing.amount.push(entry); else byOutpoint.set(key, { address: utxo.address, txHash: utxo.txid, outputIndex: utxo.vout, amount: [entry] }); }); return Array.from(byOutpoint.values()); Map preserves insertion order, so the output array is identical to today's.

> **Issue notes.** Severity P2 is right: off-render but on the debounced send-form compose path. The fee-level multiplier is smaller than the sweeper implies — Cardano feeInfo.levels is typically a single 'normal' level (plus 'custom' when selected), so treat it as ~1-2x, not a big factor; the quadratic itself is the finding. Two other entry points also hit it: packages/suite/src/hooks/earn/useCardanoStaking.ts:104 and packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:171. Proposed Map-by-`${txid}:${vout}` fix is order-preserving (Map keeps insertion order) and behaviour-identical: today the `.find` runs even for rows without `cardanoSpecific`, but its result is discarded in that branch, so hoisting the `if (!utxo.cardanoSpecific) return;` above the lookup changes nothing observable. Keep the `utxos?.` optional chaining as-is (param is typed non-optional but callers pass through unvalidated SDK payloads). Coverage exists: packages/connect/src/api/cardano/cardanoUtils.test.ts + **fixtures**/cardanoUtils.ts assert with toMatchObject, so the fixtures should keep passing unchanged.

_Spans:_ `packages/connect/src/api/cardano/api/cardanoComposeTransaction.ts:53`

### J. components + utils (design system, primitives)

#### 43. `VirtualizedListComponent` — `packages/components/src/components/VirtualizedList/VirtualizedList.tsx:233` (+220, 235, 236, 237, 156)

`O(w^2) prefix-sum work + ~w array allocations per render (w = rendered window, ~70-100 with beforeAfterBufferCount=30), plus O(n) work per scroll event at lines 156 and 220 -> O(n^2) to scroll a list of n items end-to-end` · **hot** path · rule: _index-before-iterate_

```ts
const itemTop =
    firstItemTop + itemHeights.slice(indexes.startIndex, itemIndex).reduce((acc, h) => acc + h, 0);
```

**n grows because** The only consumer is packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:33, fed by GlobalSendModal.tsx:143 and SelectTokenAssetModal.tsx:212 — both pass the complete cross-account asset+token list, which is exactly the collection that grows with how many tokens a wallet holds. handleScroll fires on every scroll event, calls setIndexes, and the component re-renders; each of those renders recomputes every prefix sum from scratch. Line 220 (`firstItemTop`) allocates a slice of length `startIndex` and sums it, so the per-scroll cost grows linearly as the user scrolls deeper — summed over a full scroll-through that is quadratic in n. Line 233-237 additionally re-sums a growing slice for each of the ~100 rendered rows (beforeAfterBufferCount=30 at the caller, default 100), allocating one intermediate array per row.

**Fix.** Compute a cumulative-offset array once, next to `itemHeights`, and index it in O(1): `ts const itemOffsets = useMemo(() => {     const offsets = new Array<number>(itemHeights.length + 1);     offsets[0] = 0;     for (let i = 0; i < itemHeights.length; i++) offsets[i + 1] = offsets[i]! + itemHeights[i]!;     return offsets; }, [itemHeights]); ` Then `totalHeight = itemOffsets[itemOffsets.length - 1]`, the per-row `itemTop = itemOffsets[itemIndex]` (dropping `firstItemTop` entirely), and the start-index scan at line 156 becomes a binary search over `itemOffsets` for `scrollTop` instead of a linear walk. Whole render drops from O(n + w^2) to O(w + log n).

> **Issue notes.** Sweeper's consumer list was incomplete: besides AssetsList.tsx:33 <- GlobalSendModal.tsx:143 and SelectTokenAssetModal.tsx:212, AssetsList is also used by packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/AssetPickerModal/AssetListWrapper.tsx:32 and the SellAsset equivalent — the trading currency lists are the largest n. Fix is sound: itemTop at 233 equals firstItemTop + sum(startIndex..itemIndex) = sum(0..itemIndex), so a cumulative `itemOffsets` array gives the identical value in O(1) and lets `firstItemTop` (219-222) and `totalHeight` (141-144) be dropped/derived; the linear start-index scan at 156-165 can become a binary search over the same array. Companion edits: `firstItemTop` useMemo becomes unused, and `getIndexOrThrow` may become unused in the scan if replaced. Two adjacent smells worth mentioning in the issue but not blocking: `setIndexes` at 183 always allocates a fresh object so every scroll event re-renders even when the window did not move, and the file already carries TODOs at 147 and 227 pointing at IntersectionObserver / react-window. Component is wrapped in memo(); no React Compiler caveat since all the arrays are already useMemo'd on [items].

_Spans:_ `packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:33`

#### 44. `getLocaleSeparators` — `packages/utils/src/getLocaleSeparators.ts:2` (+3, 5, 6)

`O(formatted amounts) uncached Intl.NumberFormat constructions (constant-factor per row, unbounded row count)` · **hot** path · rule: _other-quadratic_

```ts
const numberFormat = new Intl.NumberFormat(locale);
```

**n grows because** There is no cache: every call rebuilds `new Intl.NumberFormat(locale)`, runs `formatToParts` (which allocates an array of part objects) and linearly scans it twice, for a value (`10000.1`) that never changes and a `locale` drawn from ~20 possible values. The call chain that makes n large is `suite-common/wallet-utils/src/localizeNumberUtils.ts:22` (`localizeNumber`) -> `suite-common/formatters/src/formatters/prepareCryptoAmountFormatter.ts:71` (`CryptoAmountFormatter`) -> `suite-native/formatters/src/components/TokenAmountFormatter.tsx:33`, rendered per row by `suite-native/transactions/src/components/TokenTransferListItem.tsx` and `suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx`; on web the same formatter backs `packages/suite/src/views/wallet/transactions/TransactionList/TransactionsGroup/DayHeader.tsx`. `localizeNumberUtils.ts:42` then builds a SECOND `Intl.NumberFormat(locale)` per call for the 1000-9999 group-size probe. `makeFormatter` does not memoize, so an EVM account with several hundred tokens pays several hundred Intl constructions per full list render.

**Fix.** Memoize on `locale` — the key space is the ~20 entries of `LANGUAGES`: `ts const separatorsByLocale = new Map<string, { decimalSeparator: string; thousandsSeparator: string }>();  export const getLocaleSeparators = (locale: string) => {     const cached = separatorsByLocale.get(locale);     if (cached) return cached;     // ...existing body...     const result = { decimalSeparator, thousandsSeparator };     separatorsByLocale.set(locale, result);      return result; }; ` Do the same for `getLocaleSeparators.native.ts`, and cache the probe formatter used at `localizeNumberUtils.ts:42` in a `Map<string, Intl.NumberFormat>` rather than constructing it inline.

> **Issue notes.** @trezor/utils is a published npm package, so a module-level Map is a process-global cache — acceptable here because Intl.NumberFormat is stateless and the key space is the ~20 LANGUAGES entries, but it must be keyed on `locale` (never on `undefined`/ambient). packages/utils/src/getLocaleSeparators.native.ts is a SEPARATE implementation (iOS cannot use formatToParts) and needs the same cache added independently — it constructs Intl.NumberFormat and then does a character scan of the formatted string. Return the same frozen object from the cache; callers only destructure `{ decimalSeparator, thousandsSeparator }`, so shared identity is safe. The `as string` casts on lines 5-6 stay as-is; a Map-typed cache keeps the return type inferred identically, so no widening at the call sites.

_Spans:_ `suite-common/wallet-utils/src/localizeNumberUtils.ts:22`

#### 45. `objectPartition` — `packages/utils/src/objectPartition.ts:12` (+15)

`O(m*n + m^2) property copies and O(m) throwaway objects (m = keys.length, n = Object.keys(obj).length)` · **cold** path · rule: _reduce-accumulator_

```ts
keys.reduce(
    ([included, excluded], key) => {
        const { [key]: value, ...rest } = excluded;

        return typeof value !== 'undefined'
            ? [{ ...included, [key]: value }, rest]
```

**n grows because** The rest-destructuring `{ [key]: value, ...rest } = excluded` shallow-copies the entire remaining map on every single key, so this is the textbook accumulator-copy quadratic even though it is written as a destructure rather than a literal spread. Concrete callers: packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:38 (`removeAddresses` -> objectPartition(subscribedAddrs, addresses)) and :64 (`removeAccounts` -> objectPartition(subscribedAccs, descriptors)), reached whenever the electrum worker unsubscribes accounts (wallet switch, account removal, disconnect). Removing one 500-address account from a 2000-entry map costs ~1M property copies and 500 throwaway objects, all on the worker thread.

**Fix.** Index the removal keys once and walk the object a single time: `ts export const objectPartition = <T>(obj: Obj<T>, keys: string[]): [Obj<T>, Obj<T>] => {     const keySet = new Set(keys);     const included: Obj<T> = {};     const excluded: Obj<T> = {};     for (const [key, value] of Object.entries(obj)) {         (keySet.has(key) ? included : excluded)[key] = value;     }     return [included, excluded]; }; ` Same observable result (only keys actually present in `obj` land in `included`); complexity drops from O(m*n + m^2) to O(n + m).

> **Issue notes.** Mitigating context the issue should state honestly: both call sites are in the electrum worker, which is an opt-in custom backend, and they run on unsubscribe (wallet switch / account removal / disconnect), not on a render or reducer path — that is why this is P2 and not P1. Two behaviour deltas in the proposed Set-based rewrite, both benign here but worth naming: (1) the original puts a key whose value is literally `undefined` into `excluded` (the `typeof value !== 'undefined'` guard), a single-pass Object.entries version would put it into `included`; (2) key insertion order in `included` changes from `keys` order to `obj` order — both callers only do `Object.values(toRemove)`, so order is not observable. packages/utils/src/objectPartition.test.ts covers presence/absence semantics and should keep passing; add a case for an explicitly-undefined value if the guard is dropped. Same file also has the sibling accumulator-spread reduces at addressManager.ts:25 and :49, already filed/reported — reference them so the fixes land together.

_Spans:_ `packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:38`

### K. suite/* feature packages

#### 46. `prepareCoinjoinTransaction` — `suite/coinjoin/src/coinjoinUtils.ts:244` (+247, 254, 279)

`O(roundInputs x accountUtxos) + O(roundOutputs x changeAddresses), one getUtxoOutpoint string allocation per probe` · **hot** path · rule: _index-before-iterate_

```ts
const isInternalInput = (input: CoinjoinTransactionData['inputs'][0]) =>
    input.path && account.utxo?.find(u => getUtxoOutpoint(u) === input.outpoint);
const isInternalOutput = (output: CoinjoinTransactionData['outputs'][0]) =>
    output.path && account.addresses?.change.find(a => a.address === output.address);
```

**n grows because** Called from `signCoinjoinTx` (suite/coinjoin/src/coinjoinClientActions.ts:621) on every `request:signature` event the coinjoin client emits, i.e. once per round the account participates in. A coinjoin account exists specifically to accumulate many small UTXOs — hundreds to thousands — and every completed round mints a fresh change address, so `addresses.change` grows monotonically with session count. The round transaction carries every participant's input/output, so the outer loop is in the hundreds. Worse, `getUtxoOutpoint(u)` builds a new string on _every_ probe, so the inner scan is hundreds of thousands of string allocations, not just comparisons.

**Fix.** Index both collections once, above the maps: `ts const internalOutpoints = new Set(account.utxo?.map(getUtxoOutpoint) ?? []); const internalChange = new Set(account.addresses?.change.map(a => a.address) ?? []); const isInternalInput = (input) => input.path && internalOutpoints.has(input.outpoint); const isInternalOutput = (output) => output.path && internalChange.has(output.address); ` `getUtxoOutpoint` then runs once per UTXO instead of once per (input, UTXO) pair.

> **Issue notes.** Behaviour delta to watch: the current predicates return the found UTXO/address object (truthy) rather than a boolean, but both results are only used in `if (...)` conditions at :256 and :280, so switching to `Set.has()` is safe. `account.utxo` and `account.addresses` are optional — keep the `?? []` fallbacks so the `input.path &&` / `output.path &&` short-circuit semantics are preserved exactly (an account with no `utxo` must still yield false). Both predicates are plain function expressions inside the exported function, not hooks, so no React Compiler concern. `getUtxoOutpoint` import already present. Sibling anchor at :247 is the same defect and should be fixed in the same edit.

_Spans:_ `suite/coinjoin/src/coinjoinClientActions.ts:621`

### M. From wave 1 (manual grep sweep)

These predate the orchestrated sweep and were triaged by hand rather than by an adversarial verifier pair. Line numbers re-checked against the current tree.

#### 47. Trading selectors: per-trade account scan, plus an allocating _and_ mutating comparator — `suite-common/trading/src/selectors/tradingSelectors.ts:422`, `:456`

**46a** — `selectTradingTradesForSelectedDevice`, O(trades × accounts):

```ts
trades.filter(tx => {
    const txDeviceId = accounts.find(account => { ... })?.deviceState;
```

The fix is already written three lines below in the same file — `selectDeviceTradingTrades` (:439) builds `new Set(accounts.map(({ key }) => key))` first. Here it needs a `Map<AccountKey, deviceState>` instead of a `Set`.

**46b** — `selectDeviceTradingTradesOrderedByDate`:

```ts
trades => trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
```

Two `Date` allocations per comparison → `2·n·log n`. **And `.sort()` mutates in place** — the input is the memoized output of `selectDeviceTradingTrades`, so this reorders another selector's cached array. That is a correctness bug on top of the perf one (see the [defensive-programming skill](skills/defensive-programming/SKILL.md) on non-mutating array methods).

> **Issue notes.** File the mutation half even if the perf half is deferred. Fix: index the timestamps into a `Map` above the sort, then `toSorted`.

#### 48. Receive-address list is quadratic in the account's address count — `suite-common/address/`

| Line                                                                                           | Code                                                       | Complexity                  |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------- |
| [`getFirstFreshAddress.ts:32`](suite-common/address/src/getFirstFreshAddress.ts#L32)           | `!alreadyUsedAddresses.find(r => r.path === address.path)` | O(unused × used)            |
| [`getFirstFreshAddress.ts:33`](suite-common/address/src/getFirstFreshAddress.ts#L33)           | `!pendingAddresses.includes(address.address)`              | O(unused × pending)         |
| [`getFirstFreshAddress.ts:5-6`](suite-common/address/src/getFirstFreshAddress.ts#L5)           | `isPathLowerThanAnyUsedPath` → `usedPaths.some(...)`       | O(unused × used)            |
| [`getReceiveAddressHistory.ts:142`](suite-common/address/src/getReceiveAddressHistory.ts#L142) | `touchedAddresses.some(t => t.path === address.path)`      | O(unused × touched)         |
| [`getReceiveAddressHistory.ts:150`](suite-common/address/src/getReceiveAddressHistory.ts#L150) | `durableVisibleAddresses.some(...)` inside `unused.reduce` | O(unused × (used + unused)) |

Both run on the Receive tab. `unused` is capped by the gap limit (20) but `used` is not — an account with thousands of used addresses makes this a visible tab-open stall.

> **Issue notes.** `Set` on `pendingAddresses` and on the `path` fields of `alreadyUsedAddresses`/`touchedAddresses`. `isPathLowerThanAnyUsedPath` genuinely needs a comparison rather than a lookup — precompute the max used path once above the filter. **Bundle with wave-2 finding at `getReceiveAddressHistory.ts:37`** (comparator allocation in `sortReceiveAddressesByHighestPath`).

#### 49. `getMyInputsFromTransaction` scans all account addresses per input — `suite-common/wallet-utils/src/getMyInputsFromTransaction.ts:17`

```ts
return tx.details.vin.flatMap(input => {
    const addr = allAddresses.find(a => input.addresses?.includes(a.address));
```

O(vin × addresses × input.addresses) — a nested scan _inside_ a nested scan. `allAddresses` is `change + used + unused`, rebuilt by `concat` on every call (:12).

**Fix.** `const addressByValue = new Map(allAddresses.map(a => [a.address, a]));` above the `flatMap`, then `input.addresses?.map(a => addressByValue.get(a)).find(isNotNullOrUndefined)`.

Callers: `composeCancelTransactionThunk.ts:39` and `transactionUtils.ts:1067` (RBF / cancel-tx). Cold, but `n` is unbounded on both axes.

#### 50. Two per-element address/UTXO scans in `getPendingAccount` — `suite-common/wallet-utils/src/accountUtils.ts:921`, `:1018`

- **`:921`** — `findUtxo`: `account.utxo?.filter(u => !inputs.some(i => i.prev_hash === u.txid && i.prev_index === u.vout))` → O(utxos × inputs). Fix: `new Set(inputs.map(i => \`${i.prev_hash}:${i.prev_index}\`))`.
- **`:1018`** — `tx.outputs.forEach(output => addresses.find(a => a.address === output.address))` → O(outputs × addresses). Fix: `new Set(addresses.map(a => a.address))`.

Both on the send path. A large consolidation transaction makes `inputs`/`outputs` big at exactly the moment `utxo`/`addresses` are big. **Bundle with wave-2 `accountUtils.ts:308`.**

#### 51. WalletConnect `getNamespaces` dedups accounts in O(n²) — `suite-common/walletconnect/src/adapters/index.ts:53-62`

```ts
const accountsDeduped: Account[] = [];
accounts.forEach(account => {
    if (
        !accountsDeduped.some(
            a => a.descriptor === account.descriptor && a.symbol === account.symbol,
        )
    ) {
        accountsDeduped.push(account);
    }
});
```

**Fix.** `new Set<string>()` keyed on `` `${account.symbol}:${account.descriptor}` ``. `n` is every account across every wallet — hundreds. Runs on session proposal and on every account change.

#### 52. Solana worker rescans the subscription list per account and per token account — `packages/blockchain-link/src/workers/solana/index.ts:591`, `:633`

- **`:591`** — `!subscribedAccounts.some(s => account.descriptor === s.descriptor)` per new account, where `newAccounts` is `accounts + extractTokenAccounts(...)` → O(new × subscribed).
- **`:633`** — `subscribedAccounts.find(sa => sa.descriptor === ta.publicKey)` inside a **triple-nested** `forEach` (accounts → tokens → token accounts) → O(accounts × tokens × tokenAccounts × subscribed). The worst nesting depth found in either sweep.

**Fix.** One `new Map(subscribedAccounts.map(a => [a.descriptor, a]))` per function, hoisted above the loop — `state.getAccounts()` is already on the line above in both. **Bundle with wave-2 `solana/index.ts:71`.**

#### 53. Coinjoin request reconciliation is O(n²) over UTXOs — twice — `suite/coinjoin/src/coinjoinClientActions.ts:549`, `:710`

```ts
request.inputs.forEach(utxo => {
    if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
        response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
    }
});
```

Identical block in two places, and worse than plain O(n²): the loop `push`es into the very array it scans.

**Fix.** `const resolvedOutpoints = new Set(response.inputs.map(u => u.outpoint));` above the loop, adding to it as you push. The duplication itself is worth collapsing. **Bundle with wave-2 `coinjoinClientActions.ts:782`.**

#### 54. Transaction search: per-address scan of the label-matched set — `suite-common/transaction-search/src/simpleSearchTransactions.ts:182`

```ts
if (address.toLowerCase().includes(search.toLowerCase()) || foundAddressesForLabel.includes(address)) {
```

O(addresses × labelMatchedAddresses), plus `search.toLowerCase()` re-allocated per address. **Fix:** `new Set(foundAddressesForLabel)` and hoist `lowerCaseSearch`.

> **Issue notes.** Natural companion to **#31124** (same file, :240) and to P1 #3 (:29) and the wave-2 finding at :192. Four anchors in this file — see [Bundling](#bundling-findings-that-share-a-file).

#### 55. Solana token-account sort allocates two `BigNumber` per comparison — `networks/solana/network-solana/src/runtime/connect.ts:223-225`

```ts
const sorted = [...tokenAccounts].sort(
    (a, b) => new BigNumber(b.balance).comparedTo(new BigNumber(a.balance)) ?? 0,
);
```

`2·n·log n` allocations. Same defect shape as #31126's `utxoSortingUtils.ts:33` hunk, which measured **3.6 ms → 1.3 ms** at n=2000 from removing the allocation alone.

> **Issue notes.** Index balances into a `Map` above the sort. ⚠️ **`toSorted` needs a Hermes check** if this file is reachable from `suite-native` — #31126 flags the same caveat; `[...tokenAccounts].sort()` is the safe fallback.

---

## P3 — cleanups, bounded-but-sloppy, or constant-factor

Mechanical and low-risk. Worth batching into a small number of housekeeping PRs rather than filing individually. Constant-factor items (allocation per render, per comparison) are included where they sit on a hot path and are labelled as such — they are **not** asymptotic and should not be sold as such in an issue.

### From wave 2

**A. Suite app — UI (packages/suite)**

| Where                                                                                                     | Symbol              | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------- | ------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TransactionTarget.tsx:193` (+79)  | `TransactionTarget` | index-before-iterate | TransactionTarget is the row component rendered once per output by TransactionTargetsList.tsx:24, itself inside the per-transaction map of the transaction list, so the full unfiltered label list is re… | Add a memoized selector that keys the wallet's output labels by `${txId}:${txTargetId}` into a Map (next to selectSuiteSyncOutputLabelsByAccount) and … |
| `packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:105` (+93,95,121)        | `AccountsList`      | index-before-iterate | The whole `filteredAccounts` expression sits in the render body (line 93, after the early return at 89) with no `useMemo`. Per account it runs `getTokens` (suite-common/wallet-core/src/tokens/tokenUti… | Hoist the search-independent derivation above the filter and index it by account key: const shownTokensByAccountKey = useMemo(() => { const map =…      |
| `packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:147` (+156)                                 | `AssetsView`        | index-before-iterate | Both scans sit inside `assetSymbols.map(...)` (line 126), which runs on every render of the unmemoized `AssetsView` body — and that re-renders on every fiat-rate tick (`useSelector(selectCurrentFiatRa… | Use the index that already exists: `const symbolAccounts = assets[symbol] ?? []` and derive both values from it — `failed: symbolAccounts.some(a => a.… |
| `packages/suite/src/views/wallet/transactions/TransactionList/TransactionsGroup/TransactionsGroup.tsx:52` | `TransactionsGroup` | other-quadratic      | `TransactionGroupedList.tsx:35` renders one `TransactionsGroup` per day bucket of the current page, and the pending-tx list adds a second `TransactionGroupedList` on every page. With a 25-tx page of o… | Hoist it: compute `const erc4626Contracts = useMemo(() => getErc4626Contracts(account.tokens), [account.tokens])` in `TransactionGroupedList` (or in `… |

**B. Suite app — hooks, actions, middleware, utils**

| Where                                                                       | Symbol           | Rule            | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| --------------------------------------------------------------------------- | ---------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/suite/src/utils/wallet/exportTransactionsUtils.ts:165` (+168,163) | `prepareContent` | other-quadratic | `exportTransactionsThunk` (packages/suite/src/actions/wallet/exportTransactionsActions.ts:79) feeds `getAccountTransactions(account.key, allTransactions)` in full, and `prepareContent` is called twice… | Hoist them to module scope next to the existing `dateFormat`/`timeFormat` constants: `const dateFormatter = new Intl.DateTimeFormat('default', dateFor… |
| `packages/suite/src/utils/wallet/tokenUtils.ts:27`                          | `CoinsTable`     | sort-comparator | The comparator `sortTokensWithRates` (packages/suite/src/utils/wallet/tokenUtils.ts:24) is not O(1) field reads: line 27 does `b.fiatValue.minus(a.fiatValue).toNumber()`, allocating a fresh BigNumber … | Index once above the sort and compare plain numbers: precompute `const key = tokens.map(t => ({ t, fiat: t.fiatValue.toNumber(), rate: t.fiatRate?.rat… |

**C. wallet-core (shared Redux)**

| Where                                                                                  | Symbol                                   | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `suite-common/wallet-core/src/accounts/accountsThunks.ts:256` (+254)                   | `fetchAndUpdateAccountThunk`             | index-before-iterate | The `.find` scans the account's entire transaction history once per added transaction, even though it can only ever match a _fake pending_ tx (one carrying `deadline`), of which there are at most a ha… | Index the (tiny) set of fake pending txs once, above the map: const fakeTxTokensByTxid = new Map( accountTxs .filter(t => 'deadline' in t…             |
| `suite-common/wallet-core/src/fiat-rates/fiatRatesSelectors.ts:122` (+106,117,130,138) | `selectTickerFromAccounts (via selectTi` | index-before-iterate | `A.uniqBy` in @mobily/ts-belt is NOT Set-based: node_modules/@mobily/ts-belt/dist/cjs/Array/index.js:1644 `_uniqBy` walks the input and for every element runs `someU(arr, x => caml_equal(uniqFn(x), un… | Replace the ts-belt pipeline tail with an explicit Set-keyed dedupe and hoist the balance test off BigNumber: const seen = new Set<string>(); const t… |
| `suite-common/wallet-core/src/tokens/tokenSelectors.ts:84` (+70)                       | `selectAccountUnrecognizedTokens (and s` | sort-comparator      | `getTokens` (tokenUtils.ts:85-86) routes every token missing from the definitions list into the `unverified*` buckets, and blockbook returns the account's complete token list — an EVM address that has… | Extract the collation key once per element, then compare primitives (RULE 2 — index once above the sort): const collator = new Intl.Collator(); // mo… |

**D. wallet-utils (shared computation)**

| Where                                                          | Symbol               | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| -------------------------------------------------------------- | -------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suite-common/wallet-utils/src/transactionUtils.ts:915` (+916) | `getTargetAmountRaw` | index-before-iterate | Both `.find()` calls are invariant with respect to the caller's iteration but sit inside the per-target callee, so mapping the whole target list rescans it twice per element. suite-common/transaction-… | Compute the two lookups once per transaction and pass them in: `const firstAccountTarget = transaction.targets.find(t => t.isAccountTarget); const has… |

**E. suite-common (other packages)**

| Where                                                                                                | Symbol                                   | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suite-common/address/src/getReceiveAddressHistory.ts:37` (+39,102,163)                              | `sortReceiveAddressesByHighestPath`      | sort-comparator      | `comparePath` re-parses BOTH derivation-path strings on every comparison. Each `getPathParts` call runs `getHDPath`, which does `path.toLowerCase()`, `.split('/')`, `.filter(...)`, builds a `number[]`… | Decorate-sort-undecorate with a single parse per address: `const parsed = new Map(addresses.map(a => [a, getHDPath(a.path)]))` above the sort, then co… |
| `suite-common/fiat-services/src/coingecko.ts:202` (+141,146,148,200)                                 | `getFiatRatesForTimestamps / findCloses` | other-quadratic      | findClosestTimestampValue (:141) always seeds `closestTimestamp = prices[0]` (:146) and walks forward from index 1 (:148) until the delta stops shrinking, so the scan position is never carried between… | Sort the timestamps once, then sweep `prices` with a single cursor that never rewinds (classic two-pointer merge), or precompute the price timestamps … |
| `suite-common/suite-sync/src/data/account/selectAccountsWithSuiteSyncLabel.ts:29` (+31,40,52)        | `mapAccountsToSuiteSyncLabel (selectAcc` | index-before-iterate | `findSuiteSyncAccountLabel` (suite-common/suite-sync/src/data/account/findSuiteSyncAccountLabel.ts:10) is a bare `params.accounts.find(a => a.accountDescriptor === ... && a.networkSymbol === ...)`, ex… | Build the index once per label array instead of scanning per account. Either add a memoized selector that returns `Map<`${networkSymbol}:${accountDesc… |
| `suite-common/suite-sync/src/data/address/suiteSyncAddressSelectors.ts:48` (+47,42,14)               | `selectSuiteSyncAddressLabel`            | index-before-iterate | Same shape as the output-label selector: suiteSyncDataReducer.ts:14 stores `addresses: Record<SuiteSyncAddress['address'], SuiteSyncAddress>`, keyed by exactly the address being searched, and selectAl… | Read the dictionary directly: select `selectWalletById(state, walletDescriptor)?.addresses` and return `addressesByAddress?.[address]?.label ?? null` … |
| `suite-common/trading/src/utils/infoUtils.ts:20` (+15,19,22,28,57)                                   | `getTradingCoinInfoByCryptoId`           | index-before-iterate | The exact-key hit at :15 only fires when the caller's cryptoId matches Invity's key byte-for-byte. Suite builds token cryptoIds via getCryptoId -> getContractAddressForNetworkSymbol, which lowercases … | Build the case-insensitive index once per `coins` object and cache it on the object identity, the way tokenDefinitionsUtils.ts:25 already does for tok… |
| `suite-common/transaction-search/src/simpleSearchTransactions.ts:192` (+195,200,201,202,203,216,228) | `simpleSearchTransactions (foundTxsForT` | other-quadratic      | `search.toLowerCase()` is evaluated inside the `.flatMap` over the whole history at :195 and :216 and :228, and again 4 times inside the `.some` over each transaction's token transfers at :200-:203. N… | Hoist once at the top of `simpleSearchTransactions`: `const lowerCaseSearch = search.toLowerCase();` and substitute it at :195, :200, :201, :202, :203… |

**F. suite-native (mobile)**

| Where                                                                                                       | Symbol                                   | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suite-native/accounts/src/components/AccountsList/AccountsListTokenItem.tsx:33` (+33)                      | `AccountsListTokenItem`                  | index-before-iterate | The row already receives the whole `token` object, yet it asks a selector to find that same token again by contract address. selectAccountTokenSymbol -> selectAccountTokenInfo (suite-native/tokens/src… | Drop the selector call and derive from the prop: the `token` prop is already `TokenInfoBranded`, so use `token.symbol` (applying `shouldUppercaseToken… |
| `suite-native/module-activity-center/src/components/notifications/TransactionNotificationItem.tsx:85` (+84) | `TransactionNotificationItem`            | index-before-iterate | The selector body is `accounts.find(a => a.descriptor === accountDescriptor && a.symbol === symbol)` over selectDeviceAccounts (suite-common/wallet-core/src/accounts/accountsSelectors.ts:276). Unlike … | Index once: add a memoised `selectDeviceAccountsByDescriptorAndSymbolMap` (Map keyed on `${symbol}:${descriptor}`) next to selectVisibleDeviceAccounts… |
| `suite-native/module-earn/src/components/EarnDepositsCardRow.tsx:40` (+43,47)                               | `getVisibleRowIcons`                     | reduce-accumulator   | Two rule violations in six lines: `uniqueItems.some(...)` is a scan inside a reduce (and it recomputes getRowItemIconKey - a template string - for every element already accumulated, on every step), an… | const getVisibleRowIcons = (row: EarnDepositsCardRowType) => { const seen = new Set<string>(); const unique: typeof row.activeItems = []; …             |
| `suite-native/module-send/src/screens/SendUtxoScreen.tsx:88` (+87)                                          | `onSelectionSubmit`                      | index-before-iterate | Both collections are the account's UTXO set - the same growing collection the skill calls out - and m approaches n when the user selects most coins. isSameUtxo compares txid + vout, so an outpoint Set… | const selectedOutpoints = new Set(tempSelectedUtxos.map(getUtxoOutpoint)); setSelectedUtxos(account?.utxo?.filter(u => selectedOutpoints.has(getUtxoOu… |
| `suite-native/module-trading/src/components/general/MyAssetSheet/MyAssetSheet.tsx:95` (+96)                 | `MyAssetSheet renderSectionHeader`       | index-before-iterate | A findIndex over the whole section list runs inside the per-header render callback, purely to compute the boolean `sectionIndex === 0`. n = accounts, which grows with the wallet (networks x account ty… | isFirst={filteredSections[0]?.sectionData.key === config.sectionData.key} - one comparison instead of a scan. (Or hoist a `const firstSectionKey = fi…  |
| `suite-native/module-trading/src/hooks/general/useMyAssetsFilteredData.ts:40` (+15,27,28,41,44)             | `sortSectionItemsCallback / getSortWeig` | sort-comparator      | useSectionDataFilter (suite-common/trading/src/hooks/useSectionDataFilter.ts:25) calls `data.sort((a, b) => sortSectionItemsCallback(a, b, filterValue))`, so the comparator body runs O(n log n) times.… | Do what the sibling hook useTradeableAssetsFilteredData.ts:85-90 already does: build `const searchFieldsByAsset = useMemo(() => new Map(rows.map(r => … |
| `suite-native/tokens/src/tokensSelectors.ts:47` (+49)                                                       | `selectAccountTokenInfo`                 | index-before-iterate | This is the two-file shape: the list maps rows, and each ROW re-enters this selector with its own contract, so the selector scans the whole token array per row. `suite-native/accounts/src/components/A… | Index the account's tokens once instead of scanning per row. Add a memoized-per-account map selector and read it in O(1): ```ts const selectTokensByLo… |
| `suite-native/transactions/src/components/TransactionListItemContainer.tsx:134` (+133)                      | `TransactionListItemContainer`           | index-before-iterate | selectTransactionBlockTimeById resolves through selectTransactionByAccountKeyAndTxid, which is a plain `transactions.find(tx => tx?.txid === txid)` over the whole account history (suite-common/wallet-… | Drop the selector entirely and read the prop: const transactionBlockTime = transaction.blockTime ? transaction.blockTime * 1000 : null; Same value, …   |

**G. blockchain-link + networks (backend transforms)**

| Where                                                                 | Symbol             | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| --------------------------------------------------------------------- | ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/blockchain-link-utils/src/utils.ts:45` (+39)                | `transformTarget`  | index-before-iterate | transformTarget is called inside `.map()` at blockbook.ts:371 (`targets.filter(...).map(target => transformTarget(target, myOutputs))`) and blockfrost.ts:327 (`targets.map(t => transformTarget(t, inco… | Take a Set instead of an array: `export const transformTarget = (target: VinVout, incoming: ReadonlySet<VinVout>) => ({ ..., isAccountTarget: incoming… |
| `packages/blockchain-link/src/workers/solana/index.ts:71` (+57,58,59) | `getAllSignatures` | other-quadratic      | `allSignatures = [...allSignatures, ...signatures]` reallocates and copies the whole accumulated array once per page. With a page size of 100 and n total signatures there are n/100 iterations, so the … | Append in place: `allSignatures.push(...signatures);` (or `for (const s of signatures) allSignatures.push(s)` to avoid spread-argument stack limits on… |

**H. coinjoin + utxo-lib**

| Where                                                                  | Symbol                                | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/coinjoin/src/backend/scanAccount.ts:51` (+49, 50)            | `scanAccount (filter iteration loop)` | other-quadratic      | The loop body is loop-invariant with respect to `addresses`: the arrays only change inside `addresses.analyze` at line 58, which runs only on a filter match. Yet `concat` + `map` allocate two fresh ar… | Hoist the array and refresh it only when new addresses appear: keep `let scripts = [...]` before the loop, and after `addresses.analyze` returns newly… |
| `packages/coinjoin/src/client/Account.ts:81` (+78,79,80)               | `Account.findDetainedElements`        | index-before-iterate | `this.utxos` grows with the account (hundreds to low thousands of small outputs is the normal end-state of coinjoining), and the outer factor is the concatenation of every registered input across ever… | Index once above `rounds.flatMap`: `const utxoByOutpoint = new Map(this.utxos.map(u => [u.outpoint.toLowerCase(), u]))` (the outpoint strings are hex;… |
| `packages/coinjoin/src/client/CoinjoinPrison.ts:79` (+80,81)           | `CoinjoinPrison.detain`               | other-quadratic      | `detain` rebuilds the whole inmates array on every call (a `.filter()` copy plus a `.concat()` copy), and every caller calls it inside a loop: endedRound.ts:60 (`[...inputs, ...addresses].forEach(vinv… | Store the prison as `Map<string, CoinjoinPrisonInmate>` and make detain a single `this.inmates.set(id, {...})` - the `.filter(i => i.id !== id)` exist… |
| `packages/coinjoin/src/client/round/selectRound.ts:143` (+127,150,179) | `getAccountCandidates`                | index-before-iterate | Both factors grow. (a) A coinjoin account's raison d'etre is splitting into many small outputs: hundreds to low thousands of UTXOs after a few dozen rounds, and every one of them is passed in Register… | Give CoinjoinPrison an id-keyed index and make isDetained O(1): keep `private inmatesById = new Map<string, CoinjoinPrisonInmate>()` alongside (or ins… |
| `packages/utxo-lib/src/coinselect/coinselectUtils.ts:308` (+304, 305)  | `sortByScore / utxoScore`             | sort-comparator      | `utxoScore` is recomputed inside the comparator, and each call does `x.value - BigInt(getFeeForBytes(feeRate, inputBytes(x)))` — a `BigInt(...)` construction plus a BigInt subtraction, plus `inputWeig… | Schwartzian transform: compute the score once per UTXO above the sort (`const scores = new Map(inputs.map(u => [u, utxoScore(u, feeRate)]))`, or preco… |
| `packages/utxo-lib/src/coinselect/index.ts:14` (+18)                   | `coinselect`                          | sort-comparator      | `sortByScore`'s comparator (coinselectUtils.ts:310) calls `utxoScore` twice per comparison, and `utxoScore` does `x.value - BigInt(getFeeForBytes(feeRate, inputBytes(x)))` — a BigInt conversion plus a… | Precompute once above the sort: `const score = new Map(inputs.map(i => [i, utxoScore(i, feeRate)]))`, then the comparator is two Map reads plus the `a… |

**I. connect SDK**

| Where                                                    | Symbol                                   | Rule                 | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                |
| -------------------------------------------------------- | ---------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/connect/src/api/bitcoin/refTx.ts:46` (+61, 66) | `getReferencedTransactions / getOrigTra` | index-before-iterate | Entry points: packages/connect/src/api/signTransaction.ts:278 (fetchRefTxs), packages/connect/src/api/sendTransaction.ts:402, and refTx.ts:264 inside validateReferencedTransactions. inputs.length equa… | Dedupe with a Set instead of .includes on the result array: export const getReferencedTransactions = (inputs: PROTO.TxInputType[]): string[] => [ … |

**J. components + utils (design system, primitives)**

| Where                                                     | Symbol                     | Rule               | What's wrong                                                                                                                                                                                              | Note                                                                                                                                                    |
| --------------------------------------------------------- | -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/components/src/utils/frameProps.tsx:123` (+120) | `pickAndPrepareFrameProps` | reduce-accumulator | Reported deliberately as a constant-factor-per-render finding, not a growing-n one, per the design-system carve-out. `pickAndPrepareFrameProps` has 82 call sites across packages/components and package… | Mutate the object the reduce already owns, and fold the `$`-prefixing into the same single pass so `makePropsTransient` does not rebuild it a third ti… |

_*K. suite/* feature packages_*

| Where                                                                   | Symbol                                   | Rule                 | What's wrong                                                                                                                                                                                                | Note                                                                                                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suite/address/src/labels/selectAddressLabel.ts:47`                     | `selectAddressLabel`                     | index-before-iterate | The selector is invoked once per row by `UtxoSelection` (packages/suite/src/views/wallet/send/.../UtxoSelection/UtxoSelection.tsx:101), the coin-control row component — one call per UTXO, and UTXO cou…   | Split the address out of the scan: build the map in a memoized selector over `suiteSyncAddressLabels` alone (shared across all addresses), then have `… |
| `suite/address/src/labels/selectAddressLabelsForAccount.ts:60` (+69,70) | `selectAddressLabelsForAccount`          | index-before-iterate | The result function is memoized by `createWeakMapSelector`, but the memo key includes the `addresses` argument, and every row passes its own `target.addresses` array (packages/suite/src/components/wal…   | Split the wallet-wide index out of the per-row selector so it is built once per label-set identity instead of once per row. Add a memoized `selectSuit… |
| `suite/coinjoin/src/coinjoinClientActions.ts:782` (+786)                | `initCoinjoinService`                    | index-before-iterate | `initCoinjoinService` runs at startup for every persisted coinjoin account (via `restoreCoinjoinAccounts`, suite/coinjoin/src/coinjoinAccountActions.ts:922) and again on every `fetchAndUpdateAccount`/…   | Build sets once, outside the `flatMap`: `const utxoSet = new Set(realAccount.utxo!.map(getUtxoOutpoint));` and `const usedChangeSet = new Set(realAcco… |
| `suite/metadata/src/password-manager/PasswordEntry.tsx:101`             | `PasswordEntry`                          | other-quadratic      | `PasswordsList` (suite/metadata/src/password-manager/PasswordsList.tsx:65) maps one `PasswordEntry` per entry, and each `PasswordEntry` calls `usePasswords()` purely to obtain the `removePassword` cal…   | Do not call the whole page hook from the row. Pass `removePassword` down from `PasswordManager`/`PasswordsList` as a prop (they already receive `saveP… |
| `suite/sign-verify/src/useSignAddressOptions.ts:100` (+103)             | `useSignAddressOptions (groupedOptions ` | reduce-accumulator   | This is a _second, distinct_ reduce from the already-reported one at :20 — the `{...grouped}` spread here is cheap (only 3-4 category keys) but `[...(grouped[category] \|\| []), {...}]` copies the whole… | Mutate the accumulator the reduce already owns instead of rebuilding it: ```ts const groupedAddresses = signAddressesValues.reduce<Record<string, Addr… |

### From wave 1

| Where                                                                                                                                                                                                                                                             | Issue                                                       | Note                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [`electrum/utils/addressManager.ts:49`](packages/blockchain-link/src/workers/electrum/utils/addressManager.ts#L49)                                                                                                                                                | Second spread-accumulator reduce (`AccountMap`) in the file | **#31129 only names line 25** — same file, same fix, fold in                                                                          |
| [`connect/src/api/bitcoin/signtxLegacy.ts:187`](packages/connect/src/api/bitcoin/signtxLegacy.ts#L187)                                                                                                                                                            | `refTxs` record copied per referenced tx                    | Exact mirror of **#31132**; fold in                                                                                                   |
| [`suite-common/graph/src/graphDataFetching.ts:244`](suite-common/graph/src/graphDataFetching.ts#L244)                                                                                                                                                             | `tokensFilter.includes(contractId)` per token               | O(tokens × filter); `Set`                                                                                                             |
| [`transactionsReducer.ts:51`](suite-common/wallet-core/src/transactions/transactionsReducer.ts#L51), [`:58`](suite-common/wallet-core/src/transactions/transactionsReducer.ts#L58)                                                                                | `transactions.filter(tx => !txs.some(...))`                 | O(history × removed) in a reducer; removal lists normally tiny. **Bundle with P1 #1**                                                 |
| [`blockbook.ts:66`](packages/blockchain-link-utils/src/blockbook.ts#L66), [`:74-75`](packages/blockchain-link-utils/src/blockbook.ts#L74)                                                                                                                         | `all.includes(transfer.from/to)` — three scans per transfer | `all` is the descriptor list (small for EVM); cheap `Set` anyway. **Bundle with P1 #4**                                               |
| [`sendFormUtils.ts:495`](suite-common/wallet-utils/src/sendFormUtils.ts#L495)                                                                                                                                                                                     | `origOutputs.findIndex` per output                          | Bounded by outputs; batch send makes it grow                                                                                          |
| [`ethereumStaking.ts:864`](suite-common/staking/src/ethereumStaking.ts#L864)                                                                                                                                                                                      | `prevPendingTxs.some(...)` inside `.find`                   | Pending set is small                                                                                                                  |
| [`FormCell.tsx:38`](packages/components/src/components/form/FormCell/FormCell.tsx#L38), [`typography/utils.tsx:39`](packages/components/src/components/typography/utils.tsx#L39)                                                                                  | `props.reduce((acc, k) => ({ ...acc, [k]: props[k] }), {})` | **Not asymptotic** — bounded key list (~10). Allocates ~10 objects per call per component render, on the design system's hottest path |
| [`solanaStakingUtils.ts:197`](suite-common/wallet-utils/src/solanaStakingUtils.ts#L197)                                                                                                                                                                           | `return { ...acc, [status]: balance }`                      | `StakeStateType` is a 4-member union; cleanup only                                                                                    |
| [`DeviceCurrentSession.ts:57`](packages/connect/src/device/DeviceCurrentSession.ts#L57), [`formatUtils.ts:54`](packages/connect/src/utils/formatUtils.ts#L54)                                                                                                     | Spread-accumulator reduce                                   | Bounded; cleanup only                                                                                                                 |
| [`useGuideSearch.ts:90`](packages/suite/src/hooks/guide/useGuideSearch.ts#L90), [`useSignAddressOptions.ts:20`](suite/sign-verify/src/useSignAddressOptions.ts#L20), [`coinEnablingFormUtils.ts:12`](suite-native/coin-enabling/src/coinEnablingFormUtils.ts#L12) | Spread-accumulator reduce                                   | Bounded; cleanup only                                                                                                                 |
| [`packages/utils/src/logsManager.ts:63`](packages/utils/src/logsManager.ts#L63)                                                                                                                                                                                   | `logs = logs.concat(...)` in a `forEach`                    | Few writers; cleanup only                                                                                                             |

---

## Bundling: findings that share a file

**File one issue per row, not one per anchor.** Splitting these means multiple PRs fighting over the same context.

| File                                                                    | Anchors                                           | Where they came from                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `suite-common/transaction-search/src/simpleSearchTransactions.ts`       | **29** (P1 #3), 182, **192**, 240                 | wave 2, wave 1, wave 2, **filed as #31124**                                                |
| `packages/blockchain-link-utils/src/blockbook.ts`                       | **238** (P1 #4), 396, 415, 431/432 (P1 #9), 66/74 | wave 2 ×3, wave 1 ×2                                                                       |
| `suite-common/wallet-core/src/transactions/transactionsReducer.ts`      | **71/80/84** (P1 #1), 51/58                       | wave 2, wave 1                                                                             |
| `packages/blockchain-link-utils/src/blockfrost.ts`                      | 167, 173, 258                                     | wave 2 ×3                                                                                  |
| `packages/blockchain-link-utils/src/utils.ts`                           | 8, 45                                             | wave 2 ×2                                                                                  |
| `suite-common/wallet-utils/src/transactionUtils.ts`                     | 130, 915, 391                                     | wave 2 ×2, **filed as #31131**                                                             |
| `suite-common/wallet-utils/src/accountUtils.ts`                         | **372** (P1 #11), 374, 308, 921, 1018             | P1, **filed as #31131**, wave 2, wave 1 ×2 — 372 and 374 are adjacent lines                |
| `packages/coinjoin/src/backend/scanAccount.ts`                          | 51, 59                                            | wave 2 ×2                                                                                  |
| `packages/suite/src/utils/wallet/tokenUtils.ts`                         | 24, 27                                            | wave 2 ×2                                                                                  |
| `packages/blockchain-link/src/workers/solana/index.ts`                  | 71, 591, 633                                      | wave 2, wave 1 ×2                                                                          |
| `packages/blockchain-link/src/workers/electrum/utils/addressManager.ts` | **22** (P1 #11), 81, 49, 25                       | P1, wave 2, wave 1, **filed as #31129** — all four lines are within 60 lines of each other |
| `suite-common/address/src/getReceiveAddressHistory.ts`                  | 37, 142, 150                                      | wave 2, wave 1 ×2                                                                          |
| `suite/coinjoin/src/coinjoinClientActions.ts`                           | 782, 549, 710                                     | wave 2, wave 1 ×2                                                                          |
| `suite/sign-verify/src/useSignAddressOptions.ts`                        | 100, 20                                           | wave 2, wave 1                                                                             |
| `packages/suite/src/hooks/wallet/form/useUtxoSelection.ts`              | 63/66/73/141/173/179 (P1 #10), 94, 125            | wave 1, **filed as #31126 / #31125**                                                       |

---

## Rejected by verification

13 candidates were killed by the adversarial pass. Recording them so the next sweep doesn't re-litigate them — and because several are instructive about where `n` _looks_ unbounded but isn't.

| Candidate                                                                                                                                          | Why it was killed                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suite-common/wallet-core/src/transactions/transactionsSelectors.ts:375`                                                                           | The code is real (line 375 is `const account = selectAccountByKey(state, key as AccountKey);` inside `D.mapWithKey` at 374) but the performance claim does not survive. Two independent reasons. (a) n is not a growing collection: the outer iteration is over transaction buckets = one per account, and the inner `.find` is over the SAME account list; account count is device x passphrase x enabled network x index, i.e. ten…     |
| `suite-native/device-manager/src/components/WalletItem.tsx:19`                                                                                     | Bounded, and the sweeper's own confidence was medium. The list is not 'wallet instances' in any growing sense: WalletList.tsx:25 reads selectDeviceInstances, i.e. the passphrase instances of the ONE currently selected physical device, each of which costs the user a separate passphrase entry plus a full discovery — a handful in practice, a couple of dozen at the extreme. selectAccountsByDeviceState (accountsSelectors.…     |
| `packages/connect/src/api/bitcoin/refTx.ts:348`                                                                                                    | Bounded at every in-repo call site. The only caller is signTransaction.ts:116, which passes `payload.refTxs \|\| payload.account?.transactions`; line 262 returns early on an absent/empty array, so the loop only runs when a caller actually supplies transactions. Suite supplies them in exactly one place — sendFormBitcoinThunks.ts:308 `(transactions[key] \|\| []).filter(tx => tx.txid === txid)`, i.e. AT MOST ONE transaction… |
| `packages/connect/src/api/bitcoin/refTx.ts:119`                                                                                                    | Half the claim is misread and the other half is bounded in practice. Line 168 (`addresses.change.find(addr => addr.address === address)`) sits in `outputsMap`, driven by `tx.outs` of the ORIGINAL transaction being fee-bumped — 2-3 outputs for any realistic RBF target — so that is a handful of linear scans, not a quadratic over two growing collections. Line 119 (`currentInputs.find(...)` inside `tx.ins.map(inputsMap)`…     |
| `suite/metadata-migration/src/entities/createMigrateOutputLabels.ts:45`                                                                            | The code exists as quoted (:45-:47, nested inside the two typedObjectEntries loops at :37/:38), but it fails the deciding question twice. (1) This is one-time migration code — `createMigrateLegacyLabelsToSuiteSync` runs once per account when the user enables Suite Sync — which the audit's own exclusion policy rejects alongside storage/migrations/index.ts. (2) More decisively, the scan is not the bottleneck: every non…     |
| `suite/metadata-migration/src/entities/createMigrateAddressLabels.ts:45`                                                                           | Same rejection as the output-label sibling, and weaker on every axis. The `.find()` at :45-:47 is inside a one-time Suite-Sync-enable migration (migrateLegacyLabelsToSuiteSync.ts:87), and each non-skipped iteration awaits `deps.writeAddressLabel(...)` at :55 — an IndexedDB write that dwarfs the scan. n here is legacy ADDRESS labels, i.e. addresses the user manually labelled, which the sweeper itself concedes is small…     |
| `suite/metadata/src/metadataDataThunks.ts:44`                                                                                                      | Code exists as quoted (line 44 inside disposeMetadataKeys, 38-48), but it is not the modality. The loop is over `selectAccounts(getState())` — a few dozen accounts across remembered devices — and the per-account clone cost grows with the account payload, not with the account count, so the total is O(total account data): linear in the data, never superlinear. It is reached only from disableMetadata (line 69) when the …     |
| `suite-native/accounts/src/selectors.ts:397`                                                                                                       | Code exists (getTokenFiatValue at :382, sort at :397) but n is bounded, not unbounded. `tokensWithBalance` (:348) is derived from `tokens` (:337-346), which for non-Stellar accounts is filtered by `isTokenDefinitionKnown(...) \|\| shownSet.has(...)` — i.e. only tokens present in the curated coin-definitions list or manually un-hidden by the user. The airdrop/spam long tail the finding relies on is filtered out BEFORE t…   |
| `suite-common/wallet-utils/src/transactionUtils.ts:403`                                                                                            | The code is real at :403 (distinct from the already-filed :391 spread-reduce in groupTransactionsByDate), but n is bounded and the sweeper's 'groupBy month' premise is wrong. The only production caller is TransactionGroupedList.tsx:46, which receives groups produced by TransactionList.tsx:142/146 as `groupTransactionsByDate(txs, 'day')` — and those txs are already page-sliced at :125-130 by `perPage = getTxsPerPage(a…     |
| `packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts:163` | Snippet exists verbatim at :163/:165, but n is bounded. `flatAgregatedTokens` is built (:128-140) from `shownWithBalance` returned by getTokens — and getTokens (suite-common/wallet-core/src/tokens/tokenUtils.ts:83-91) routes unknown contracts to `unverifiedWithBalance`, never to `shownWithBalance`, whenever the network has 'coin-definitions'. So the EVM airdrop-spam tail the finding depends on is excluded, and the to…     |
| `suite-native/trading-state/src/selectors/commonSelectors.ts:334`                                                                                  | Snippet exists at :334 (the .map is at :303, not :302), but n is bounded: the rows come from `tokensWithBalance` (:298), which is `filterKnownTokens(networkTokenDefinitions, account.symbol, account.tokens)` (:292) — tokenDefinitionsUtils.ts:42-46 keeps only contracts present in the curated definitions Set, and returns [] when definitions are undefined. The airdrop-spam premise is therefore false; n is the user's cura…     |
| `suite-common/formatters/src/formatters/prepareDateFormatter.ts:12`                                                                                | REJECTED on two independent grounds. (1) The load-bearing claim is false. The candidate's headline evidence is 'the mobile coin-control list mounts one UtxoCard per UTXO of the account, so n is the account's UTXO set'. suite-native/module-send/src/components/CoinControl/UtxoList.tsx:61-68 renders a `<FlashList data={utxos} renderItem={...}>` — it is virtualized, so only the ~10-20 visible UtxoCards mount, never the w…     |

## Considered and rejected as bounded (wave 1)

Checked and deliberately **not** filed — `n` is bounded at a few dozen and structurally always will be, per the skill's opening rule.

- **Networks / symbols / fee levels / account types** — `useNetworkSupport.ts:29-30`, `AddAccountModal.tsx:157`, `walletSettingsReducer.ts:69` (`indexOf` in a comparator, but over ~40 symbols), `defaultFeeLevels.ts:78`, `TokensNavigation.tsx:52`.
- **Device capabilities / transports / adapters** — `deviceFeaturesUtils.ts:77,112`, `AbstractMethod.ts:304`, `DeviceList.ts:260`, `adapters/index.ts:47,50`.
- **Coinjoin rounds and their inputs** — `selectRound.ts:47,65`, `Status.ts:55,92`, `CoinjoinRound.ts:349,380`, `outputDecomposition.ts:36`. Round count is protocol-bounded; inputs per round are coordinator-capped. (`coinjoinClientActions.ts` and `CoinjoinPrison.ts` are exceptions — those are over the user's own UTXO set.)
- **Build / script / one-time code** — `core.webpack.config.ts:87`, `check-workspace-resolutions.ts:11`, `generate-firmware-index.ts`, `storage/migrations/index.ts:1078`, `fetchNft.ts:47`, and the Suite-Sync `metadata-migration/` entities.
- **Storybook-only helpers** — `frameProps.tsx:398`, `typography/utils.tsx:175`. Never ship.
- **Dead code** — `electrum/utils/transaction.ts:134`. The whole block is inside a `/* TODO ... */` comment.
- **`coordinatorUtils.ts:162`** — `chunks` is a literal one-element array. **`utxo-lib/src/transaction/base.ts:153`** — 1–3 witness chunks in practice.

---

## Suggested issue plan

**Tier 1 — file first (5 issues).** Highest cost, clearest fix, all verified twice.

1. **#1 + #2 as siblings** — the `addTransaction` reducer scan and the per-page IDB rewrite. Same trigger (`fetchAllTransactionsForAccountThunk`), and coalescing persistence helps both. #2 needs a design decision on the `order` scheme, so it may split into "debounce the paging writes" (small) and "rework row ordering" (larger).
2. **#4 + #9 + P2 blockbook entries** — one `blockbook.ts` issue. Widest blast radius: default backend for every BTC-like and EVM account.
3. **#3 + the other three `simpleSearchTransactions.ts` anchors** — but note :240 is already **#31124**, so this should extend that issue rather than open a new one.
4. **#5 `arrayPartition` + #11 `arrayDistinct`** — the two quadratic `@trezor/utils` primitives, ~39 call sites between them. #5 is the smallest diff in the report and supplies the fix for #9; #11 should be triaged per call site, and two of its call sites belong inside **#31129** and **#31131**.
5. **#6 legacy labeling** — lead with the guard reorder (tier 1 of the fix), which is a no-op semantically and removes the scan in the common case. Ask the team whether the `@deprecated` branch should just be deleted.

**Tier 2 — file next (P1 remainder + the hot P2s).** #7 `WorkerState`, #8 `selectHistoricRatesByTransactions`, then the P2 entries graded `hot`: `transactionsSelectors.ts:281`, `transactionUtils.ts:130`, `accountUtils.ts:308`, the blockfrost trio, `blockchain-link-utils/utils.ts:8`, `coinjoin/backend/getAccountInfo.ts:44` and `backendUtils.ts:18`, `utxo-lib/coinselect/accumulative.ts:65`, `VirtualizedList.tsx:233`, `tokenUtils.ts` (both packages).

**Fold into existing issues (5).** #10 → **#31125** · `simpleSearchTransactions.ts:192` → **#31124** · `addressManager.ts:49/81` → **#31129** · `signtxLegacy.ts:187` → **#31132** · `transactionUtils.ts`/`accountUtils.ts` spread-reduces → **#31131**.

**Batch as cleanup issues (2–3).** All of P3, split by subsystem so each PR stays reviewable — e.g. one for `blockchain-link`+`coinjoin`, one for `suite`+`suite-native` UI, one for the spread-accumulator sweep across `connect`/`components`/`utils`.

**If only one thing gets done:** #1 and #2. They are the only findings whose cost scales with the _square_ of an account's transaction history on the app's single most common operation — loading an account.

---

## Already filed

Skipped as in-scope for [#28886](https://github.com/trezor/trezor-suite/issues/28886):

| Issue                                                         | Anchor                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [#31122](https://github.com/trezor/trezor-suite/issues/31122) | `packages/utils/src/arrayToDictionary.ts:32`                                   |
| [#31123](https://github.com/trezor/trezor-suite/issues/31123) | `suite-common/wallet-core/src/fiat-rates/fiatRatesReducer.ts:127`              |
| [#31124](https://github.com/trezor/trezor-suite/issues/31124) | `suite-common/transaction-search/src/simpleSearchTransactions.ts:240`          |
| [#31125](https://github.com/trezor/trezor-suite/issues/31125) | `UtxoSelectionList.tsx:69`, `UtxoSelection.tsx:113`, `useUtxoSelection.ts:125` |
| [#31126](https://github.com/trezor/trezor-suite/issues/31126) | `utxoSortingUtils.ts:37`, `useUtxoSelection.ts:94`                             |
| [#31129](https://github.com/trezor/trezor-suite/issues/31129) | `electrum/utils/addressManager.ts:25`                                          |
| [#31130](https://github.com/trezor/trezor-suite/issues/31130) | `coinjoin/src/backend/getAccountUtxo.ts:56`                                    |
| [#31131](https://github.com/trezor/trezor-suite/issues/31131) | `wallet-utils/src/transactionUtils.ts:391`, `accountUtils.ts:374`              |
| [#31132](https://github.com/trezor/trezor-suite/issues/31132) | `connect/src/api/bitcoin/signtx.ts:278`                                        |
| [#31140](https://github.com/trezor/trezor-suite/issues/31140) | `suite-native/module-send/.../CoinControl/UtxoList.tsx:41`                     |

Non-complexity sub-issues (#28880, #29027, #29147, #30497, #31109, #31128, #31133–#31138) are outside this skill's scope and were not swept.
