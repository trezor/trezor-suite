# Six more O(n²) UTXO scans remain in `useUtxoSelection` after #31125 / #31126 — extend #31125's outpoint Set

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. #31126 fixes line 94 of this hook and #31125 fixes line 125; six sibling scans in the same 235-line file are untouched, and two of them sit in the _"select all"_ handler — the one action that drives `selectedUtxos` up to the size of `account.utxo`. **This should extend #31125 rather than be filed as a competing issue**: same file, same key helper, and #31125's branch already carries the type change and the destructure this needs.

## Where

[`packages/suite/src/hooks/wallet/form/useUtxoSelection.ts:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L63), [`:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L66), [`:73`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L73), [`:141`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L141), [`:173`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L173), [`:179`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/form/useUtxoSelection.ts#L179)

Three independent places in the coin-control hook pair one UTXO array against another with a nested `some` / `find` / `includes`. Every one of them compares on `(txid, vout)` — a pair the file already has a canonical string key for (`getUtxoOutpoint`, used at `:101` and introduced as a `Set` by #31125), so each nested scan can become a single hash lookup.

## Before

### 1. The prune effect scans `account.utxo` and the coinjoin round per selected UTXO (`:63`, `:66`, `:73`)

```ts
// watch changes of account utxos AND utxos registered in coinjoin Round,
// exclude spent/registered utxos from the subset of selectedUtxos
useEffect(() => {
    if (isCoinControlEnabled && selectedUtxos.length > 0) {
        const spentUtxos = selectedUtxos.filter(
            selected => !account.utxo?.some(utxo => isSameUtxo(selected, utxo)),
        );
        const registeredUtxos = selectedUtxos.filter(selected =>
            coinjoinRegisteredUtxos.some(utxo => isSameUtxo(selected, utxo)),
        );

        if (spentUtxos.length > 0 || registeredUtxos.length > 0) {
            setValue(
                'selectedUtxos',
                selectedUtxos.filter(u => !spentUtxos.includes(u) && !registeredUtxos.includes(u)),
            );
            composeRequest();
        }
    }
}, [
    isCoinControlEnabled,
    selectedUtxos,
    account.utxo,
    coinjoinRegisteredUtxos,
    setValue,
    composeRequest,
]);
```

### 2. `preselectedUtxos` scans every composed input per account UTXO (`:141`)

```ts
// UTXOs corresponding to the inputs
// it is a different object type, but some properties are shared between the two
const preselectedUtxos = useMemo(
    () =>
        account.utxo?.filter(utxo =>
            composedInputs.some(
                input => input.prev_hash === utxo.txid && input.prev_index === utxo.vout,
            ),
        ) || [],
    [account.utxo, composedInputs],
);
```

### 3. `toggleCheckAllUtxos` — the "select all" handler (`:173`, `:179`)

```ts
// uncheck all UTXOs or check all spendable UTXOs and enable coin control
const toggleCheckAllUtxos = () => {
    if (allUtxosSelected) {
        setValue('selectedUtxos', []);
    } else {
        // check top category and keep any already checked UTXOs from other categories
        const selectedUtxosFromLowerCategories = selectedUtxos.filter(
            selected => !topCategory?.find(utxo => isSameUtxo(selected, utxo)),
        );
        setValue(
            'selectedUtxos',
            topCategory
                .concat(selectedUtxosFromLowerCategories)
                .filter(utxo => !coinjoinRegisteredUtxos.includes(utxo)),
        );
        setValue('isCoinControlEnabled', true);
    }
    composeRequest();
};
```

## After

### 0. Two indexes next to #31125's `selectedUtxoOutpoints` (new, after `:57`)

```ts
const accountUtxoOutpoints = useMemo(
    () => new Set((account.utxo ?? []).map(getUtxoOutpoint)),
    [account.utxo],
);
const coinjoinRegisteredOutpoints = useMemo(
    () => new Set(coinjoinRegisteredUtxos.map(getUtxoOutpoint)),
    [coinjoinRegisteredUtxos],
);
```

### 1. The prune effect becomes one pass

```ts
// watch changes of account utxos AND utxos registered in coinjoin Round,
// exclude spent/registered utxos from the subset of selectedUtxos
useEffect(() => {
    if (isCoinControlEnabled && selectedUtxos.length > 0) {
        const remainingUtxos = selectedUtxos.filter(selected => {
            const outpoint = getUtxoOutpoint(selected);

            return accountUtxoOutpoints.has(outpoint) && !coinjoinRegisteredOutpoints.has(outpoint);
        });

        if (remainingUtxos.length !== selectedUtxos.length) {
            setValue('selectedUtxos', remainingUtxos);
            composeRequest();
        }
    }
}, [
    isCoinControlEnabled,
    selectedUtxos,
    accountUtxoOutpoints,
    coinjoinRegisteredOutpoints,
    setValue,
    composeRequest,
]);
```

### 2. `preselectedUtxos` looks the inputs up by key

```ts
// outpoints of the composed transaction's inputs, keyed like the account's UTXOs
const composedInputOutpoints = useMemo(
    () => new Set(composedInputs.map(input => `${input.prev_hash}:${input.prev_index}`)),
    [composedInputs],
);

// UTXOs corresponding to the inputs
// it is a different object type, but some properties are shared between the two
const preselectedUtxos = useMemo(
    () =>
        account.utxo?.filter(utxo => composedInputOutpoints.has(`${utxo.txid}:${utxo.vout}`)) || [],
    [account.utxo, composedInputOutpoints],
);
```

### 3. `toggleCheckAllUtxos` builds its index once per click

```ts
// uncheck all UTXOs or check all spendable UTXOs and enable coin control
const toggleCheckAllUtxos = () => {
    if (allUtxosSelected) {
        setValue('selectedUtxos', []);
    } else {
        const topCategoryOutpoints = new Set(topCategory.map(getUtxoOutpoint));

        // check top category and keep any already checked UTXOs from other categories
        const selectedUtxosFromLowerCategories = selectedUtxos.filter(
            selected => !topCategoryOutpoints.has(getUtxoOutpoint(selected)),
        );
        setValue(
            'selectedUtxos',
            topCategory
                .concat(selectedUtxosFromLowerCategories)
                .filter(utxo => !coinjoinRegisteredOutpoints.has(getUtxoOutpoint(utxo))),
        );
        setValue('isCoinControlEnabled', true);
    }
    composeRequest();
};
```

## Why it matters

Every hunk is O(a × b) over two UTXO-sized collections and becomes O(a + b).

`n` at runtime is the account's UTXO set. It is unbounded in the only direction that matters: coinjoin fragments a wallet into many small outputs by design, and any account that has received a long tail of small payments accumulates them — the coin-control list exists precisely because that set gets big. The list is not virtualized and `UtxoSelection` is not `memo`-wrapped (see #31125), so all of it is mounted at once.

The three sites differ in when they fire:

- **`:63`/`:66`/`:73`** run in an effect whose deps are `selectedUtxos`, `account.utxo` and `coinjoinRegisteredUtxos` — so on every row click, on every account update (i.e. every new block), and on every coinjoin round registration. `selectedUtxos × account.utxo` plus `selectedUtxos × registered` plus `selectedUtxos²` from the two `Array.includes` at `:74`.
- **`:141`** recomputes whenever `composedLevels` changes, which is once per compose result — i.e. per (debounced) keystroke in the amount/address fields of the send form. `composedInputs` is bounded by the composed transaction's input count, which on a max-send or sweep is essentially the whole UTXO set, so this approaches `account.utxo²`.
- **`:173`/`:179`** are the _"select all"_ checkbox. This is the worst of the three because it is self-amplifying: `:173` scans `topCategory` per already-selected UTXO, `:179` scans `coinjoinRegisteredUtxos` per element of `topCategory.concat(...)`, and the `setValue` it performs then makes `selectedUtxos.length === topCategory.length`, which immediately re-fires the effect above with `n` at its maximum. One click pays `:173` + `:179` + `:63` + `:66` + `:73`, the last three at peak `n`.

No number here is measured. For scale, #31126 reports **167 ms → 1.7 ms at 5000 UTXOs / 20000 txs** for the sort-and-lookup pair on this same coin-control screen — that is that issue's measurement of a different line in this file, not a measurement of these six.

## Notes

- **Extend #31125, do not open a competing issue.** #31125 already edits this file (adds the `selectedUtxoOutpoints` memo at `:57` and the field to `UtxoSelectionContext` in `packages/suite/src/types/wallet/sendForm.ts:43`) and #31126 rewrites `:94`. Three PRs against a 235-line hook would conflict on the same hunks. Land #31126 and #31125 first; this stacks on #31125.
- **Correction to the audit's shorthand:** #31125's `selectedUtxoOutpoints` does _not_ by itself fix `:63`/`:66`/`:73`/`:173`. Those iterate `selectedUtxos` and scan _another_ array, so each needs a `Set` over the collection being **scanned** — `account.utxo`, `coinjoinRegisteredUtxos`, `topCategory`. What #31125 supplies is the key helper and the precedent, not the index. `:125` (the one #31125 does fix) is the only site whose scanned collection is `selectedUtxos` itself.
- **Behaviour delta at `:179` — reference identity becomes value identity, and that is a fix.** `coinjoinRegisteredUtxos.includes(utxo)` is `===` on object references. It works for the `topCategory` half (those elements come from `account.utxo`, and `sortUtxos` at `packages/suite/src/utils/wallet/utxoSortingUtils.ts:78` shallow-copies the array, so element references survive the sort; `useCoinjoinRegisteredUtxos` pushes `account.utxo` elements too). It does **not** work for `selectedUtxosFromLowerCategories`, which are form-state objects captured earlier and go stale the moment an account update replaces `account.utxo` with fresh objects — exactly the case `isSameUtxo` exists to handle six lines above. Keying by outpoint makes `:179` consistent with `:173`; it can only remove _more_ registered UTXOs from the selection, never fewer. Call this out in the PR description.
- `:74`'s two `Array.includes` are safe today (both `spentUtxos` and `registeredUtxos` are `filter` results over `selectedUtxos`, so the references are identical), but the rewrite removes them anyway by partitioning in one pass. The `spentUtxos` / `registeredUtxos` locals disappear and the `spentUtxos.length > 0 || registeredUtxos.length > 0` guard becomes `remainingUtxos.length !== selectedUtxos.length` — exactly equivalent, since the filter drops precisely the union of the two.
- **Key choice.** `getUtxoOutpoint` is this file's canonical UTXO key: `:101` already calls it per UTXO to index `excludedUtxos`, and #31125 uses it for the selection `Set`. It is injective over `(txid, vout)` — the same pair `isSameUtxo` compares — so every swap is semantics-preserving, and it throws only on a txid that is not 64 chars, which `:101` already proves cannot happen on this data. It is not free (a `Buffer.allocUnsafe` + hex decode + reverse per call), so this trades O(n²) field comparisons for O(n) buffer work; a plain `` `${txid}:${vout}` `` key would be equally correct if that ever matters, but do not mix the two forms into one `Set`.
- **`composedInputs` deliberately uses a template key**, not `getUtxoOutpoint`. `prev_hash` is a `PROTO.TxInputType` field; in practice it is the account UTXO's `txid` (the current code compares them with `===`), but keying it with a plain string avoids introducing a `throw` inside a render-time `useMemo` for data that does not originate from `account.utxo`. #31125 makes the same call for the `composedInputs` branch it leaves untouched in `UtxoSelection.tsx`.
- **Where each `Set` lives is deliberate.** `accountUtxoOutpoints` and `coinjoinRegisteredOutpoints` are hook-level `useMemo`s because both inputs are already referentially stable (`account.utxo` from the store, and `useCoinjoinRegisteredUtxos` returns a `useMemo`). `topCategoryOutpoints` is built _inside_ `toggleCheckAllUtxos` because `topCategory` is recomputed in the render body at `:117` on every render — memoizing it would rebuild the `Set` per render for a value only the click handler reads.
- `(account.utxo ?? [])` rather than `account.utxo?.map(...)` keeps the `Set<string>` inference unambiguous. Semantics are unchanged: with no `account.utxo` the old code classified every selected UTXO as spent, and an empty `Set` does the same.
- `topCategory?.find(...)` at `:173` — the `?.` is dead code. `topCategory` is `[...].find(...) || []` at `:117`-`:119` and is never nullish; the rewrite drops the optional chain.
- Effect deps swap `account.utxo` / `coinjoinRegisteredUtxos` for the two `Set`s. `react-hooks/exhaustive-deps` stays satisfied and the effect does not run more or less often, because each memo is keyed exactly on the array it replaces.
- `isSameUtxo` stays imported — `:195` and `:206` in `toggleUtxoSelection` still use it. Those are single scans per user click (one pass over `selectedUtxos`, not one per row) and are intentionally left alone.
- **No test covers this hook.** `packages/suite/src/hooks/wallet/__fixtures__/useSendForm.ts:468` only sets `selectedUtxos: []`, and no e2e spec touches coin control. If the PR adds one, the highest-value case is `toggleCheckAllUtxos` with a lower-category selected UTXO that is coinjoin-registered but held as a stale object reference — that is the case the `:179` delta above changes.
- **React Compiler:** `packages/suite` does not enable it (only `suite-native` does), so all three memos are load-bearing and have to be written by hand.
- Other anchors in this file are already filed: `:94` (the `sortUtxos` call) in **#31126**, `:125` (`topCategory.every(utxo => selectedUtxos.some(...))`) in **#31125**.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
