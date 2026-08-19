# `getAnonymityScores` decodes and re-derives a script for every counterparty address in a coinjoin account's whole history, in one uninterruptible task on the Electron main process

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. This one is not object churn dressed up as work: every entry in the account's transaction history that is not the user's own goes through a full address decode and a script compile, and there is no `await` anywhere inside the `map`. It runs on the Electron **main** process, which is where connect core and every `ipc-proxy` reply to the renderer live — and one of its two call sites fires immediately after a coinjoin round the user's device just signed.

## Where

[`packages/coinjoin/src/client/analyzeTransactions.ts:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L69) — the `transactions.map(...)` that formats the whole history into the middleware request body, and [`:31`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L31), the per-entry derivation it reaches through `transformVinVout`.

The map runs to completion before the single POST at [`:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L89). Between those two lines there is no `await`, so the entire formatting pass is one task.

**What one entry costs.** `transformVinVout` early-returns only when the entry is account-owned ([`:29`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L29)); `isAccountOwned` is set at transform time by string membership against the account's own addresses ([`blockchain-link-utils/src/utils.ts:7`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L7), applied at [`blockbook.ts:383`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L383)). Every counterparty entry therefore falls through to `:31` and pays:

- [`address.toOutputScript`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L203) → [`decodeAddress`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L126), which tries base58check **first** ([`:128`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L128)). For a base58 counterparty address that is two SHA-256 passes — `bs58check` is `@scure/base`'s base58check bound to noble SHA-256 ([`bs58check.ts:4`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/bs58check.ts#L4)). For a bech32/bech32m address it is a **thrown exception**, caught at [`:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L131).
- then [`fromBech32`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L27), which tries `bech32.decode` ([`:31`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L31)) and, for a **taproot** address, throws again before falling through to `bech32m.decode` ([`:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L43)). Coinjoin accounts are SLIP-25, i.e. taproot ([`networksConfig.ts:26`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-config/src/networksConfig.ts#L26)), and so are the other participants' outputs in a joint transaction — so the common case here is the worst path through `decodeAddress`: two thrown exceptions before anything succeeds.
- then [`createOutputScript`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L176) — `bscript.compile` for taproot ([`:192`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L192)), or a schema-validated `payments.*` factory for the other types ([`:183`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L183)–[`:189`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/address.ts#L189)) — and finally `.toString('hex')`, one more allocation.

**Which thread this is.** The Electron **main** process, not a worker and not the renderer. `CoinjoinClient` is constructed inline at [`packages/suite-desktop-core/src/modules/coinjoin.ts:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/coinjoin.ts#L138) and reached over `@trezor/ipc-proxy`; the _backend_ by contrast is forked into a utility process a few lines above at [`:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/coinjoin.ts#L71). `CoinjoinClient.analyzeTransactions` ([`CoinjoinClient.ts:76`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/CoinjoinClient.ts#L76)) is a plain call on that main-process instance. Connect core lives in the same process ([`modules/trezor-connect.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts)), so does `ipcMain`.

**When it runs.** Two call sites, both passing the full history:

- [`coinjoinAccountActions.ts:511`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L511) / [`:518`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L518) in `fetchAndUpdateAccount` ([`:446`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L446)) — every account sync.
- [`:373`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L373) in `updatePendingAccountInfo` ([`:351`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L351)), dispatched from [`coinjoinMiddleware.ts:123`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinMiddleware.ts#L123) the moment a prepending transaction is added — which, per the comment above `:351`, is the result of a **successful coinjoin round**.

## Before

`packages/coinjoin/src/client/analyzeTransactions.ts:21`:

```ts
const transformVinVout = (vinvout: EnhancedVinVout, network: Network) => {
    if (!vinvout.isAddress || !vinvout.addresses || vinvout.addresses.length > 1) return [];

    const { addresses } = vinvout;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const Address: string = addresses[0];
    const Value = Number(vinvout.value);

    if (vinvout.isAccountOwned) return { Address, Value };

    const ScriptPubKey = addressBjs.toOutputScript(Address, network).toString('hex');

    return {
        ScriptPubKey,
        Value,
    };
};
```

`packages/coinjoin/src/client/analyzeTransactions.ts:65`:

```ts
export const getAnonymityScores = async (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    const formattedTransactions = transactions.map(tx => {
        const [InternalInputs, ExternalInputs] = arrayPartition(
            tx.details.vin.flatMap(vin => transformVinVout(vin, options.network)),
            isInternal,
        );

        const [InternalOutputs, ExternalOutputs] = arrayPartition(
            tx.details.vout.flatMap(vout => transformVinVout(vout, options.network)),
            isInternal,
        );

        return {
            InternalInputs,
            ExternalInputs,
            InternalOutputs,
            ExternalOutputs,
        };
    });
```

## After

`transformVinVout` is unchanged. Only the loop around it changes.

```ts
import { arrayPartition, yieldToMain } from '@trezor/utils';
```

```ts
import { VIN_VOUTS_PER_YIELD } from '../constants';
```

```ts
import {
    type AnalyzeExternalVinVout,
    type AnalyzeInternalVinVout,
    type AnalyzeTransactionDetails,
} from '../types/middleware';
```

```ts
export const getAnonymityScores = async (
    transactions: Transaction[],
    options: AnalyzeTransactionsOptions,
) => {
    const formattedTransactions: AnalyzeTransactionDetails[] = [];

    let vinVoutsSinceYield = 0;

    for (const tx of transactions) {
        const [InternalInputs, ExternalInputs] = arrayPartition(
            tx.details.vin.flatMap(vin => transformVinVout(vin, options.network)),
            isInternal,
        );

        const [InternalOutputs, ExternalOutputs] = arrayPartition(
            tx.details.vout.flatMap(vout => transformVinVout(vout, options.network)),
            isInternal,
        );

        formattedTransactions.push({
            InternalInputs,
            ExternalInputs,
            InternalOutputs,
            ExternalOutputs,
        });

        vinVoutsSinceYield += tx.details.vin.length + tx.details.vout.length;

        if (vinVoutsSinceYield >= VIN_VOUTS_PER_YIELD) {
            vinVoutsSinceYield = 0;
            await yieldToMain();
        }
    }
```

with the constant alongside the other scan tunables in [`packages/coinjoin/src/constants.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L1):

```ts
// number of transaction inputs and outputs formatted by getAnonymityScores between two yields
export const VIN_VOUTS_PER_YIELD = 1000;
```

`yieldToMain` is the shared helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`) — `scheduler.yield()` when it exists, `setTimeout(resolve, 0)` otherwise.

## Why it matters

The user is either syncing a coinjoin account, or has just finished a coinjoin round on the device. In the second case the pass runs on the trailing edge of a signing flow, while the device is still connected and the user is likely still looking at (and clicking on) the coinjoin screen.

`n` is the total number of inputs and outputs across the account's **entire** transaction history, minus the user's own entries. Two things make it grow in a way an ordinary account's history does not:

- **A joint transaction is large by construction.** It carries every participant's inputs and outputs, not just the user's — this client alone registers up to `ROUND_SELECTION_MAX_OUTPUTS` outputs per round ([`constants.ts:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L34)), and a round has many participants. Order 10²–10³ entries per joint transaction is the structural expectation; I did not measure a real round.
- **Coinjoining is how the history grows.** An account the user actually uses for coinjoin accumulates one such transaction per completed round, and each round then re-triggers the full pass over everything before it. So the per-call cost is O(history) and the number of calls grows with history too.

What is held is the Electron main process's event loop, and with it:

- **device transport and connect core** — `TrezorConnect` runs in this process, so a device call issued while the map is running does not start until it finishes;
- **every `ipc-proxy` reply to the renderer** — including the renderer's own coinjoin client and backend calls, which are dispatched through `ipcMain` in this same process.

The renderer keeps painting; it is the renderer's _data_ that stalls, not its frames. So the user does not see a frozen window — they see a UI that stops answering, and a device that does not respond to the next click, for as long as the pass runs.

After the fix the loop returns to the main process's event loop roughly every `VIN_VOUTS_PER_YIELD` entries, so queued IPC and device work interleave with the formatting instead of queueing behind all of it. Nothing appears later to the user: the anonymity set is still computed in full before the single POST at `:89`, and the account update that follows is unchanged.

**Honest sizing: P2, and here is why it is not P1.**

- **Coinjoin is desktop-only** ([`coinjoinService.ts:21`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinService.ts#L21) throws for anything else) and used by a small fraction of users. The blast radius is narrow even though the per-user effect is real.
- **The 50 ms long-task threshold is a UI-thread number** and this is not the UI thread. The argument here is IPC and device-call latency, which is a genuine but softer thing than a dropped frame.
- **`n` is smaller than the raw entry count suggests** for a user who joined only a handful of rounds. A coinjoin account with three joint transactions is not a long task at all. The claim is about the account that has been coinjoining for a while, which is the account the feature is for.
- **Chunking does not reduce the work**, it only makes it interruptible — and the deeper fix is arguably not to redo it at all (see Notes).

## Notes

- **The `After` hunk has not been compiled.** It is written against the real types by reading. `AnalyzeTransactionDetails` already exists and is exported at [`types/middleware.ts:26`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/types/middleware.ts#L26); the explicit array annotation is there because `push` into a bare `[]` does not give TypeScript the element type the `map` used to infer.
- **`yieldToMain` will take its `setTimeout` branch here, not `scheduler.yield()`.** Electron's main process is a Node context, not a Blink one — `scheduler` is a Blink global on `window`, and there is no `window` in main. So this pays Node's 1 ms timer floor per yield: at `VIN_VOUTS_PER_YIELD = 1000` an account with 10⁵ entries adds on the order of a hundred timer ticks per pass. `setImmediate` exists in this process, has no floor, and is the right primitive — **a reviewer should push back here**, but the fix belongs in the shared helper, not in this call site, and it is a decision several documents in this sweep share. This also contradicts `skills/performance-scheduling/SKILL.md`, which says "`suite-desktop` is Chromium and always has the real thing": true of the renderer, false of the main process and of `utilityProcess.fork` children. Same correction p2-02 asks for.
- **Why count vin/vout rather than transactions.** A coinjoin history mixes ordinary transactions of a few entries with joint transactions of hundreds, so a fixed transactions-per-batch would make batch cost swing by two orders of magnitude. Counting entries keeps each slice roughly the same size whatever the history looks like.
- **Why 1000, and the limit that number runs into.** It is a guess, not a measurement: it is roughly one large joint transaction's worth of entries, which is also the finest the loop can be split — the body cannot yield mid-transaction without restructuring `arrayPartition` usage, so **a single very large joint transaction remains one atomic slice** no matter what the constant is. If that turns out to be the dominant slice, the constant is irrelevant and the fix has to go finer (yield inside the vin/vout `flatMap`), which is a bigger and uglier change. Worth saying out loud rather than implying the yield bounds every slice.
- **No abort check was added, deliberately.** `options.signal` is aborted by `CoinjoinClient.disable()` ([`CoinjoinClient.ts:64`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/CoinjoinClient.ts#L64)), and a `throwIfAborted()` in the loop would be the obvious addition — but it would change observable behaviour. Today an abort surfaces at the middleware request, is swallowed by the `catch` at [`:102`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L102), and `getAnonymityScores` returns `undefined`, so the account is still updated with an empty anonymity set. A throw from the loop escapes that `catch` entirely and lands in [`coinjoinAccountActions.ts:541`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L541), ending the sync as `error` / `out-of-sync`. That may well be the better outcome, but it is a behaviour change and not this issue's business. **Reviewer's call** — if wanted, an early `return` (rather than a throw) reproduces today's abort outcome exactly.
- **Ordering and re-entrancy.** `transformVinVout` is pure and the `push` preserves order, so the request body is byte-identical to today's. The POST happens only after the array is complete, so a yield cannot produce a partial or reordered request. Two overlapping `analyzeTransactions` calls for different accounts build separate local arrays, so interleaving them is safe. The one thing the yield newly admits is a `disable()` landing mid-pass — which, per the previous note, does nothing different from today.
- **`getRawLiquidityClue` was deliberately not changed.** It calls `transformVinVout` too ([`:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.ts#L51)) but over a single transaction's outputs, so it is bounded by one joint transaction rather than by history. It shares the "cannot split below one transaction" limit above; splitting it is the same restructuring and should not ride along here.
- **Tests.** [`analyzeTransactions.test.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/client/analyzeTransactions.test.ts#L116) drives the real function against a mock middleware server with two tiny transactions, and nothing under `src/client` uses fake timers except `Status.test.ts` — so the added `setTimeout(0)` resolves normally and the fixture never reaches the first yield. Expect it to pass unchanged, which also means **the yield gets no coverage**. `packages/coinjoin/tools/anonymity-test.ts:7` imports `getAnonymityScores` directly and is unaffected.
- **Published-package impact.** `@trezor/coinjoin` is `private: true` ([`package.json:4`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/package.json#L4)), so `VIN_VOUTS_PER_YIELD` does not become public API — note that p2-02 in this set says the opposite about this package and should be corrected. Adding `yieldToMain` to `@trezor/utils` **is** a published-API addition; `@trezor/utxo-lib` is untouched.
- **Platform.** Desktop only. No Safari fallback concern and no suite-native path, so the brief's `InteractionManager` correction does not apply to this document.
- **Where a reviewer should push back hardest: this may be the wrong fix.** A coinjoin history is append-only, yet every sync re-derives scripts for every transaction it already derived on the previous sync. A `txid`-keyed cache of `AnalyzeTransactionDetails` would remove the work instead of rescheduling it, and would shrink `n` to the transactions added since the last call. That is strictly better than chunking, and a reviewer may reasonably ask for it instead — or for both, since even a cold first sync of a long history is still one long task. This document proposes the chunking because it is the scheduling defect the sweep is scoped to; the caching argument is the stronger engineering answer and is not filed anywhere yet.
- **Also deliberately not changed:** `arrayPartition` ([`packages/utils/src/arrayPartition.ts:12`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/arrayPartition.ts#L12)) spreads both accumulators on every element, so within a single joint transaction of hundreds of inputs it is quadratic in allocations and may well dominate this loop's constant. That is asymptotic-complexity **p1-05**; fixing it lowers the cost per transaction but leaves the pass a single uninterruptible task, and the two changes are independent. Moving the whole formatting pass into the coinjoin-backend utility process — it is pure and self-contained — would take it off the main process entirely and is the option to reach for if chunking proves insufficient.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
