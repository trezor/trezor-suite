# Area 4 — blockchain-link workers, coinjoin, connect

Scanned: `packages/blockchain-link/src/workers/` (baseWorker.ts, state.ts, blockbook/index.ts, blockbook/websocket.ts, solana/index.ts, ripple/index.ts, blockfrost/index.ts, stellar/index.ts, evm-rpc/handlers/_, evm-rpc/tokens/_, electrum/index.ts, electrum/methods/getAccountInfo.ts, electrum/utils/discovery.ts), `packages/coinjoin/src/backend/` (scanAccount.ts, CoinjoinFilterController.ts, CoinjoinMempoolController.ts, CoinjoinAddressController.ts, CoinjoinBackend.ts, CoinjoinBackendClient.ts, filters.ts), `packages/coinjoin/src/client/` (CoinjoinClient.ts, CoinjoinPrison.ts, CoinjoinRound.ts, Status.ts, analyzeTransactions.ts, round/selectRound.ts), `packages/coinjoin/src/constants.ts`, `packages/connect/src/core/index.ts`, `packages/connect/src/workers/workers{,.browser,.native}.ts`, `packages/connect/src/api/bitcoin/{refTx,signtx}.ts`, `packages/connect/src/api/common/Discovery.ts`, `packages/connect/src/backend/{BackendManager,BlockchainLink}.ts`, `packages/connect/src/data/{coinInfo,protobufLoader,firmwareReleaseStore}.ts`, `packages/connect/src/utils/firmwareReleaseConfigUtils.ts`, plus the host wiring that decides which thread the above runs on (`packages/suite-desktop-core/src/modules/coinjoin.ts`, `packages/suite-desktop-core/src/threads/coinjoin-backend.ts`, `packages/suite-desktop-core/src/libs/thread.ts`, `packages/connect-electron/src/index.ts`, `suite/coinjoin/src/config.ts`, `suite/coinjoin/src/coinjoinAccountActions.ts`, `packages/suite/src/actions/suite/initAction.ts`).
Findings: 4

## Thread map established while scanning (applies to every finding below)

This matters more than usual here, because "worker" in this tree does **not** always mean a real
Web Worker:

- `packages/connect/package.json` maps `./src/workers/workers` per platform.
  `workers.browser.ts:5-43` creates real `new Worker(...)` for blockbook / blockfrost / ripple /
  stellar, but `SolanaWorker` and `EvmRpcWorker` are plain dynamic **module** imports
  (`workers.browser.ts:46-57`, with the comment "Solana has some issues with worker-loader, so it's
  not used in the browser") — they run on the connect iframe's main thread.
- `workers.native.ts:1-6` imports **all six** worker modules directly. On suite-native every
  blockchain-link "worker" runs on the React Native JS thread, together with connect core
  (`suite-native/blockchain/src/useBlockchainConnectionManager.ts` imports `@trezor/connect`
  directly, and `suite-native/app-init/src/appInitThunks.ts:78` awaits `connectInitThunk`).
- `workers.ts` (node/desktop) is dynamic-import module context. On desktop, connect core lives in
  the Electron **main** process behind `@trezor/ipc-proxy` (`packages/connect-electron/src/index.ts`),
  so blocking it stalls IPC to the renderer and device transport.
- Coinjoin splits: `CoinjoinBackend` runs in an Electron **utility process**
  (`suite-desktop-core/src/threads/coinjoin-backend.ts` → `libs/thread.ts`, `process.parentPort`),
  while `CoinjoinClient` is constructed **directly in the Electron main process**
  (`suite-desktop-core/src/modules/coinjoin.ts:138 — new CoinjoinClient(settings)`), i.e. next to
  connect core and device communication.
- `WorkerState` (`packages/blockchain-link/src/workers/state.ts`) is quadratic but that is
  performance-complexity p1-07 and is deliberately not re-reported here.

---

## F4.1 — Chunk the coinjoin `scanAccount` block-filter loop and yield between filter batches

- **Anchor:** `packages/coinjoin/src/backend/scanAccount.ts:49` (also `packages/coinjoin/src/backend/scanAccount.ts:53`, `packages/coinjoin/src/backend/CoinjoinFilterController.ts:95`, `packages/coinjoin/src/backend/CoinjoinFilterController.ts:111`)
- **Class:** long-task
- **Platform:** desktop (Electron utility process — the coinjoin backend thread)
- **What grows:** n = number of Bitcoin blocks between the account checkpoint and chain tip. For a
  fresh coinjoin account on mainnet the base block is height 778666 (`suite/coinjoin/src/config.ts:32`)
  and the scan runs to tip — hundreds of thousands of blocks, and it only grows with time. Per block
  the loop builds a Golomb-Rice filter from hex (`filters.ts:23-29`) and runs `filter.matchAny` over
  every derived receive+change script; the script count itself grows with the account
  (`CoinjoinAddressController.deriveMore` keeps extending both chains, change lookout 50).
- **When it runs:** every coinjoin account discovery — first enable of a coinjoin account, and every
  resumed sync from the stored checkpoint (`CoinjoinBackend.scanAccount`, driven from
  `suite/coinjoin/src/coinjoinAccountActions.ts`).
- **Blocking-what:** the coinjoin backend thread's `process.parentPort` message loop. While a batch is
  being matched, the thread cannot process inbound `ThreadProxy` calls — that includes
  `CoinjoinBackend.cancel()` / `disable()` (`CoinjoinBackend.ts:95-102`), which is exactly what the
  user triggers by pressing stop, disabling coinjoin, or leaving the account. Their click sits until
  the current batch finishes.
- **Before:**

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

and, on the producing side, the generator that feeds it never awaits inside a batch:

```ts
                const nextBatchPromise = fetchFilterBatch(last).finally(() => { /* progress */ });

                for (const filter of filters) {
                    const filterParams = { M, P, key: zeroedKey ? undefined : filter.blockHash };
                    yield { ...filter, filterParams };
```

- **Proposed fix:** `for await` over an async generator only produces **microtask** turns; the
  macrotask queue (and therefore inbound thread messages) is never serviced inside a batch. Worse,
  `CoinjoinFilterController` prefetches the next batch into `nextBatchPromise` _before_ yielding, so
  `await nextBatchPromise` at line 111 is usually already settled and does not create a macrotask
  boundary either — consecutive batches can chain into one unbroken task. Add a `yieldToMain()`
  helper (`scheduler.yield?.() ?? new Promise(r => setTimeout(r, 0))`; this thread is Node/Chromium,
  no Safari fallback needed) and await it every ~64 filters inside the `for await` body — 64 keeps a
  single slice well under 50 ms at mainnet's `filtersBatchSize: 500` while adding ~8 yields per
  network batch. The call site is already `async`, so this is a one-line insertion.
- **Risk / ordering:** yielding lets an `abort()` land mid-batch, which is the point; `abortSignal` is
  already threaded through `fetchBlock`/`fetchBlockFilters`, but the loop itself never checks it, so
  the fix should also `if (abortSignal?.aborted) return` after each yield rather than relying on the
  next fetch to throw. `onProgress` emission is cooldown-driven (`CHECKPOINT_COOLDOWN` 10 s) and
  checkpoint state is recomputed per iteration, so an extra yield does not reorder or duplicate
  checkpoints. Nothing downstream assumes a whole batch lands in one tick.
- **Confidence:** high — I read the loop, the generator that feeds it, the batch size in the real
  mainnet config, and the thread it runs on. Note performance-complexity **p2-10** covers the
  separate defect of rebuilding `scripts` on every iteration; that fix reduces the constant but the
  loop is still one uninterruptible task afterwards.
- **Priority:** P2 (unbounded n, but coinjoin discovery is a desktop-only, opt-in path)

---

## F4.2 — Yield between mempool-filter matches in `CoinjoinMempoolController.init`

- **Anchor:** `packages/coinjoin/src/backend/CoinjoinMempoolController.ts:146` (also `packages/coinjoin/src/backend/CoinjoinMempoolController.ts:141`, `packages/coinjoin/src/backend/CoinjoinMempoolController.ts:122`)
- **Class:** long-task
- **Platform:** desktop (Electron utility process — the coinjoin backend thread)
- **What grows:** n = number of entries returned by `fetchMempoolFilters()`, i.e. one Golomb filter
  per transaction currently in the Bitcoin mempool. That is set by network congestion, not by the
  user — routinely tens of thousands, and during fee spikes well over 100k. The outer `while` loop
  re-runs the whole filter sweep once per address-derivation round (`addressController.analyze`
  extends the chains whenever a hit is found), so the real work is `filters.length × iterations`,
  each match hashing every derived script.
- **When it runs:** at the tail of every coinjoin `scanAccount` (`scanAccount.ts:82-84`, the
  `mempool.status === 'stopped'` branch) — so on coinjoin account load and after any backend
  reconnect that stopped the mempool subscription.
- **Blocking-what:** same thread as F4.1 — the coinjoin backend's message loop. This runs _after_ the
  block scan, right at the moment the UI is about to flip the account to `ready`; a stop/disable click
  or a `setTorSettings` push arriving here waits for the whole sweep.
- **Before:**

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

- **Proposed fix:** `promiseAllSequence` is a plain `for` loop with `await action()`
  (`packages/utils/src/promiseAllSequence.ts:18-23`); when the action does not hit the network — the
  common case, since `matchAny` returns false for nearly every mempool tx — the `await` only queues a
  microtask, so the entire filter list is matched inside a single macrotask. Insert an unconditional
  `await yieldToMain()` every ~128 filters (128 × one GCS match stays comfortably under 50 ms, and
  for a 50k-entry mempool that is ~400 yields, negligible overhead). The body is already `async`, so
  the batching can go straight into the action closure or replace `promiseAllSequence` with an
  explicit chunked `for` loop.
- **Risk / ordering:** `addTx` guards on `this.mempool.has(txid)` and `onTransactionAdd` is idempotent
  per txid, so interleaving a websocket-delivered `onTxAdd` (the mempool subscription is started
  right before this, `scanAccount.ts:82`) between chunks is already a case the code handles — a tx
  arriving via subscription simply makes the later `addTx` a no-op. The returned `set` is built from
  `addressController.analyze` after the sweep, so the yield does not change what is returned. There is
  no cancel path here today (`init` ignores `abortSignal`), which is itself an argument for yielding.
- **Confidence:** high — read the loop, read `promiseAllSequence`, confirmed `filters` comes straight
  from the coordinator's full mempool filter set (`CoinjoinBackendClient.fetchMempoolFilters`).
  performance-complexity p2-07 covers `update()`, a different method in this file.
- **Priority:** P2 (unbounded n set by network conditions, colder opt-in path)

---

## F4.3 — Chunk `getAnonymityScores`' per-transaction script derivation off the Electron main process

- **Anchor:** `packages/coinjoin/src/client/analyzeTransactions.ts:69` (also `packages/coinjoin/src/client/analyzeTransactions.ts:31`)
- **Class:** long-task
- **Platform:** desktop (Electron **main** process — `CoinjoinClient` is instantiated there, not in a thread)
- **What grows:** n = total vin + vout across the account's **entire** transaction history. Coinjoin
  rounds are large by construction (order 10²–10³ inputs and outputs per joint transaction), and a
  user who has been coinjoining accumulates hundreds of them, so n reaches 10⁵–10⁶ entries. For every
  entry that is not account-owned, `transformVinVout` runs
  `addressBjs.toOutputScript(Address, network).toString('hex')` — a full address decode plus two
  buffer allocations. There is no `await` anywhere inside the `map`.
- **When it runs:** on every coinjoin account sync. `suite/coinjoin/src/coinjoinAccountActions.ts:371`
  and `:511`/`:518` call `client.analyzeTransactions(accountInfo.history.transactions)` with the full
  history — on initial load, and again on each discovery progress round / new joint transaction.
- **Blocking-what:** the Electron main process, which also hosts connect core
  (`suite-desktop-core/src/modules/trezor-connect.ts`) and every `ipc-proxy` reply to the renderer.
  While this map runs, device communication and all renderer IPC are stalled — the user is at that
  moment watching the coinjoin account finish syncing and may be trying to interact with the device.
- **Before:**

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

        return { InternalInputs, ExternalInputs, InternalOutputs, ExternalOutputs };
    });
```

- **Proposed fix:** the function is already `async` and the result is only consumed by the single
  `middleware.getAnonymityScores` POST that follows, so the map can become a chunked loop that
  accumulates into `formattedTransactions` and `await yieldToMain()` every ~50 transactions (50
  coinjoin transactions ≈ 10⁴ address decodes, which is the right order to keep a slice under 50 ms).
  No Safari fallback is needed on this thread. If chunking is not enough, the whole formatting pass is
  pure and self-contained and would be a good candidate to move into the coinjoin backend utility
  process rather than the main process.
- **Risk / ordering:** the transform is pure and order-preserving as long as chunks are appended in
  order; the middleware call only happens after the full array is built, so a yield cannot produce a
  partial POST. The only re-entrancy concern is two overlapping `analyzeTransactions` calls for
  different accounts interleaving — they operate on separate local arrays, so that is safe, and the
  shared `abortController.signal` already short-circuits the middleware request on `disable()`.
- **Confidence:** high — read the function, both call sites in `coinjoinAccountActions.ts`, and
  confirmed `CoinjoinClient` is created in the main process rather than a thread. `arrayPartition`'s
  own O(n²) allocation behaviour is performance-complexity p1-05; fixing that lowers the constant but
  leaves this a single uninterruptible task.
- **Priority:** P2 (unbounded n, holds the process that owns device communication, but coinjoin-only)

---

## F4.4 — Stop holding connect's device discovery behind the remote firmware-releases fetch

- **Anchor:** `packages/connect/src/core/index.ts:982` (also `packages/connect/src/core/index.ts:994`, `packages/connect/src/utils/firmwareReleaseConfigUtils.ts:90`, `packages/suite/src/actions/suite/initAction.ts:85`)
- **Class:** startup-serialisation
- **Platform:** shared (web: connect iframe; desktop: Electron main process; native: RN JS thread — all three await this)
- **What grows:** not a collection — this is a fixed but _unbounded-in-latency_ remote round trip:
  `fetchRemoteJws` GETs `https://data.trezor.io/firmware/config/releases.v1.json` with a 5000 ms abort
  timeout, then JWS-ES256-verifies and JSON-parses the payload. On a slow link, on Tor, or offline,
  the full 5 s elapses before the fallback to the bundled config is taken.
- **When it runs:** every app start. `Core.init` awaits it _before_ `loadProtobufModules()` and before
  `new DeviceList(...)` / `initDeviceList(...)`, and Suite awaits the whole thing at
  `initAction.ts:85` while the Preloader is on screen.
- **Blocking-what:** the user is waiting for the app to become usable and for their plugged-in Trezor
  to be detected. Neither the firmware release list nor `initializeFirmwareConfig` is needed for that —
  it is only consumed once a device is connected _and_ firmware update is reached, and a bundled local
  config (`getOnlyLocalFirmwareReleaseConfig`) is already the accepted fallback whenever the fetch
  fails.
- **Before:**

```ts
settingsStore.set({ ...settings, enabledNetworks: undefined });
enabledNetworksStore.set(settings.enabledNetworks ?? []);
await firmwareReleaseStore.init(settings.firmwareChannel, false, initializeFirmwareConfig);
const localFirmwares = settings.localFirmwares && parseLocalFirmwares(settings.localFirmwares);
if (localFirmwares) {
    localFirmwareStore.set(localFirmwares);
}
await loadProtobufModules();

this._deviceList = new DeviceList({
    createLogger: this.createLogger,
});
```

and the awaited fetch itself:

```ts
const controller = new AbortController();
const timeoutId = setTimeout(
    () => controller.abort('Request timed out'),
    JWS_CONFIG.REQUEST_TIMEOUT_MS,
);

const response = await fetch(remoteReleasesUrl.toString(), { signal: controller.signal });
```

- **Proposed fix:** two independent moves. (1) Break the serialisation: `loadProtobufModules()` and
  `DeviceList` creation do not depend on the firmware config, so seed the store synchronously with the
  bundled config and kick the remote refresh off without awaiting it — keep the resulting promise in
  `firmwareReleaseStore` as a `ready` handle that only the firmware-update entry points await.
  (2) Schedule the refresh itself as non-essential: wrap it in `requestIdleCallback(..., { timeout: 5000 })`
  on web/desktop (behind a `setTimeout` fallback — `requestIdleCallback` is not Baseline and has no
  Safari support), and `InteractionManager.runAfterInteractions` on native; 5000 ms mirrors the fetch's
  own abort budget so a device connected in the first seconds still gets fresh data before the user can
  reach the firmware screen. `Core.init` is already `async`, so this is a restructure of awaits, not a
  sync-to-async conversion.
- **Risk / ordering:** the real risk is a firmware code path reading `getReleases()` before the refresh
  resolves; today it can only ever be the bundled config or the remote one, so every reader must be
  routed through the `ready` promise (`getBinary`, `checkFirmwareRevision`, the firmware-update
  workflow) rather than the bare getter. Behaviour is unchanged when offline, since the local config is
  already what those readers get. There is no cancel path today; `Core.dispose()` should abort the
  in-flight refresh so a quick quit does not leave a pending fetch.
- **Confidence:** high — read `Core.init`, `firmwareReleaseStore.init`, `getFirmwareReleaseConfig`
  including the 5 s timeout and local fallback, and confirmed `initAction.ts:85` awaits
  `connectInitThunk` on the Preloader path (native does the same at
  `suite-native/app-init/src/appInitThunks.ts:78`).
- **Priority:** P1 (every app start, on every platform, on the first-paint / device-detection path)

---

## Checked and deliberately not reported

- `packages/blockchain-link/src/workers/state.ts` (quadratic address/account bookkeeping) — that is
  performance-complexity p1-07; the fix is a Map, not a yield.
- `packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts:148-166`
  (`extendAddressInfo` / `sumAddressValues`) — performance-complexity p2-04.
- `packages/blockchain-link/src/workers/blockbook/index.ts:61` (`transformAccountInfo`) — the single
  uninterruptible task here is driven by the quadratic address rescan inside `transformTransaction`
  (performance-complexity p1-04), and the per-request transaction count is page-bounded, so the
  scheduling fix is not the primary one.
- `packages/blockchain-link/src/workers/solana/index.ts:56-72` (`getAllSignatures` `while` loop) —
  genuinely serial: `getSignaturesForAddress` is cursor-paginated on `before`, so the awaits cannot be
  batched. The `allSignatures = [...allSignatures, ...signatures]` spread accumulator is a
  performance-complexity concern, not a scheduling one.
- `packages/coinjoin/src/client/CoinjoinPrison.ts:53-58` (`setImmediate` / `setTimeout(fn, 0)`) — this
  is a deliberate trailing-edge coalescer for burst `change` emissions with a matching
  `clearImmediate`/`clearTimeout`, not a yield or a nested-timeout chain. Correct as written.
- `packages/connect/src/core/index.ts:1024` (`setTimeout(throttlePromise.resolve, 0)`) — a one-shot
  flush of queued core events after init, not a scheduler and not nested.
- `packages/connect/src/data/coinInfo.ts:283` (`parseCoinsJson` at module load) — n is 50 network
  definitions across two ~44 KB / ~8 KB JSON files. Bounded and cheap.
- `packages/connect/src/api/bitcoin/refTx.ts:266` and `signtx.ts` — n is bounded by the input/output
  count of the transaction being signed, and the `signtx` loop is driven by device I/O (every
  `typedCall` awaits the device), so there is no uninterrupted CPU stretch.
- `packages/connect/src/api/common/Discovery.ts:113` — the `while` loop awaits the device and the
  backend on every iteration; it is latency-bound, not a long task.
- `packages/coinjoin/src/client/round/selectRound.ts` — n is utxos × active rounds and the hot spot is
  `registeredOutpoints.includes(...)`, i.e. performance-complexity.
