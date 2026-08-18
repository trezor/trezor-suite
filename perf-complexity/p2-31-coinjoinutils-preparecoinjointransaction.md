# `prepareCoinjoinTransaction` scans the account's UTXOs and change addresses per round input and output — index both once

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite/coinjoin/src/coinjoinUtils.ts:244`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinUtils.ts#L244) (also 247, 254, 279) — `prepareCoinjoinTransaction`

`account.utxo` (every confirmed+unconfirmed UTXO of the coinjoin account) and `account.addresses.change` (every change address ever derived for it); the outer loops are `transaction.inputs`/`transaction.outputs` of the WabiSabi round transaction, i.e. all participants' inputs/outputs.

## Before

```ts
    transaction: CoinjoinTransactionData,
) => {
    const inputScriptType = account.accountType === 'normal' ? 'SPENDWITNESS' : 'SPENDTAPROOT';
    const outputScriptType = account.accountType === 'normal' ? 'PAYTOWITNESS' : 'PAYTOTAPROOT';
    const isInternalInput = (input: CoinjoinTransactionData['inputs'][0]) =>
        input.path && account.utxo?.find(u => getUtxoOutpoint(u) === input.outpoint);
    const isInternalOutput = (output: CoinjoinTransactionData['outputs'][0]) =>
        output.path && account.addresses?.change.find(a => a.address === output.address);

    // TODO: early validation of inputs/outputs before it's sent to Trezor to not waste signing count

    const { affiliateRequest } = transaction;

    const tx = {
```

## After

Index both collections once, above the maps: `getUtxoOutpoint` then runs once per UTXO instead of once per (input, UTXO) pair.

```ts
const internalOutpoints = new Set(account.utxo?.map(getUtxoOutpoint) ?? []);
const internalChange = new Set(account.addresses?.change.map(a => a.address) ?? []);
const isInternalInput = input => input.path && internalOutpoints.has(input.outpoint);
const isInternalOutput = output => output.path && internalChange.has(output.address);
```

## Why it matters

**`O(roundInputs x accountUtxos) + O(roundOutputs x changeAddresses), one getUtxoOutpoint string allocation per probe`** — hot path.

Called from `signCoinjoinTx` (suite/coinjoin/src/coinjoinClientActions.ts:621) on every `request:signature` event the coinjoin client emits, i.e. once per round the account participates in. A coinjoin account exists specifically to accumulate many small UTXOs — hundreds to thousands — and every completed round mints a fresh change address, so `addresses.change` grows monotonically with session count. The round transaction carries every participant's input/output, so the outer loop is in the hundreds. Worse, `getUtxoOutpoint(u)` builds a new string on _every_ probe, so the inner scan is hundreds of thousands of string allocations, not just comparisons.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Behaviour delta to watch: the current predicates return the found UTXO/address object (truthy) rather than a boolean, but both results are only used in `if (...)` conditions at :256 and :280, so switching to `Set.has()` is safe. `account.utxo` and `account.addresses` are optional — keep the `?? []` fallbacks so the `input.path &&` / `output.path &&` short-circuit semantics are preserved exactly (an account with no `utxo` must still yield false). Both predicates are plain function expressions inside the exported function, not hooks, so no React Compiler concern. `getUtxoOutpoint` import already present. Sibling anchor at :247 is the same defect and should be fixed in the same edit.

- Spans more than one file — see also `suite/coinjoin/src/coinjoinClientActions.ts:621`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
