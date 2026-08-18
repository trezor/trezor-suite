# Coin selection recomputes the transaction fee from scratch per candidate UTXO — track the weight incrementally

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/utxo-lib/src/coinselect/inputs/accumulative.ts:65`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/accumulative.ts#L65) (also 47, 57) — `accumulative`

`utxos0` — the account's spendable UTXO set, passed through `tryConfirmed` from `coinselect`

## Before

```ts
        return { fee };
    }
} else {
    inAccum = inAccum + utxoValue;
    inputs.push(utxo);

    const fee = getFee(inputs, outputs, feeRate, options);
    const outAccumWithFee = outAccum !== undefined ? outAccum + BigInt(fee) : ZERO;

    // go again?
    if (inAccum >= outAccumWithFee) {
        return finalize(inputs, outputs, feeRate, options);
    }
```

## After

Make the fee incremental instead of recomputed. Track running `weight` (and the segwit-input count) as inputs are pushed — `weight += inputWeight(utxo)` — and compute the fee from the running total plus the fixed output/base weight, so each iteration is O(1). Alternatively pass a precomputed accumulator into `getFee`/`transactionWeight` rather than the whole array.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(n^2) time and O(n^2) allocated elements, n = candidate UTXO count`** — hot path.

`getFee` -> `transactionBytes` -> `transactionWeight` (coinselectUtils.ts:89-100) walks the whole `inputs` array on every call: `inputs.filter(i => SEGWIT_INPUT_SCRIPT_TYPES.includes(i.type))` allocates an array of size |inputs| and two `reduce`s traverse it. Because `inputs` grows by one per loop iteration, the loop pays sum(1..n). The file's own comment claims "worst-case: O(n)", which is wrong. The full-length loop is reached whenever the target is never covered — i.e. the very common "amount exceeds available balance" state the send form passes through on nearly every keystroke while a user types an amount. Entry point: `packages/connect/src/api/composeTransaction.ts:86` runs `compose(level.feePerUnit)` once per fee level (3-4) per `TrezorConnect.composeTransaction`, which suite's send form issues on every form change. UTXO counts run into the thousands for coinjoin accounts (each round mints many small outputs) and for long-lived receive-heavy accounts.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Fix is more involved than the candidate implies — do not accept a naive 'track a running weight' patch without checking all three fee policies. transactionWeight also depends on `getVarIntSize(inputs.length)` and on `(segwitInputs ? 2 + (inputs.length - segwitInputs) : 0)`, both derivable from running counters (total weight, segwit-input count, input count), so the bitcoin path incrementalises cleanly. getZcashFee (coinselectUtils.ts:~213) additionally does `inputs.reduce((sum, i) => sum + inputBytes(i), 0)` — needs its own running accumulator. getDogeFee only reduces over OUTPUTS, which are loop-invariant here, so it is fine. Also beware `Math.ceil` placement: transactionBytes ceils the weight/4 for the whole tx, so a running BYTE total is NOT equivalent to ceil(running weight / 4) — accumulate WEIGHT and ceil once, or fees will drift by a satoshi and break the existing fixtures. Line 57 `getFee([...inputs, utxo], ...)` allocates a copy but runs at most once (only when i === utxos.length - 1), so leave it. branchAndBound (which anyOf runs first) has its own MAX_TRIES = 1000000 budget — unrelated, do not conflate.

- Spans more than one file — see also `packages/utxo-lib/src/coinselect/coinselectUtils.ts:90`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
