# `objectPartition` copies the whole object per removed key — index the keys and walk the object once

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Don't spread the accumulator in `.reduce()`"_.

## Where

[`packages/utils/src/objectPartition.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/objectPartition.ts#L12) (also 15) — `objectPartition`

`obj` is the electrum backend's `subscribedAddrs` map (address -> scripthash) covering every subscribed address of every account, and `subscribedAccs` (descriptor -> AccountAddresses). `keys` is the full address list of the accounts being unsubscribed. Both grow with account count and per-account address derivation (used + unused + change), i.e. hundreds to low thousands for an active BTC account.

## Before

```ts
 * @param keys Array of object keys for inclusion in the first object.
 * @returns Array of two objects - the first object has only keys from the array and the second the remaining keys
 */
export const objectPartition = <T>(obj: Obj<T>, keys: string[]): [Obj<T>, Obj<T>] =>
    keys.reduce(
        ([included, excluded], key) => {
            const { [key]: value, ...rest } = excluded;

            return typeof value !== 'undefined'
                ? [{ ...included, [key]: value }, rest]
                : [included, excluded];
        },
        [{}, obj],
    );
```

## After

Index the removal keys once and walk the object a single time: Same observable result (only keys actually present in `obj` land in `included`); complexity drops from O(m*n + m^2) to O(n + m).

```ts
export const objectPartition = <T>(obj: Obj<T>, keys: string[]): [Obj<T>, Obj<T>] => {
    const keySet = new Set(keys);
    const included: Obj<T> = {};
    const excluded: Obj<T> = {};
    for (const [key, value] of Object.entries(obj)) {
        (keySet.has(key) ? included : excluded)[key] = value;
    }
    return [included, excluded];
};
```

## Why it matters

**`O(m*n + m^2) property copies and O(m) throwaway objects (m = keys.length, n = Object.keys(obj).length)`** — cold path.

The rest-destructuring `{ [key]: value, ...rest } = excluded` shallow-copies the entire remaining map on every single key, so this is the textbook accumulator-copy quadratic even though it is written as a destructure rather than a literal spread. Concrete callers: packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:38 (`removeAddresses` -> objectPartition(subscribedAddrs, addresses)) and :64 (`removeAccounts` -> objectPartition(subscribedAccs, descriptors)), reached whenever the electrum worker unsubscribes accounts (wallet switch, account removal, disconnect). Removing one 500-address account from a 2000-entry map costs ~1M property copies and 500 throwaway objects, all on the worker thread.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Mitigating context the issue should state honestly: both call sites are in the electrum worker, which is an opt-in custom backend, and they run on unsubscribe (wallet switch / account removal / disconnect), not on a render or reducer path — that is why this is P2 and not P1. Two behaviour deltas in the proposed Set-based rewrite, both benign here but worth naming: (1) the original puts a key whose value is literally `undefined` into `excluded` (the `typeof value !== 'undefined'` guard), a single-pass Object.entries version would put it into `included`; (2) key insertion order in `included` changes from `keys` order to `obj` order — both callers only do `Object.values(toRemove)`, so order is not observable. packages/utils/src/objectPartition.test.ts covers presence/absence semantics and should keep passing; add a case for an explicitly-undefined value if the guard is dropped. Same file also has the sibling accumulator-spread reduces at addressManager.ts:25 and :49, already filed/reported — reference them so the fixes land together.

- Spans more than one file — see also `packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:38`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
