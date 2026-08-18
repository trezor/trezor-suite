# P3 complexity cleanups — coinjoin and utxo-lib

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/coinjoin/src/backend/scanAccount.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L51) (also 49, 50) — `scanAccount (filter iteration loop)`

[`packages/coinjoin/src/client/Account.ts:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/Account.ts#L81) (also 78,79,80) — `Account.findDetainedElements`

[`packages/coinjoin/src/client/CoinjoinPrison.ts:79`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/CoinjoinPrison.ts#L79) (also 80,81) — `CoinjoinPrison.detain`

[`packages/coinjoin/src/client/round/selectRound.ts:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/round/selectRound.ts#L143) (also 127,150,179) — `getAccountCandidates`

[`packages/utxo-lib/src/coinselect/coinselectUtils.ts:308`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/coinselectUtils.ts#L308) (also 304, 305) — `sortByScore / utxoScore`

[`packages/utxo-lib/src/coinselect/index.ts:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/index.ts#L14) (also 18) — `coinselect`

[`suite/coinjoin/src/coinjoinClientActions.ts:782`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinClientActions.ts#L782) (also 786) — `initCoinjoinService`

`blocksScanned` = every block between the checkpoint and the chain tip; `addresses` = receive + change scripts

## Before

### `scanAccount` — `scanAccount.ts:51`

```ts
const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal, onProgressInfo });

for await (const { blockHash, blockHeight, filter, filterParams } of everyFilter) {
    const isMatch = getMultiFilter(filter, filterParams);
    const scripts = addresses.receive.concat(addresses.change).map(({ script }) => script);

    if (isMatch(scripts)) {
        const block = await client.fetchBlock(blockHeight, { signal: abortSignal });
        if (mempool?.status === 'running') {
            mempool.removeTransactions(block.txs.map(({ txid }) => txid));
        }
```

### `Account.findDetainedElements` — `Account.ts:81`

```ts
const registeredOutputs = getRoundEvents('OutputAdded', round.CoinjoinState.Events);
const inputs = registeredInputs
    .flatMap(
        ({ Coin }) =>
            this.utxos.find(a => compareOutpoint(a.outpoint, Coin.Outpoint)) ?? [],
    )
    .map(input => ({ accountKey, ...input }));

const outputs = registeredOutputs
    .flatMap(
        ({ Output }) =>
```

### `CoinjoinPrison.detain` — `CoinjoinPrison.ts:79`

```ts
    type = 'account';
    id = inmate.accountKey;
}

this.inmates = this.inmates
    .filter(i => i.id !== id)
    .concat({
        id,
        type,
        accountKey: inmate.accountKey,
        sentenceEnd,
```

### `getAccountCandidates` — `selectRound.ts:143`

```ts
// filter out InputLongBanned utxos until we know how to deal with them...
const [_, whitelistedUtxos] = arrayPartition(
    account.utxos,
    utxo =>
        prison.isDetained(utxo.outpoint)?.errorCode ===
        WabiSabiProtocolErrorCode.InputLongBanned,
);

// collect known InputBanned
const bannedUtxos = whitelistedUtxos.filter(
    utxo =>
```

### `sortByScore / utxoScore` — `coinselectUtils.ts:308`

```ts
export function utxoScore(x: CoinSelectInput, feeRate: number) {
    return x.value - BigInt(getFeeForBytes(feeRate, inputBytes(x)));
}

export function sortByScore(feeRate: number) {
    return (a: CoinSelectInput, b: CoinSelectInput) => {
        const difference = utxoScore(a, feeRate) - utxoScore(b, feeRate);
        if (difference === ZERO) {
            return a.i - b.i;
        }
```

### `coinselect` — `index.ts:14`

```ts
    if (options.sendMaxOutputIndex >= 0) {
        return split(inputs, outputs, feeRate, options);
    }

    const sortedInputs =
        options.sortingStrategy === 'none' ? inputs : inputs.sort(sortByScore(feeRate));

    const algorithm = tryConfirmed(anyOf([branchAndBound, accumulative]), options);

    return algorithm(sortedInputs, outputs, feeRate, options);
}
```

### `initCoinjoinService` — `coinjoinClientActions.ts:782`

```ts
return Object.entries(account.prison ?? {}).flatMap(([id, inmate]) => {
    // clear outdated info with Infinity sentence
    if (inmate.sentenceEnd === Infinity) {
        // utxos which are no longer in account (spent utxos)
        if (inmate.type === 'input' && !utxos.includes(id)) {
            return [];
        }
        // change addresses with transfers (used addresses)
        if (inmate.type === 'output' && usedChange.includes(id)) {
            return [];
        }
```

## After

### `scanAccount`

Hoist the array and refresh it only when new addresses appear: keep `let scripts = [...]` before the loop, and after `addresses.analyze` returns newly derived receive/change entries, append their scripts (or rebuild only then). `getMultiFilter` already accepts the same `Buffer[]` each call.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `Account.findDetainedElements`

Index once above `rounds.flatMap`: `const utxoByOutpoint = new Map(this.utxos.map(u => [u.outpoint.toLowerCase(), u]))` (the outpoint strings are hex; compareOutpoint exists only to paper over the coordinator's uppercase vs Suite's lowercase, per the comment at transactionSigning.ts:59). Then each registered input is one `utxoByOutpoint.get(Coin.Outpoint.toLowerCase())`, dropping the Buffer allocations entirely and making the whole method O(roundInputs + accountUtxos).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `CoinjoinPrison.detain`

Store the prison as `Map<string, CoinjoinPrisonInmate>` and make detain a single `this.inmates.set(id, {...})` - the `.filter(i => i.id !== id)` exists only to dedupe by id, which a Map does for free. Materialise the array once in `dispatchChange` (it is already throttled through setImmediate) for the 'change' event and for the persisted shape, and rewrite getBlameOfInmates/releaseRegisteredInmates/release as Map traversals. Same change also fixes isDetained above.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getAccountCandidates`

Give CoinjoinPrison an id-keyed index and make isDetained O(1): keep `private inmatesById = new Map<string, CoinjoinPrisonInmate>()` alongside (or instead of) the array, rebuild it in the constructor/detain/release, and `return this.inmatesById.get(id)`. In getAccountCandidates also replace `registeredOutpoints` (:87-89) with a `Set<string>` so :179 is `!registeredOutpoints.has(utxo.outpoint)`, and fold the two consecutive isDetained passes at :140-145 and :148-152 into one traversal that reads each utxo's inmate once. That turns four O(utxos x inmates) passes into O(utxos + inmates).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `sortByScore / utxoScore`

Schwartzian transform: compute the score once per UTXO above the sort (`const scores = new Map(inputs.map(u => [u, utxoScore(u, feeRate)]))`, or precompute alongside the existing `calculateEffectiveValues`), then the comparator is two Map reads and one subtraction. Note the sort at index.ts:14 also mutates the caller's `inputs` array in place, so the precomputed keys can simply ride along on the transformed array.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `coinselect`

Precompute once above the sort: `const score = new Map(inputs.map(i => [i, utxoScore(i, feeRate)]))`, then the comparator is two Map reads plus the `a.utxo.i - b.utxo.i` tiebreak. Also prefer `toSorted` here — `inputs.sort(...)` mutates the caller-supplied array.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `initCoinjoinService`

Build sets once, outside the `flatMap`: `const utxoSet = new Set(realAccount.utxo!.map(getUtxoOutpoint));` and `const usedChangeSet = new Set(realAccount.addresses!.change.filter(a => a.transfers > 0).map(a => a.address));`, then use `.has(id)`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`Constant-factor: 2 array allocations + O(A) element copies per block. NOT an asymptotic change — isMatch(scripts) on the next line is already O(A) per block.`** — warm path.

The loop body is loop-invariant with respect to `addresses`: the arrays only change inside `addresses.analyze` at line 58, which runs only on a filter match. Yet `concat` + `map` allocate two fresh arrays of the full address set on every single block. The block count is large by design — `suite/coinjoin/src/config.ts:32` pins mainnet BTC `baseBlockHeight: 778666`, so a first-time discovery iterates ~130,000 blocks, and any resume from an old checkpoint iterates the gap. With a used coinjoin account (hundreds of change addresses) that is tens of millions of element copies and ~260,000 array allocations of pure overhead on the discovery path.

**`O(roundsWithPhase>0 x registeredInputsPerRound x accountUtxos) with 2 Buffer allocations per probe; outer factors are protocol-bounded, the inner `this.utxos` is not`** — cold path.

`this.utxos` grows with the account (hundreds to low thousands of small outputs is the normal end-state of coinjoining), and the outer factor is the concatenation of every registered input across every non-phase-0 round in `this.status.rounds`, which for WabiSabi is up to a few hundred inputs per round. Worse than a plain nested scan: the inner predicate is `compareOutpoint = Buffer.from(a,'hex').compare(Buffer.from(b,'hex')) === 0`, so each of the ~10^5-10^6 probes allocates two Buffers, and `Buffer.from(Coin.Outpoint,'hex')` is loop-invariant for the whole inner scan yet re-allocated on every element. Entry point: CoinjoinClient.registerAccount:97 - a user-initiated, synchronous, blocking step at coinjoin session start, before the first round can be joined.

**`O(k x inmates) array-element copies per detention loop (2 full array allocations per detain call); k = one round's inputs + change addresses (tens), inmates = a few hundred late in a session`** — warm path.

`detain` rebuilds the whole inmates array on every call (a `.filter()` copy plus a `.concat()` copy), and every caller calls it inside a loop: endedRound.ts:60 (`[...inputs, ...addresses].forEach(vinvout => prison.detain(...))`), endedRound.ts:73 and :81 (the two forEach loops that detain signed inputs and used addresses with sentenceEnd Infinity), CoinjoinPrison.detainForBlameRound:111-113, and CoinjoinClient.registerAccount:99-102 (`detained.forEach(item => this.prison.detain(item))`). Because the Infinity-sentenced entries are never released (release() at :145-155 returns true for `sentenceEnd > now` and Infinity always wins), the array the loop copies grows with every completed round, so the per-round cost grows linearly with session age and the session total is quadratic. Runs on the round-completion path of every coinjoin round (endedRound) and on session start (registerAccount).

**`O(accountUtxos x prisonInmates), ~4 full passes per status tick (every 20-30s per constants.ts STATUS_TIMEOUT), plus O(changeAddresses x inmates) at :126`** — hot path.

Both factors grow. (a) A coinjoin account's raison d'etre is splitting into many small outputs: hundreds to low thousands of UTXOs after a few dozen rounds, and every one of them is passed in RegisterAccountParams. (b) CoinjoinPrison.inmates grows monotonically within a session and ACROSS sessions: endedRound.ts:73 and :81 detain every signed input and every used change address of a broadcasted round with `sentenceEnd: Infinity`, and CoinjoinPrison.release (:145) keeps anything whose sentenceEnd is Infinity forever; the prison is persisted and restored per account (see the already-accepted coinjoinClientActions.ts:782 finding, whose own text describes account.prison as holding 'one inmate per banned input/output the coordinator has ever sentenced for that account'). isDetained (CoinjoinPrison.ts:107) is a bare `this.inmates.find`, so each of the four passes over account.utxos is a full linear scan of the prison per UTXO. Entry point: CoinjoinClient.onStatusUpdate -> CoinjoinRound.create (CoinjoinRound.ts:155) -> selectRound -> getAccountCandidates. onStatusUpdate fires on every coordinator status poll (status is put in 'enabled' mode = seconds apart while a session runs) and again on every registerAccount/updateAccount, which Suite dispatches whenever the account's UTXO set changes.

**`O(n log n) comparisons, each allocating 3 BigInts and calling inputBytes twice — same asymptotics as today, ~2x fewer score computations and ~n log n fewer allocations after the fix`** — warm path.

`utxoScore` is recomputed inside the comparator, and each call does `x.value - BigInt(getFeeForBytes(feeRate, inputBytes(x)))` — a `BigInt(...)` construction plus a BigInt subtraction, plus `inputWeight`'s `SEGWIT_INPUT_SCRIPT_TYPES.includes` — so every one of the ~n log n comparisons allocates rather than reading precomputed fields, which is exactly the allocating-comparator case the skill calls out. n is the UTXO set (thousands for coinjoin or receive-heavy accounts) and the sort re-runs once per fee level per compose from `packages/connect/src/api/composeTransaction.ts:86`, on every send-form change.

**`O(utxos log utxos) BigInt allocations + weight recomputations`** — hot path.

`sortByScore`'s comparator (coinselectUtils.ts:310) calls `utxoScore` twice per comparison, and `utxoScore` does `x.value - BigInt(getFeeForBytes(feeRate, inputBytes(x)))` — a BigInt conversion plus a script-weight recomputation each time. The score is a pure function of `(input, feeRate)`, so it is recomputed ~2*log2(n) times per element instead of once. n is the account's UTXO count, which grows without bound with account use and is in the thousands for coinjoin/consolidation-averse wallets. Entry point: `composeTx` (packages/utxo-lib/src/compose/index.ts:23) via `@trezor/connect` `TransactionComposer.compose`, which runs once per fee level on every send-form recompute — i.e. several times per keystroke in the amount field.

**`O(prisonEntries x (accountUtxos + usedChangeAddresses)), only for inmates with sentenceEnd === Infinity`** — cold path.

`initCoinjoinService` runs at startup for every persisted coinjoin account (via `restoreCoinjoinAccounts`, suite/coinjoin/src/coinjoinAccountActions.ts:922) and again on every `fetchAndUpdateAccount`/`createPendingTransaction`. Coinjoin accounts are the ones that accumulate the most UTXOs and change addresses by design, and the persisted prison grows with every round in which an input or output was banned. Both factors therefore grow with how much the user has coinjoined.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- If filed at all, file it as allocation churn on the discovery loop, not as a complexity bug, and say so explicitly. Fix constraint: the arrays are mutated in place by CoinjoinAddressController.deriveMore's `derived.push(...)` (CoinjoinAddressController.ts:87), so a hoisted `scripts` must be refreshed after line 58. `addresses.analyze` conveniently returns `{ receive, change }` containing ONLY the newly derived entries (analyzeType returns `derived.slice(start)`), so append their `.script` values rather than rebuilding. Order does not matter — matchAny is a set-membership test. Do not hoist `getMultiFilter` itself; it is per-block by construction (each block has its own filterHex/key). If someone wants the real win on this loop it is caching/streaming the filter decode, which is a different issue.

- The identical pattern sits immediately below at Account.ts:83-88 — `registeredOutputs.flatMap(({ Output }) => this.changeAddresses.find(o => Output.ScriptPubKey === o.scriptPubKey) ?? [])`, scanning the account's whole change-address list per registered output. Fix both in one pass by indexing above `rounds.flatMap`. BEHAVIOUR CAVEAT on the proposed Map fix: keying `this.utxos` by `outpoint.toLowerCase()` and looking up `Coin.Outpoint.toLowerCase()` is equivalent to compareOutpoint only for well-formed hex — `Buffer.from(s,'hex')` silently truncates at the first invalid pair, so two malformed-but-different strings can compare equal today and would stop matching after the change. Outpoints here are fixed-length hex from the coordinator, so this is theoretical, but say so in the issue. compareOutpoint exists only to bridge the coordinator's uppercase vs Suite's lowercase (see the comment near transactionSigning.ts:59); it has two other call sites, so leave the helper in place and only bypass it here. Note the outputs branch already uses strict `===` on scriptPubKey, so it can be indexed with no case handling at all. Grading is medium-confidence on impact, not on existence: the pattern is unambiguous, the size of `this.status.rounds` with Phase > 0 at registration time is the uncertain factor.

- Spans more than one file — see also `packages/coinjoin/src/utils/roundUtils.ts:200`.

- File this together with (or folded into) the selectRound.ts:143 finding — one Map-backed CoinjoinPrison fixes both; do not file as an independent issue, the standalone win is not measurable. `.filter(i => i.id !== id)` exists purely to dedupe by id, which `Map.set` gives for free. Companion rewrites needed in the same class if the array becomes a Map: getBlameOfInmates (:119-121), releaseBlameOfInmates (:123-127), releaseRegisteredInmates (:130-140), release (:143-160, which also compares `prevLen !== this.inmates.length` to decide whether to dispatchChange — use `map.size`). Two external consumers read the array shape and must keep working: dispatchChange emits `{ prison: this.inmates }` (:50) and selectRound.ts:89 does `prison.inmates.map(i => i.id)`; CoinjoinPrisonShape in packages/coinjoin/src/types/prison.ts types the public surface, so the array is part of the contract — keep it as a derived value rather than deleting it.

- Spans more than one file — see also `packages/coinjoin/src/client/round/endedRound.ts:73`.

- The fix must land in packages/coinjoin/src/client/CoinjoinPrison.ts, not in selectRound.ts: add `private inmatesById = new Map<string, CoinjoinPrisonInmate>()` kept in sync by the constructor, detain(), releaseBlameOfInmates(), releaseRegisteredInmates() and release(), and make isDetained() a single `this.inmatesById.get(id)`. Behaviour delta to preserve: today `isDetained` returns the FIRST match by id and `detain` dedupes by id via `.filter(i => i.id !== id)`, so a Map keyed by id is exactly equivalent. Companion edits in selectRound.ts: (a) build `registeredOutpoints` at :87-89 as a `Set<string>` so :179 becomes `.has(...)`; (b) fold the two consecutive isDetained passes at :140-145 and :148-152 into one traversal; (c) :106-114 should index `blameOfInputs` (from prison.getBlameOfInmates()) into a Map by id instead of `.find` per utxo. Note `this.inmates` is a public field on CoinjoinPrison and is read directly at selectRound.ts:89 and emitted in dispatchChange ('change' event payload `{ prison: this.inmates }`, consumed by suite/coinjoin/src/coinjoinClientActions.ts:91-94 and persisted into the redux `account.prison` record), so if the array is replaced by a Map it must still be materialised for those two consumers — keeping the array as a derived getter is the lowest-risk shape. Prison is persisted and restored across restarts (coinjoinClientActions.ts:765-795), though restore does prune Infinity-sentenced inputs that are no longer in the account's utxo set — so the unbounded growth is within a single running session, not across app restarts; state that accurately in the issue rather than the candidate's 'and ACROSS sessions'.

- Spans more than one file — see also `packages/coinjoin/src/client/CoinjoinPrison.ts:107`.

- Two correctness constraints the fix must respect. (1) The tie-break `a.i - b.i` at line 311-312 makes the sort stable by original index and MUST be preserved — a Schwartzian transform that reorders equal-score entries changes which UTXOs compose picks, which will move existing compose fixtures. (2) index.ts:14 is `inputs.sort(sortByScore(feeRate))`, which sorts the caller's array in place; a decorate-sort-undecorate rewrite loses that side effect. That is safe here — `coinselectRequest.inputs` comes from validateAndParseRequest (compose/request.ts) and is a freshly built array not observed elsewhere — but verify before changing, and keep `sortedInputs` as the value the algorithm receives either way. A Map keyed on the CoinSelectInput object is fine (object identity is stable through the sort; the same objects flow into accumulative/branchAndBound), but a parallel array of `{ input, score, i }` is simpler and avoids the Map lookup per comparison. Note branchAndBound.ts:17 calculateEffectiveValues already computes essentially this same value per utxo — the two could share one precomputation pass.

- Spans more than one file — see also `packages/utxo-lib/src/coinselect/index.ts:14`.

- Fix must key the precomputed Map on the input OBJECT identity (`new Map(inputs.map(i => [i, utxoScore(i, feeRate)]))`) — keying on `i.i` also works since the tiebreak already uses it and it is unique per input. Do NOT switch `inputs.sort` to `toSorted` as part of this: utxo-lib is a published package and callers (@trezor/connect TransactionComposer) may rely on the in-place ordering; that is a separate, behaviour-changing decision. Also keep the `difference === ZERO` BigInt comparison semantics — `utxoScore` returns bigint, so a naive `scoreA - scoreB` return would be a bigint where the comparator must return a number (TypeScript will flag it, but only if the Map value type stays bigint).

- Spans more than one file — see also `packages/utxo-lib/src/coinselect/coinselectUtils.ts:310`.

- Straight `Array -> Set` swap at :773/:776 with `.has(id)` at :782/:786; `utxos` and `usedChange` have no other use in the flatMap, so no companion edits and no unused imports. Keep the non-null assertions (`realAccount.utxo!`, `realAccount.addresses!`) — they are load-bearing for the existing types and the `if (!realAccount) return [];` guard at :771 is the only null check. Set membership is by string value here (outpoints and addresses), so no object-identity hazard. Low payoff: worth folding into any other edit in this function rather than a standalone PR.

- Spans more than one file — see also `suite/coinjoin/src/coinjoinAccountActions.ts:922`.

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
