# `branchAndBound` can run to its one-million-iteration cap, and `composeTransaction` runs every fee level back to back in a single task

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. The coin selection search is bounded only by an iteration counter set to `1000000`, and the connect method that drives it composes every fee level inside one synchronous `map`, so a single compose call has no task boundary anywhere in it. This runs while the user is typing an amount into the send form.

## Where

[`packages/connect/src/api/composeTransaction.ts:88`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/composeTransaction.ts#L88) — `ComposeTransaction.run()` maps over `feeLevels` and calls `compose(level.feePerUnit)` at [`:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/composeTransaction.ts#L89). The method is declared `run(): Promise<PrecomposedResult[]>` ([`:74`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/composeTransaction.ts#L74)) but contains no `await` — it ends with `return Promise.resolve(levels)` at [`:107`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/composeTransaction.ts#L107), so the whole thing is one synchronous stretch wearing a promise.

Each `compose(...)` call is the closure returned by `createComposer` ([`packages/connect/src/api/bitcoin/TransactionComposer.ts:60`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/TransactionComposer.ts#L60)), which calls `composeTx` ([`:64`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/TransactionComposer.ts#L64)) → `coinselect` → `tryConfirmed(anyOf([branchAndBound, accumulative]), options)` ([`packages/utxo-lib/src/coinselect/index.ts:16`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/index.ts#L16)).

The search itself is a depth-first walk over the effective UTXO set ([`packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts:58`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L58)). Its only exhaustion guard is a countdown seeded from `const MAX_TRIES = 1000000;` ([`:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L15), assigned at [`:47`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L47), decremented once per iteration at [`:120`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L120)). Every iteration does `bigint` add/subtract/compare. The cap is a ceiling on how bad it gets, not a promise that it is cheap.

The caller is the shared send-form thunk: `predefinedLevels` at [`suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts:99`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L99), the account's whole spendable UTXO set passed straight through at [`:134`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L134), and one `await TrezorConnect.composeTransaction(params)` at [`:144`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L144).

## Before

**`packages/connect/src/api/composeTransaction.ts:88`–`:107`** — every fee level composed in one `map`:

```ts
const levels = feeLevels.map(level => {
    const tx = compose(level.feePerUnit);
    if (tx.type === 'final') {
        return {
            ...tx,
            inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
            outputs: tx.outputs.map(outputToTrezor),
        };
    }
    if (tx.type === 'nonfinal') {
        return {
            ...tx,
            inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
        };
    }

    return tx;
});

return Promise.resolve(levels);
```

**`packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts:58`–`:62`** — the loop each of those calls can enter, and its only exhaustion exit:

```ts
    while (!done) {
        if (tries <= 0) {
            // Too many tries, exit
            return null;
        }
```

## After

`ComposeTransaction.run()` becomes genuinely async and puts a task boundary between fee levels. `yieldToMain` is the shared helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`); the import goes above `@trezor/utxo-lib` in the existing `@trezor/*` group.

```ts
    async run(): Promise<PrecomposedResult[]> {
        const { coinInfo, outputs, baseFee, sortingStrategy, account, feeLevels } = this.params;
        const address_n = pathUtils.validatePath(account.path);

        const compose = createComposer({
            txType: pathUtils.getAccountType(address_n),
            addresses: account.addresses,
            utxos: account.utxo,
            coinInfo,
            outputs,
            baseFee,
            sortingStrategy: sortingStrategy ?? DEFAULT_SORTING_STRATEGY,
        });

        const composeLevel = (feePerUnit: string) => {
            const tx = compose(feePerUnit);
            if (tx.type === 'final') {
                return {
                    ...tx,
                    inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
                    outputs: tx.outputs.map(outputToTrezor),
                };
            }
            if (tx.type === 'nonfinal') {
                return {
                    ...tx,
                    inputs: tx.inputs.map(inp => inputToTrezor(inp, this.params.sequence)),
                };
            }

            return tx;
        };

        const levels: PrecomposedResult[] = [];
        for (const level of feeLevels) {
            // a single level can run the coinselect search to its iteration cap,
            // so never chain two of them into one task
            if (levels.length > 0) await yieldToMain();

            levels.push(composeLevel(level.feePerUnit));
        }

        return levels;
    }
```

A possible second step, deliberately kept separate because it changes what a published library selects and not only when:

```ts
// packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts:15
const MAX_TRIES = 100000;
```

## Why it matters

The user is typing an amount into the send form. `useSendFormCompose` debounces ([`packages/suite/src/hooks/wallet/useSendFormCompose.ts:125`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendFormCompose.ts#L125)) and then dispatches the compose thunk, so between the debounce firing and the fee summary updating there is one stretch of work with no task boundary in it. Connect's core runs in-process on every platform — `CoreInModuleWeb` ([`packages/connect/src/index.browser.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/index.browser.ts#L17)) puts it on the **renderer main thread** on suite-web, the `react-native` entry puts it on the **RN JS thread** on suite-native, and suite-desktop proxies it into the **Electron main process**. `composeTransaction` sets `useDevice = false`, so core awaits `method.run()` directly ([`packages/connect/src/core/index.ts:248`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L248)–[`:250`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L250)) with nothing between it and the thread that has to echo the next keystroke.

`n` is the number of **effective** UTXOs, not the account's whole UTXO set: [`:168`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L168)–[`:169`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L169) keeps only coins whose value exceeds their own input fee **and** does not exceed the target range. A depth-first walk over `n` coins has a `2^n` subset space; the pruning at [`:73`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L73) cuts a lot of it, but past roughly two dozen effective coins the space is larger than the budget, and if no subset lands inside the narrow `[target, target + costOfChange]` window the loop runs the counter to zero and returns `null`.

That is the shape of the tail, and it is specific: **many UTXOs each individually smaller than the amount being sent**, with no lucky combination in the window. A wallet with a handful of large coins never gets there — `effectiveUtxos` comes out near-empty and the search returns early at [`:184`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L184). A coinjoin account, which is hundreds of same-denomination outputs by construction, or any account fed by many small payments, is exactly the case that does.

The cap is then multiplied. Suite sends three predefined levels for Bitcoin — `high`, `normal`, `economy`, with `low` filtered out at [`suite-common/wallet-core/src/fees/feesThunks.ts:58`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fees/feesThunks.ts#L58) — plus a fourth when the user has selected a custom fee ([`sendFormBitcoinThunks.ts:101`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L101)). Inside each level, `tryConfirmed` retries the algorithm over progressively looser confirmation requirements ([`packages/utxo-lib/src/coinselect/tryconfirmed.ts:64`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L64), calling it at [`:77`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L77)).

**After the fix, the work is identical and the compose is not faster.** What changes is that the main thread gets a boundary between levels instead of none at all, so a keystroke, a scroll or a repaint can land in the middle of a compose rather than queueing behind all of it. That is a smaller claim than "the send form gets faster", and it is the honest one.

## Notes

- **The After hunk has not been compiled.** In particular the explicit `const levels: PrecomposedResult[]` annotation is a guess at what the original `map` inferred; if it does not accept the spread results, the fix is to annotate `composeLevel`'s return type instead and let `levels` infer.
- **The trial multiplier in the raw scan was wrong, and it matters.** The scan claimed `own + (other - 1) + 2 = 8` `branchAndBound` runs per fee level from the trial list built at [`tryconfirmed.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L44)–[`:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L59). Eight trials are constructed, but the algorithm only runs on a trial that newly makes some UTXO usable ([`:72`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L72)), and the loop returns as soon as nothing unusable is left ([`:83`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L83)). Because `createComposer` marks every UTXO sitting at one of the account's own addresses `own: true` ([`TransactionComposer.ts:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/TransactionComposer.ts#L50)) and the defaults are `own = 1`, `other = 6` ([`tryconfirmed.ts:33`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L33)–[`:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/tryconfirmed.ts#L34); nothing in `validateAndParseRequest` sets them), the reachable trials are only two: confirmed coins, then confirmed plus unconfirmed. So the realistic worst case is **fee levels × 2**, not × 8. Eight is reachable only if some of the account's UTXOs sit at addresses missing from `account.addresses`, which is a bug case, not a normal one. A reviewer should reject any framing of this issue that leans on the ×8 number.
- **`n` is also smaller than "the account's UTXO count" reads.** The `effectiveValue <= targetRange` filter at [`:169`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L169) throws away every coin bigger than the payment, and the `utxosTotalEffectiveValue < target` guard at [`:184`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L184) returns before the search when what is left cannot cover the target. Both make the common case cheap.
- **Coin control never reaches this code.** With coin control on, the thunk marks the selected UTXOs `required: true` ([`sendFormBitcoinThunks.ts:114`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L114)) and `branchAndBound` bails immediately at [`:142`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L142). This is the plain "type an amount and send" path only. `p2-05` covers the coin-control surface.
- **Yielding cannot change the selection.** The search is pure over a snapshot of `effectiveUtxos` built inside the call, and the yield is between fee levels, outside it. The result array is identical, only later. That is what makes step 1 safe.
- **Step 1 does not touch `@trezor/utxo-lib` at all**, so none of its selection fixtures move — [`packages/utxo-lib/src/coinselect/__fixtures__/coinselect-index.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/__fixtures__/coinselect-index.ts) and [`packages/utxo-lib/src/compose/compose.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/compose/compose.test.ts) call `coinselect`/`composeTx` directly and never go through `ComposeTransaction`. `run()` was already declared to return a promise ([`AbstractMethod.ts:320`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/AbstractMethod.ts#L320)) and core already awaits it, so making it `async` is not an API change even though `@trezor/connect` is published.
- **Step 2 (`MAX_TRIES`) is the one with an observable-output risk, and it is a published-package behaviour change.** Giving up earlier can make `branchAndBound` return `{ fee: 0 }` where it previously found a changeless solution, so `anyOf` falls through to `accumulative` and the user gets a change output they did not get before. The existing coinselect fixtures are the guard and they must be run before this is proposed seriously. The comment at [`:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts#L131) already says the port is not 1:1 with Bitcoin Core; my recollection is that Core's `SelectCoinsBnB` budget is an order of magnitude smaller than `1000000`, but I did not read `coinselection.cpp` for this document — treat `100000` as a proposal to check, not a cited constant.
- **Step 3 — yielding inside the search itself — is deliberately not proposed.** It is the only change that would bound a _single_ level, but it needs `search`, `tryConfirmed`, `coinselect` and `composeTx` all made async, and `composeTx` is a published export of `@trezor/utxo-lib` ([`packages/utxo-lib/src/index.ts:24`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/index.ts#L24)). It has exactly one product call site ([`TransactionComposer.ts:64`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/TransactionComposer.ts#L64)), so the migration is small in-repo and breaking out of it. **This is the honest limit of the proposed fix: after step 1, one fee level's search can still hold the thread for its full budget.** A reviewer who thinks that is the actual defect is right, and should push this issue towards step 3.
- **The yield does not add cancellation, and the issue must not claim it does.** Today `run()` completes in one tick, so nothing can interleave. After the change, a newer compose can start inside core while an older one is between levels — and nothing stops the older one: `AbstractMethod.dispose()` is an empty method ([`:322`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/AbstractMethod.ts#L322)) and `overridePreviousCall` only applies on the device path. Suite already discards the stale _result_ via `composeRequestID` ([`useSendFormCompose.ts:112`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendFormCompose.ts#L112), captured at [`:124`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendFormCompose.ts#L124), compared at [`:152`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useSendFormCompose.ts#L152)), so correctness is fine — but the stale compose still burns the CPU to the end. Checking an abort flag at the yield point would be a genuine improvement and needs a mechanism that does not exist yet; worth a follow-up rather than folding in here.
- **One yield per level may be too many in the custom-level fallback.** When no predefined level composes, the thunk generates a run of custom fee levels in a `while` loop ([`sendFormBitcoinThunks.ts:187`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L187)) and sends the whole list in one `composeTransaction` ([`:199`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L199)); with a `rangeGap` of 1 that list can be long. Those composes are individually cheap (that path is entered because nothing was affordable, which is the early-return case), so a yield between each is mostly overhead — and on the `setTimeout(0)` fallback path the browser clamps to a 5 ms floor after five nested timeouts, which would visibly slow that fallback down. If a reviewer prefers, yield every _k_ levels instead of every level; the argument for `k = 1` is only that it is the simplest thing that puts a boundary where the expensive levels are.
- **Platform.** Shared. On suite-native, Hermes has no `scheduler.yield`, so `yieldToMain` resolves to its `setTimeout(0)` fallback there — a back-of-queue yield, which still breaks the task but does not resume ahead of already-queued work. On suite-desktop this runs in the Electron main process, so the beneficiary is every renderer IPC round trip queued behind it, not the paint.
- **Not measured, and the finding stands or falls on the tail.** Nothing here establishes how often a real UTXO set actually drives the counter to zero rather than returning early. Before this is filed, profile a compose on a coinjoin account with a few hundred UTXOs and an amount larger than any single coin. If that comes back cheap, the issue should be closed rather than shipped.
- **Deliberately not changed:** `inputs.sort(sortByScore(feeRate))` at [`packages/utxo-lib/src/coinselect/index.ts:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/coinselect/index.ts#L14) sorts the caller's array in place on every compose. That is a mutation and a per-level `O(n log n)`, but it belongs to the complexity sweep, not this one.
- **Sibling:** `p1-15` is the same in-process connect core and the same signing flow, one step later — the referenced-transaction parse in `signTransaction`. If both land, `yieldToMain` will already exist in `@trezor/utils` for whichever is second.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
