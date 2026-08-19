# Area 8 — Heavy synchronous compute: crypto, parsing, export, encoding

Scanned: packages/utxo-lib/src (compose/, coinselect/ incl. inputs/branchAndBound.ts + tryconfirmed.ts + coinselectUtils.ts, discovery.ts, derivation.ts, transaction/), packages/connect/src/api (signTransaction.ts, sendTransaction.ts, composeTransaction.ts, getAccountInfo.ts, bitcoin/{TransactionComposer,refTx,signtxVerify,inputs,outputs}.ts, firmware/{calculateFirmwareHash,uploadFirmware}.ts), packages/connect/src/{index.browser.ts,index.ts,impl/core-in-module.ts,workers/workers*.ts,package.json}, packages/connect-electron/src/index.ts, packages/protobuf/src (manager.ts, definitions/), packages/protocol/src (protocol-v1/encode.ts, protocol-bridge, protocol-thp), packages/blockchain-link/src/workers/solana/index.ts, packages/blockchain-link-utils/src, packages/suite/src/utils/wallet/exportTransactionsUtils.ts, packages/suite/src/actions/wallet/exportTransactionsActions.ts, packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx, packages/suite/src/utils/suite/{homescreen,logsUtils,qrCode}.ts, packages/suite/src/storage/migrations/index.ts, suite-common/wallet-utils/src/csvParserUtils.ts, packages/suite/src/hooks/wallet/useSendFormImport.ts, suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts, suite-common/trading/src/utils/tradeHistoryExportUtils.ts, suite-native/module-accounts-import/src/accountsImportThunks.ts
Findings: 3

## F8.1 — Chunk `prepareContent`/`prepareCsv`/`preparePdf` in exportTransactionsUtils.ts so exporting a whole account history stops freezing the wallet

- **Anchor:** `packages/suite/src/utils/wallet/exportTransactionsUtils.ts:152` (also `packages/suite/src/utils/wallet/exportTransactionsUtils.ts:163`, `packages/suite/src/utils/wallet/exportTransactionsUtils.ts:369`, `packages/suite/src/actions/wallet/exportTransactionsActions.ts:100`)
- **Class:** long-task
- **Platform:** web (identical code runs in the suite-desktop-ui Electron renderer)
- **What grows:** `data.transactions` is the account's **entire** transaction history. `ExportAction.runExport` first awaits `fetchAllTransactionsForAccountThunk` (`packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx:60`), which deliberately pulls every page before the export runs, so n is exactly "however many transactions this account has" — tens of thousands for an old BTC account or a coinjoin account, and the `.flatMap` at :163 _multiplies_ it: one output row per target + per token transfer + per internal transfer, so the row count is a few times the transaction count. Every row also runs `isPhishingTransaction`, two `new Intl.DateTimeFormat(...).format()` constructions (`:165`/`:168` — a fresh formatter per transaction), a `getFiatRateKey` lookup and BigNumber multiplication, and `formatAmounts` (`:81`) deep-copies `details.vin`/`details.vout`, `targets`, `tokens` and `internalTransfers` for each transaction.
- **When it runs:** the user picks .csv / .pdf / .json from the export dropdown on the transactions tab. Once per click, but at the exact moment the user has just asked for something.
- **Blocking-what:** the whole renderer. The dropdown's own `isLoading` spinner (`ExportAction.tsx:129`) cannot paint or animate, the transaction list is frozen, and any device event (`confirm on device`, disconnect) that arrives during the export queues behind it. This is the classic "the click freezes the app for the length of the history".
- **Before:**

```ts
    return transactions
        .filter(
            t =>
                !isPhishingTransaction({
                    transaction: t,
                    tokenDefinitions,
                    historicRates: historicFiatRates,
                    txsMarkedAsNotScam,
                }).isPhishing,
        )
        .map(formatAmounts(symbol))
        .flatMap(t => {
            const sharedData = {
                date: new Intl.DateTimeFormat('default', dateFormat).format(
                    (t.blockTime || 0) * 1000,
                ),
```

- **Proposed fix:** Make `prepareContent` async and drive it with an index loop that processes ~500 transactions per batch and `await yieldToMain()` between batches; `prepareCsv`/`preparePdf` then `await` it and their own `content.forEach` row loops (`:369`, `:403`) get the same treatment, appending into the `lines` array. The call site is already async all the way up — `formatData` is `async` (`:478`) and `exportTransactionsThunk` awaits it at `exportTransactionsActions.ts:100` — so no restructuring is needed above `prepareContent`. 500 is chosen because per-row work here is heavy (Intl + BigNumber + object spreads), so a smaller batch than the 25-account example in the skill would over-yield while a larger one would exceed 50 ms. Two cheap wins belong in the same change: hoist the two `Intl.DateTimeFormat` constructions to module scope, and note that the `pdfMake.createPdf(definitions).getBlob()` call at `:142` is itself an unchunkable synchronous layout pass over the same row count — pdfmake cannot be yielded through, so if PDF export stays slow after this fix the remaining lever is running pdfmake in a worker, not a finer chunk.
- **Risk / ordering:** Low. The output is a pure function of an already-materialised, already-sorted array (`exportTransactionsActions.ts:97` sorts before `formatData`), nothing else mutates it, and row order is preserved as long as batches are appended in index order. The one new hazard is re-entrancy: `ExportAction` guards with `isExportRunning` (`ExportAction.tsx:26`) so a second export cannot start, but there is no cancel path — if the user switches accounts mid-export the export still completes and still calls `saveAs`, which is the behaviour today too. Yielding does introduce the possibility that `historicFiatRates`/`tokenDefinitions` change mid-run; they are captured by reference before the loop starts, so the snapshot stays consistent.
- **Confidence:** high — read the full file; n is provably the whole history because the caller force-fetches it first.
- **Priority:** P1

## F8.2 — Chunk the referenced-transaction parse in signTransaction; `parseTransactionHexes` + `transformReferencedTransactions` deserialise every input's previous tx in one task

- **Anchor:** `packages/connect/src/api/signTransaction.ts:293` (also `packages/connect/src/api/bitcoin/refTx.ts:75`, `packages/connect/src/api/bitcoin/refTx.ts:244`, `packages/connect/src/api/sendTransaction.ts:406`)
- **Class:** long-task
- **Platform:** shared — connect's core runs **in-process** on every platform: `packages/connect/package.json` maps the `browser` entry to `src/index.browser.ts`, which constructs `CoreInModuleWeb extends CoreInModule` (`packages/connect/src/index.browser.ts:17`, `packages/connect/src/impl/core-in-module.ts:35`), so on suite-web this is the **renderer main thread**; the `react-native` entry resolves to `src/index.ts` → `CoreInModuleNode`, so on suite-native it is the **RN JS thread**; only suite-desktop-ui proxies over IPC (`packages/connect-electron/src/index.ts`), where it instead blocks the **Electron main process** — the same thread that runs the device transport read loop and every other pending connect call.
- **What grows:** one referenced transaction per **unique input prev_hash** (`getReferencedTransactions`, `refTx.ts:43`). A consolidation or a spend from an account made of many small UTXOs routinely has hundreds of inputs, and coinjoin accounts hold thousands of same-denomination UTXOs — nothing in the path caps it. Per referenced tx the loop does a full `BitcoinJsTransaction.fromHex` byte-parse (`refTx.ts:75`), then in `transformReferencedTransaction` a `tx.getId()` (double-SHA256 over the re-serialised transaction), a hex encode of every input `script_sig` and every output `script_pubkey`, and a `getExtraData()` call — so the real work is O(total bytes of all previous transactions), not O(inputs).
- **When it runs:** the user has clicked "Send" (or "Review & Send" for RBF) and `signTransaction` is preparing the TxAck data, immediately before the device prompt. The same code path runs from `sendTransaction.ts:406`.
- **Blocking-what:** on web, the entire Suite UI — including painting the "confirm on device" modal the user is being told to look at. On native, the RN JS thread, so the send screen stops responding to touches. On desktop it stalls the main process, delaying transport reads and any concurrent connect call.
- **Before:**

```ts
const refTxs = !refTxsIds.length
    ? []
    : await blockchain
          .getTransactionHexes(refTxsIds)
          .then(parseTransactionHexes(coinInfo.network))
          .then(rawTxs => transformReferencedTransactions(rawTxs));
```

- **Proposed fix:** Replace `parseTransactionHexes`/`transformReferencedTransactions` with an async variant that parses **and** transforms in the same pass over batches of ~25 hexes, `await yieldToMain()` between batches, and drop the intermediate `BitcoinJsTransaction[]` array entirely (today the whole history of raw parsed transactions is held in memory between the two `.then`s). 25 is small because a single `fromHex` + `getId()` on a large previous transaction is already multi-millisecond; the batch should stay under one frame. Both call sites are inside `async` methods and already in a promise chain, so this is a drop-in `await` with no restructuring. `validateReferencedTransactions` (`refTx.ts:266`, `fromHex` at `:275`) is the host-supplied variant of the same loop and should get the same treatment, but it is called synchronously from the `signTransaction` constructor path (`signTransaction.ts:116`) so it needs the caller made async first — worth splitting into a follow-up.
- **Risk / ordering:** The returned array order is only consumed by hash lookup (`refTx.ts:348` matches by `tx.hash`), and preserving index order across batches is trivial anyway. The real risk is re-entrancy: yielding lets connect's core process another message mid-flight, so a `cancel` could land between batches — that is an improvement (today cancel cannot be observed at all during this stretch) but the loop should check the method's abort/cancel state at each batch boundary rather than finishing the parse and throwing later. Nothing downstream assumes the refTxs land in one tick; the device conversation only starts afterwards.
- **Confidence:** high — traced the resolution of `@trezor/connect` on all three platforms and read the full `refTx.ts`.
- **Priority:** P1

## F8.3 — Bound and yield inside the coinselect branch-and-bound search; one `composeTransaction` can burn up to feeLevels × 8 × 1,000,000 BigInt iterations in a single task

- **Anchor:** `packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts:58` (also `packages/utxo-lib/src/coinselect/inputs/branchAndBound.ts:15`, `packages/utxo-lib/src/coinselect/tryconfirmed.ts:64`, `packages/connect/src/api/composeTransaction.ts:88`)
- **Class:** long-task
- **Platform:** shared — same in-process connect core as F8.2: renderer main thread on suite-web, RN JS thread on suite-native, Electron main process on suite-desktop.
- **What grows:** the depth-first search space is over `effectiveUtxos`, i.e. the account's spendable UTXO set (`account.utxo` is passed straight through at `suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts:134` → `createComposer` → `composeTx` → `coinselect`). The loop itself is capped at `MAX_TRIES = 1000000` (`:15`, decremented at `:120`), but that cap is a _ceiling on how bad it gets_, not a guarantee it is cheap: with a large UTXO set of similar-valued coins — exactly a coinjoin account, or any wallet that has received many small payments — the tree is wide enough that the search genuinely runs to the cap before returning `null`. That cap is then multiplied twice: `tryConfirmed` retries the whole algorithm for up to `own + (other - 1) + 2 = 8` progressively-looser confirmation trials (`tryconfirmed.ts:64`, calling the algorithm at `:77`), and `ComposeTransaction.run` maps over every fee level (`composeTransaction.ts:88`, typically economy/normal/high plus custom). Each iteration does BigInt add/subtract/compare, which is far from free.
- **When it runs:** every settled edit of the send-form amount or address (`useSendFormCompose` debounces, then dispatches `composeTransactionThunk`), every fee-level change, and every send-form open with a draft. Note it does **not** run in coin-control mode: `sendFormBitcoinThunks.ts:114` marks selected UTXOs `required: true` and `branchAndBound` bails at `branchAndBound.ts:142` when any input is required — so this is the plain "type an amount and send" path.
- **Blocking-what:** the user is typing an amount. On web and native this is the same thread that has to echo their keystrokes and repaint the fee summary, so the form visibly stalls between the debounce firing and the composed result appearing.
- **Before:**

```ts
    let tries = MAX_TRIES;
    ...
    let depth = 0;
    while (!done) {
        if (tries <= 0) {
            // Too many tries, exit
            return null;
        }
        ...
        tries--;
    }
```

- **Proposed fix:** Two levers, cheapest first. (1) `ComposeTransaction.run` (`composeTransaction.ts:88`) is the easy one — the method is called from an async core dispatch and only needs its `run()` to stay a promise (it already returns `Promise.resolve(levels)` at `:107`), so turn the `feeLevels.map` into an async loop with `await yieldToMain()` between levels; that alone caps a single uninterruptible stretch at one fee level instead of four. (2) For the search itself, make `search`/`tryConfirmed`/`coinselect`/`composeTx` async and `await yieldToMain()` every ~20,000 tries — 20k because that is roughly a frame's worth of BigInt loop iterations, and the counter already exists (`tries`) so the check is `if (tries % 20000 === 0) await yieldToMain()`. That is an invasive signature change through `composeTx`, so an interim step worth measuring first is simply lowering `MAX_TRIES` toward Bitcoin Core's 100,000 — the comment at `:131` says this port already is not 1:1 with core, and the 10× larger budget buys very little selection quality for a 10× worse tail.
- **Risk / ordering:** The search is pure and deterministic over a snapshot of `effectiveUtxos`, so yielding cannot change which inputs are selected — the result is identical, only later. The ordering hazard is at the connect layer: `composeTransaction` currently resolves all fee levels in one tick, and Suite's `useSendFormCompose` guards against out-of-order results with `composeRequestID` (`packages/suite/src/hooks/wallet/useSendFormCompose.ts:124`, compared at `:152`), so a longer wall-clock compose is already handled — but a newer compose request can now interleave with an older one inside core, so the method needs to honour cancellation at the yield points rather than assume it runs to completion. Lowering `MAX_TRIES` is the one change with an observable-output risk: it can make bnb give up where it previously found a changeless solution, falling back to `accumulative` and producing a change output. That needs a fixture run before shipping.
- **Confidence:** medium — the code path, the multipliers and the thread are all confirmed by reading; what I have not measured is how often a real UTXO set actually drives the search to the 1,000,000 cap rather than returning early at `branchAndBound.ts:77`/`:109`. The finding stands on the tail case, so it deserves a profile on a coinjoin account before it is written up as an issue.
- **Priority:** P2
