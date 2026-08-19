# `CoinjoinMempoolController.init` matches every mempool filter against the account's scripts without returning to its process's event loop

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. Same process and same `scanAccount` call as **p2-02**, a different loop: this one runs at the tail of the scan, after the block filters are done, and sweeps one Golomb-Rice filter per mempool transaction. It is written as `promiseAllSequence(...)`, which looks asynchronous, but the awaited action only touches the network on a match — so on the common path the whole sweep is one task.

## Where

[`packages/coinjoin/src/backend/CoinjoinMempoolController.ts:146`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L146) — the sweep, inside the `while` at [`:141`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L141).

`init` fetches the mempool filter set and eagerly turns every entry into a matcher ([`:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L98)–[`:108`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L108)). Each round of address derivation then builds the script list once ([`:142`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L142)–[`:144`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L144)) and runs every matcher against it.

The per-filter work is pure CPU. [`filters.ts:39`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/filters.ts#L39) hands out a closure over `filter.matchAny(keyBuffer, scripts)`, and `golomb`'s `matchAny` siphashes **every** script under that filter's key, sorts the hashes and walks the filter's bit stream. The key is the filter's own txid ([`:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L105)), so nothing is reusable between filters: the same script list is re-hashed n times.

The only `await` in the action is `addTx` ([`:112`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L112)), and it reaches the network only for a filter that matched and a txid not already in the map ([`:113`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L113)) — for a coinjoin account with nothing pending, never. `promiseAllSequence` adds no boundary of its own either: it is a plain `for` loop with `await action()` ([`packages/utils/src/promiseAllSequence.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/promiseAllSequence.ts#L18)–[`:21`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/promiseAllSequence.ts#L21)), and awaiting an already-resolved promise queues a microtask, not a task. The n matchers therefore run end to end in one stretch.

The `!addressController` branch at [`:121`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L121) is the opposite shape — it calls `addTx` for every txid, so it is network-bound and gives up the event loop constantly. It is not the branch `scanAccount` takes; only the unit test calls `init()` with no argument.

**Which process this is.** The Electron utility process that hosts `CoinjoinBackend` — p2-02 traces the full chain from `coinjoinService.ts` through `ThreadProxy` to the `process.parentPort` handler in `libs/thread.ts`, and that argument is not repeated here. Nothing paints from this process; what a long task holds is its inbound message handler.

## Before

```ts
        let { receive, change } = addressController;
        let iteration = 0;
        while (receive.length || change.length) {
            const scripts = receive
                .concat(change)
                .map(({ address }) => getAddressScript(address, this.network));

            await promiseAllSequence(
                filters.map(([txid, matchAny], index) => async () => {
                    if (matchAny(scripts)) await addTx(txid);
                    if (progressCooldown())
                        onProgressInfo?.({
                            stage: 'mempool',
                            progress: { current: index, total: filters.length, iteration },
                        });
                }),
            );
```

## After

```ts
import { arrayDistinct, createCooldown, promiseAllSequence, yieldToMain } from '@trezor/utils';
```

```ts
import {
    MEMPOOL_FILTERS_PER_YIELD,
    MEMPOOL_PURGE_CYCLE,
    PROGRESS_INFO_COOLDOWN,
} from '../constants';
```

```ts
        let { receive, change } = addressController;
        let iteration = 0;
        while (receive.length || change.length) {
            const scripts = receive
                .concat(change)
                .map(({ address }) => getAddressScript(address, this.network));

            for (const [index, [txid, matchAny]] of filters.entries()) {
                if (index > 0 && index % MEMPOOL_FILTERS_PER_YIELD === 0) await yieldToMain();

                if (matchAny(scripts)) await addTx(txid);
                if (progressCooldown())
                    onProgressInfo?.({
                        stage: 'mempool',
                        progress: { current: index, total: filters.length, iteration },
                    });
            }
```

with the constant next to the cooldowns it sits beside in [`packages/coinjoin/src/constants.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L1):

```ts
// number of mempool filters matched by CoinjoinMempoolController.init between two yields
export const MEMPOOL_FILTERS_PER_YIELD = 128;
```

`promiseAllSequence` stays in the import because the `!addressController` branch at `:122` still uses it. `yieldToMain` is the shared helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`) — `scheduler.yield()` when it exists, `setTimeout(resolve, 0)` otherwise.

## Why it matters

The user has just watched the coinjoin block scan finish. The mempool stage is the last 15% of the discovery progress bar ([`useCoinjoinAccountLoadingProgress.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/coinjoin/useCoinjoinAccountLoadingProgress.ts#L15)) and this sweep is what fills it; when it returns, `scanAccount` resolves and the account flips to `ready` ([`coinjoinAccountActions.ts:540`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L540)).

`n` is the number of entries in the mempool filter set. Blockbook builds it for taproot scripts only ([`websocket.ts:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockbook/websocket.ts#L103)) and `init` asks for the whole set with no `fromTimestamp` ([`CoinjoinBackendClient.ts:128`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackendClient.ts#L128)), so `n` is _every taproot transaction currently in the Bitcoin mempool_. That is the good argument here: it is not derived from the account, the wallet, or anything the user did — it moves with network congestion, it is spiky, and nothing in this code caps it.

It runs on every scan that finds the mempool subscription stopped ([`scanAccount.ts:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L81)–[`:84`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L84)): the first sync after the backend starts, the next sync after `disable()` ([`CoinjoinBackend.ts:99`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackend.ts#L99)), and any sync after a websocket drop, because `onDisconnect` puts the status back to `stopped` ([`:50`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L50)–[`:52`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinMempoolController.ts#L52)).

**Honest sizing: P2, and weaker than the block scan in three specific ways.**

- **The `while` almost always runs exactly once.** `analyze` returns only the addresses it _newly_ derived ([`CoinjoinAddressController.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinAddressController.ts#L92)), so a second iteration happens only when a mempool transaction actually paid the account, and it matches against those few new scripts rather than all of them. Read the cost as `n × 1`, not `n × iterations`. The progress reducer assumes the same thing — it only renders progress for iteration 0 ([`useCoinjoinAccountLoadingProgress.ts:42`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/coinjoin/useCoinjoinAccountLoadingProgress.ts#L42)).
- **Nothing paints from this process, and the progress bar does not freeze.** `progressCooldown` is time-based (`PROGRESS_INFO_COOLDOWN` 1 s, [`constants.ts:5`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L5)) and is evaluated per filter, so `onProgressInfo` still fires about once a second and reaches the renderer over `postMessage` without needing this event loop. There is no user-visible symptom to point at — only latency on inbound calls.
- **Yielding does not shorten the sweep, and today it cannot even shorten it on cancel.** `init` takes no `abortSignal` ([`types/backend.ts:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/types/backend.ts#L69)–[`:72`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/types/backend.ts#L72)), so unlike p2-02 there is no `throwIfAborted()` to add after the yield. A `cancel()` ([`CoinjoinBackend.ts:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackend.ts#L95)) that lands mid-sweep is _received_ sooner but changes nothing: the sweep runs to the end regardless. See the first note below — that is the honest weak point of this issue.

What is left after those three subtractions: the process keeps servicing its control channel — `setTorSettings` pushes, a subsequent `scanAccount`, `dispose` — instead of ignoring it for a stretch whose length is set by Bitcoin's fee market. That is real, and it is small.

## Notes

- **The strongest version of this change is not the yield — it is threading `abortSignal` into `init`.** The yield is what makes a signal _checkable_; without one, this issue buys control-channel latency and nothing else. Doing it properly touches `MempoolControllerShape.init` (`types/backend.ts:69`), the implementation signature (`CoinjoinMempoolController.ts:95`) and the call site (`scanAccount.ts:84`), and `MempoolControllerShape` is published surface. It was deliberately kept out of this document so the diff matches the anchor, but **a reviewer who wants the two together is right**, and this issue is worth much less on its own.
- **The After hunk has not been compiled.** `filters` is `(readonly [string, (scripts: Buffer[]) => boolean])[]`, so `filters.entries()` destructures cleanly and avoids the `@ts-expect-error: indexing with noUncheckedIndexedAccess` the repo otherwise needs for indexed access. The target is `ES2023` (`tsconfig.base.json`), so no `downlevelIteration` concern.
- **New interleaving — this is the thing to look hardest at in review.** The mempool subscription is started immediately before `init` (`scanAccount.ts:82`), but today the sweep is one task, so a websocket-delivered `onTransactionAdd` can only land _before_ or _after_ it. After this change it can land _between chunks_, which is genuinely new behaviour, not a case the code already sees. It looks benign: `addTx` short-circuits on `this.mempool.has(txid)` (`:113`), and the returned `set` is built afterwards from `addressTxids` by `analyze` (`:157`), so a subscription-delivered tx that touches the account is simply picked up there instead. The RBF path in `onTransactionAdd` (`:67`) removes colliding txids from both maps consistently. And the yield sits inside the sweep, so `analyze` (`:157`) and the non-null `this.mempool.get(txid)!` deref (`:164`) still happen in one uninterrupted task — that pair must not be split.
- **`yieldToMain` will take its `setTimeout` branch here, not `scheduler.yield()`**, for the same reason p2-02 gives: an Electron utility process is a Node environment with no `scheduler` global. Node's 1 ms timer floor means the fix adds roughly `n / 128` milliseconds of wall clock. `setImmediate` has no floor and is the right primitive in a Node context; that belongs in the shared helper, not at this call site, and it is a decision several documents in this sweep depend on.
- **Why 128 and not 64.** A guess, not a measurement. Each unit here is one `matchAny` over the derived script set — heavier than p2-02's per-block unit, but the sweep has no abort check to make fine granularity pay for itself, so a coarser chunk keeps the timer overhead down. If `abortSignal` is threaded in later, 64 (matching p2-02) becomes the better number.
- **Constant naming overlaps p2-02.** That issue adds `FILTERS_PER_YIELD` to the same `constants.ts`. Two similarly named constants in one file is a smell; if both land, either merge them into one or rename p2-02's to `BLOCK_FILTERS_PER_YIELD`. Worth deciding once rather than per PR.
- **Tests should pass unchanged, and the yield gets no coverage.** `CoinjoinMempoolController.test.ts` only ever calls `init()` with no argument (`:32`, `:85`, `:91`, `:112`), which is the other branch; the addressController branch is driven by `methods.test.ts` through `scanAccount` (`:50`) with six mempool transactions, far below 128. Real timers everywhere under `src/backend` — `jest.useFakeTimers()` appears only in `client/Status.test.ts` — so the `setTimeout(0)` resolves normally.
- **Published-package impact.** `@trezor/coinjoin` is published and gains a dependency on a new `@trezor/utils` export; `MEMPOOL_FILTERS_PER_YIELD` becomes public surface because everything in `constants.ts` is exported.
- **Platform.** Desktop only — coinjoin has no web or mobile path, so no Safari fallback concern and nothing changes for suite-native. (The RN half of this sweep has its own problem: `skills/performance-scheduling/SKILL.md` presents `InteractionManager.runAfterInteractions` as React Native's idle scheduler, but on the pinned `react-native@0.85.3` the installed module exports `InteractionManagerStub`, whose `runAfterInteractions` is a bare `setImmediate`. The skill needs that correction; it does not affect this document.)
- **Deliberately not changed: the eager matcher construction at `:98`–`:108`.** That is a second synchronous pass over the same `n`, before the sweep and outside it. Each unit is cheap — `Golomb.fromNBytes` reads a varint and slices the body, so the real cost is the per-entry `Buffer.from(hex)` — which is why it is not the anchor. It is still `n` allocations in one task on the same critical path, and a reviewer may reasonably want it chunked too, or the matcher built lazily inside the loop.
- **Also deliberately not changed:** `CoinjoinMempoolController.update()`, which is performance-complexity **p2-07** and a different method; and the fact that `AddressControllerShape` exposes only `address` and `path` (`types/backend.ts:184`), forcing `getAddressScript` to re-derive scripts the `CoinjoinAddressController` already stores. Both are complexity work, not scheduling work.
- **A reviewer could ask for the one-line variant instead** — keep `promiseAllSequence` and put the yield at the top of the action closure. Smaller diff. The explicit loop was chosen because it also drops two `n`-sized allocations that the current shape rebuilds on every `while` iteration: the `filters.map` closure array and `promiseAllSequence`'s results array, whose return value is discarded here. Not a strong preference.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
