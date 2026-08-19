# `scanAccount` matches block filters from the account checkpoint to chain tip without returning to its process's event loop

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. The coinjoin block scan is a `for await` over an async generator, and `for await` produces only microtask turns: the generator prefetches the next network batch _before_ handing out the filters of the current one, so when the prefetch wins the race the loop chains batch into batch with no event-loop turn in between. Nothing inbound to that process is serviced while it runs.

## Where

[`packages/coinjoin/src/backend/scanAccount.ts:49`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L49) — the consumer loop, fed by the iterator built one line earlier at [`:47`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L47).

Per iteration the body decodes one Golomb-Rice filter from hex and matches it against every derived script ([`getMultiFilter`, `filters.ts:34`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/filters.ts#L34)). The only `await` in that body is inside the `if (isMatch(scripts))` branch at [`:53`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L53)–[`:54`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/scanAccount.ts#L54), and that branch is taken only on a real hit or a filter false positive — for a coinjoin account with a handful of transactions, almost never. So the common path through the loop touches no macrotask boundary at all.

The producer does not add one either. [`CoinjoinFilterController.ts:87`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinFilterController.ts#L87) starts the fetch for the _next_ batch before the `for` at [`:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinFilterController.ts#L95) begins handing out the current one:

```ts
                const nextBatchPromise = fetchFilterBatch(last).finally(() => {
                    onProgressInfo?.({
                        stage: 'block',
                        activity: 'scan',
                        batchFrom: last.blockHeight,
                    });
                });

                for (const filter of filters) {
                    const filterParams = { M, P, key: zeroedKey ? undefined : filter.blockHash };
                    yield { ...filter, filterParams };
```

By the time control reaches `batch = await nextBatchPromise` at [`:111`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinFilterController.ts#L111) that promise may already be settled, and awaiting a settled promise queues a microtask, not a task. Consecutive batches then run as one uninterrupted stretch.

**Which thread this is.** Not the Electron main process, and not a renderer. `CoinjoinBackend` runs in its own Electron **utility process**: `suite/coinjoin/src/coinjoinService.ts` proxies it over `@trezor/ipc-proxy` and throws for anything but desktop ([`:21`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinService.ts#L21)); the main-process handler wraps it in a `ThreadProxy` ([`packages/suite-desktop-core/src/modules/coinjoin.ts:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/coinjoin.ts#L71)) which forks [`packages/suite-desktop-core/src/libs/thread-proxy.ts:54`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/thread-proxy.ts#L54); the child is [`threads/coinjoin-backend.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/threads/coinjoin-backend.ts#L51), whose entire control channel is the `process.parentPort` message handler at [`libs/thread.ts:64`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/thread.ts#L64). Only `CoinjoinClient` is constructed in the main process. So the cost of the long task here is a starved control channel, **not** a dropped frame — see _Why it matters_.

## Before

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
            addresses.analyze(
                ({ address }) => block.txs.filter(doesTxContainAddress(address)),
                transactions => transactions.forEach(txs.add, txs),
            );
        }
```

## After

```ts
import { createCooldown, yieldToMain } from '@trezor/utils';
```

```ts
import { CHECKPOINT_COOLDOWN, FILTERS_PER_YIELD } from '../constants';
```

```ts
    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal, onProgressInfo });

    let filtersSinceYield = 0;

    for await (const { blockHash, blockHeight, filter, filterParams } of everyFilter) {
        filtersSinceYield += 1;

        if (filtersSinceYield === FILTERS_PER_YIELD) {
            filtersSinceYield = 0;
            await yieldToMain();
            abortSignal?.throwIfAborted();
        }

        const isMatch = getMultiFilter(filter, filterParams);
        const scripts = addresses.receive.concat(addresses.change).map(({ script }) => script);

        if (isMatch(scripts)) {
            const block = await client.fetchBlock(blockHeight, { signal: abortSignal });
            if (mempool?.status === 'running') {
                mempool.removeTransactions(block.txs.map(({ txid }) => txid));
            }
            addresses.analyze(
                ({ address }) => block.txs.filter(doesTxContainAddress(address)),
                transactions => transactions.forEach(txs.add, txs),
            );
        }
```

with the constant next to the two cooldowns it sits beside in [`packages/coinjoin/src/constants.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L1):

```ts
// number of block filters matched by scanAccount between two yields to the event loop
export const FILTERS_PER_YIELD = 64;
```

`yieldToMain` is the shared helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`) — `scheduler.yield()` when it exists, `setTimeout(resolve, 0)` otherwise.

## Why it matters

The user has enabled a coinjoin account, or opened one whose stored checkpoint is behind the tip, and discovery is running ([`suite/coinjoin/src/coinjoinAccountActions.ts:483`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L483)).

`n` is the number of block filters between the checkpoint and the chain tip. For a fresh mainnet account that is every block since the base block at height 778666, mined in February 2023 ([`suite/coinjoin/src/config.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/config.ts#L32)) — Bitcoin adds roughly 144 blocks a day, so the first scan of a fresh account is well over a hundred thousand filters and grows every day this issue stays open. A resumed scan is smaller but has the same shape. Each filter is decoded from hex and matched against the full derived script set, which starts at 20 receive + 50 change addresses ([`constants.ts:7`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L7), [`:10`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/constants.ts#L10)) and is extended whenever a hit lands ([`CoinjoinAddressController.ts:87`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinAddressController.ts#L87)).

What is held is the utility process's event loop, and therefore its `process.parentPort` message handler. Inbound calls that sit behind it:

- **`cancel()`** ([`CoinjoinBackend.ts:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/CoinjoinBackend.ts#L95)), dispatched by [`coinjoinMiddleware.ts:60`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinMiddleware.ts#L60) the moment the user routes away from the wallet — clicking Settings, for example. Today that abort is not seen until the loop next touches the network, so the process keeps decoding filters for a scan the user has already walked away from.
- **`setTorSettings`** pushes ([`modules/coinjoin.ts:91`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/coinjoin.ts#L91)) — the user toggles Tor in settings and the backend keeps using the previous settings for requests it makes in the meantime.

After the fix the loop returns to the event loop every `FILTERS_PER_YIELD` filters, the queued message runs, and `throwIfAborted()` ends the scan at filter granularity instead of batch granularity.

**Honest sizing: this is P2, and weaker than a long-task finding usually is.**

- **Nothing paints from this process.** There is no frame to drop and no click to delay in it. The 50 ms long-task threshold is a UI-thread number; the argument here is control-channel latency and abort responsiveness, which is a real but smaller thing. A reviewer who wants to close this on those grounds has a fair case.
- **The unbroken stretch is probably one batch, not the whole scan.** `filtersBatchSize` is 500 on mainnet ([`config.ts:36`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/config.ts#L36)), and batches chain into one task only when the prefetch at `:87` settles before the matcher finishes the previous 500. Over Tor the network is very likely the slower side, in which case `await nextBatchPromise` at `:111` does give up the event loop once per batch, and the true blocking unit is 500 filter decodes. That is still an arbitrary number chosen for network efficiency rather than for task length, but it is not unbounded.
- **`disable()` is not blocked**, contrary to what the surface reading suggests. [`modules/coinjoin.ts:99`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/coinjoin.ts#L99) intercepts `disable` in the main process and calls `ThreadProxy.dispose()`, which kills the utility process outright rather than forwarding the call. Leaving the account is therefore prompt today.
- **Outbound progress still flows.** `onProgress` / `onProgressInfo` reach the main process through `postMessage`, which serialises synchronously and does not need this process's event loop to deliver. The discovery progress bar does not stall — so there is no user-visible freeze to point at.
- Total CPU does not go down. Yielding moves when the work happens, not how much of it there is.

## Notes

- **The After hunk has not been compiled.** It is written against the real types by reading; `abortSignal` is `AbortSignal | undefined` on `ScanAccountContext` (`packages/coinjoin/src/types/backend.ts:104`), hence the optional call.
- **`yieldToMain` will take its `setTimeout` branch here, not `scheduler.yield()`.** An Electron utility process is a Node environment without Blink, so there is no `scheduler` global — Node exposes `scheduler` only from `node:timers/promises`, and `typeof globalThis.scheduler` is `undefined` on the repo's Node (`.nvmrc` pins `24.17.0`; checked on the v24.8.0 runtime this sweep ran under). This is worth flagging back into `skills/performance-scheduling/SKILL.md`, which says "`suite-desktop` is Chromium and always has the real thing" — true of the renderer, not of `utilityProcess.fork` children or the main process.
- **Which means the fix pays Node's 1 ms timer floor.** Node coerces `setTimeout(fn, 0)` to 1 ms, so each yield costs at least a timer tick: at `FILTERS_PER_YIELD = 64` a fresh mainnet scan adds on the order of `n / 64` milliseconds of wall clock, seconds rather than milliseconds across a scan that is already many minutes of Tor round trips. `setImmediate` has no such floor and is the right primitive in a Node context. **A reviewer should push back here**: either raise the constant, or give `yieldToMain` a `setImmediate` branch when it exists. The second is the better answer and belongs in the helper, not in this call site — but it makes this issue depend on a helper decision the other documents in this sweep also touch.
- **Why 64 and not 500.** It is a guess, not a measurement — chosen so that roughly eight yields fall inside one network batch, which is frequent enough that a `cancel()` lands promptly and rare enough that the timer overhead above stays a rounding error on the fetch it overlaps. Nothing was profiled. If the per-filter cost turns out to be far below what this assumes, the constant should go up.
- **`throwIfAborted()` changes when abort surfaces, not what it does.** Abort already ends the scan by rejection today: the in-flight `fetchBlockFilters` rejects and the throw propagates out of `scanAccount`, where [`coinjoinAccountActions.ts:541`](https://github.com/trezor/trezor-suite/blob/develop/suite/coinjoin/src/coinjoinAccountActions.ts#L541) catches it and ends the sync with `error` or `out-of-sync`. The added check reaches that same catch sooner. Deliberately **not** an early `return` — returning a partial result would end the sync as `ready` on a scan that never reached the tip.
- **Ordering and re-entrancy.** The yield lets a queued `parentPort` message run mid-scan. `cancel()` and `setTorSettings` only mutate an `AbortController` and a settings field, and `scanAccount` holds no lock, so there is no state a message handler could tear out from under the loop. The one genuine re-entrancy question is a second `scanAccount` call arriving while the first is mid-loop: `CoinjoinBackend.scanAccount` overwrites `this.abortController` (`:52`), so the second call would orphan the first scan's signal. That hazard exists today and this change makes it reachable at a finer granularity — it is the thing to look hardest at in review.
- **The checkpoint stream is unaffected.** `checkpointCooldown` is time-based (`CHECKPOINT_COOLDOWN` 10 s) and the checkpoint object is rebuilt from `addresses` on every iteration, so an extra yield cannot duplicate, reorder or skip a `onProgress` emission.
- **Tests.** `packages/coinjoin/src/backend/methods.test.ts` and `CoinjoinFilterController.test.ts` drive the real loop against `MockBackendClient` / `MockFilterClient` with real timers — no `jest.useFakeTimers()` anywhere under `src/backend` — so the added `setTimeout(0)` resolves normally and the fixtures (16 filters, batch size 5) never reach the 64th filter. Expect them to pass unchanged, which also means the yield gets no coverage. A test that asserts the loop yields would have to count event-loop turns; it is not obvious it is worth writing.
- **Published-package impact.** `@trezor/coinjoin` is a published package and gains a dependency on a new `@trezor/utils` export; adding `yieldToMain` to `@trezor/utils` is itself a published-API addition. The new `FILTERS_PER_YIELD` is exported from `constants.ts` like everything else in that file, so it becomes public surface too — acceptable, but say so rather than let it slip in.
- **Platform.** Desktop only. Coinjoin has no web or mobile path (`coinjoinService.ts:21`), so no Safari fallback concern and nothing changes for suite-native.
- **Deliberately not changed:** the rebuild of `scripts` on every iteration at `scanAccount.ts:51`, which is performance-complexity **p2-10**. That fix lowers the constant per filter; it does not make the loop interruptible, and the two are independent. The mempool sweep at the tail of the same function (`:81`–`:89`) is **p2-03** in this set, and `CoinjoinMempoolController.update()` is performance-complexity **p2-07**.
- **A reviewer could reasonably ask for the yield in the generator instead** — put it in `CoinjoinFilterController` before `yield` at `:97` and every consumer of the iterator gets it for free. It was put in the consumer because that is where the per-filter work and the `abortSignal` live, and because making a generator responsible for its consumer's scheduling is a surprising place to look for it. Not a strong preference.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
