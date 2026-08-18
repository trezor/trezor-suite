# Coinjoin request reconciliation is O(n²) over UTXOs — the same block, duplicated twice

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite/coinjoin/src/coinjoinClientActions.ts:782`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinClientActions.ts#L782) (also 786) — `initCoinjoinService`

`utxos` = `realAccount.utxo.map(getUtxoOutpoint)` and `usedChange` = the account's spent change addresses — both arrays are correctly hoisted above the loop, but they are scanned linearly by `.includes` for every entry of `account.prison`, which itself holds one inmate per banned input/output the coordinator has ever sentenced for that account.

[`suite/coinjoin/src/coinjoinClientActions.ts:549`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinClientActions.ts#L549) — ownership-proof reconciliation

[`suite/coinjoin/src/coinjoinClientActions.ts:710`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinClientActions.ts#L710) — signature reconciliation

## Before

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

Build sets once, outside the `flatMap`: `const utxoSet = new Set(realAccount.utxo!.map(getUtxoOutpoint));` and `const usedChangeSet = new Set(realAccount.addresses!.change.filter(a => a.transfers > 0).map(a => a.address));`, then use `.has(id)`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### 2. The identical unresolved-input sweep, duplicated at `:549` and `:710`

Both copies are worse than plain O(n²): the loop `push`es into the very array it scans, so the scanned array grows as the loop runs.

```ts
// finally walk thru all requested utxos and find not resolved
request.inputs.forEach(utxo => {
    if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
        response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
    }
});
```

Track resolution in a `Set`, adding to it as the loop pushes:

```ts
// finally walk thru all requested utxos and find not resolved
const resolvedOutpoints = new Set(response.inputs.map(u => u.outpoint));

request.inputs.forEach(utxo => {
    if (!resolvedOutpoints.has(utxo.outpoint)) {
        resolvedOutpoints.add(utxo.outpoint);
        response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
    }
});
```

The two copies are character-identical. Collapsing them into one shared helper is worth doing in the same PR — otherwise the next fix has to be applied twice again.

## Why it matters

**`O(prisonEntries x (accountUtxos + usedChangeAddresses)), only for inmates with sentenceEnd === Infinity`** — cold path.

`initCoinjoinService` runs at startup for every persisted coinjoin account (via `restoreCoinjoinAccounts`, suite/coinjoin/src/coinjoinAccountActions.ts:922) and again on every `fetchAndUpdateAccount`/`createPendingTransaction`. Coinjoin accounts are the ones that accumulate the most UTXOs and change addresses by design, and the persisted prison grows with every round in which an input or output was banned. Both factors therefore grow with how much the user has coinjoined.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Straight `Array -> Set` swap at :773/:776 with `.has(id)` at :782/:786; `utxos` and `usedChange` have no other use in the flatMap, so no companion edits and no unused imports. Keep the non-null assertions (`realAccount.utxo!`, `realAccount.addresses!`) — they are load-bearing for the existing types and the `if (!realAccount) return [];` guard at :771 is the only null check. Set membership is by string value here (outpoints and addresses), so no object-identity hazard. Low payoff: worth folding into any other edit in this function rather than a standalone PR.

- Spans more than one file — see also `suite/coinjoin/src/coinjoinAccountActions.ts:922`.

- **Audit guidance.** Audit finding #52 plus the wave-2 P3 at :782 (initCoinjoinService). :549 and :710 are the IDENTICAL block duplicated — and worse than plain O(n^2) because the loop pushes into the very array it scans. Fix: `const resolvedOutpoints = new Set(response.inputs.map(u => u.outpoint));` above the loop, adding to it as you push. Call out that the duplication itself is worth collapsing.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
