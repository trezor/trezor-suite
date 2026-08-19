# `signTransaction` deserialises every referenced previous transaction in one task, right after the user commits to sending

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and
yield to the main thread"_. `SignTransaction.fetchRefTxs` downloads one hex per unique input
`prev_hash` and then byte-parses, hashes and re-encodes all of them in a single uninterrupted task.
Connect's core runs in-process on every platform, so this is the renderer main thread on suite-web,
the RN JS thread on suite-native, and the Electron **main** process on suite-desktop — and it lands
in the gap between the user clicking "Review & send transaction" and the review modal appearing.

## Where

[`packages/connect/src/api/signTransaction.ts:289`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/signTransaction.ts#L289)
· [`packages/connect/src/api/bitcoin/refTx.ts:74`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L74)
· [`packages/connect/src/api/bitcoin/refTx.ts:243`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L243)
· [`packages/connect/src/api/sendTransaction.ts:404`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/sendTransaction.ts#L404)

`fetchRefTxs` collects the unique previous-transaction ids with `getReferencedTransactions`
([`refTx.ts:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L43)),
fetches their hexes through `Blockchain.getTransactionHexes`
([`Blockchain.ts:193`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/backend/Blockchain.ts#L193)),
and then runs two synchronous `.map` passes back to back. `parseTransactionHexes` does a full
`BitcoinJsTransaction.fromHex` per hex; `transformReferencedTransactions` then calls `tx.getId()`
per transaction — a `hash256` over the freshly re-serialised bytes
([`utxo-lib/src/transaction/base.ts:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/utxo-lib/src/transaction/base.ts#L138)) —
hex-encodes every input `script_sig`
([`refTx.ts:221`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L221))
and every output `script_pubkey`
([`refTx.ts:227`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L227)),
and calls `getExtraData()`
([`refTx.ts:79`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L79)).
Nothing between the two `.then`s yields, and the whole raw `BitcoinJsTransaction[]` is materialised
before the second pass starts. The identical two-`.then` chain is at
[`sendTransaction.ts:404`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/sendTransaction.ts#L404).

Platform, verified by resolution rather than assumed: `packages/connect/package.json:23` maps the
`browser` entry to `src/index.browser.ts`, which builds `CoreInModuleWeb extends CoreInModule`
([`index.browser.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/index.browser.ts#L17),
[`impl/core-in-module.ts:35`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/impl/core-in-module.ts#L35)),
so on suite-web this runs in the renderer. The `react-native` entry resolves to `src/index.ts` →
`CoreInModuleNode`
([`index.ts:11`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/index.ts#L11)),
and suite-native imports `@trezor/connect` directly, so it runs on the RN JS thread. Only
suite-desktop-ui proxies over IPC
([`connect-electron/src/index.ts:18`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-electron/src/index.ts#L18)) —
there the core lives in `@trezor/suite-desktop-core`, i.e. the Electron main process, alongside the
transport read loop and every other pending connect call.

## Before

```ts
const refTxs = !refTxsIds.length
    ? []
    : await blockchain
          .getTransactionHexes(refTxsIds)
          .then(parseTransactionHexes(coinInfo.network))
          .then(rawTxs => transformReferencedTransactions(rawTxs));
```

```ts
export const parseTransactionHexes = (network?: Network) => (hexes: string[]) =>
    hexes.map(hex => BitcoinJsTransaction.fromHex(hex, { network }));
```

```ts
export const transformReferencedTransactions = (txs: BitcoinJsTransaction[]): RefTransaction[] =>
    txs.map(transformReferencedTransaction);
```

## After

`packages/connect/src/api/bitcoin/refTx.ts`, next to the existing exports (`yieldToMain` added to the
`@trezor/utils` import already on `refTx.ts:14`; introduced by whichever of these issues lands first):

```ts
const REFERENCED_TRANSACTIONS_BATCH_SIZE = 25;

// Each hex costs a full byte-parse plus a double-SHA256 in getId(), and the number
// of inputs is unbounded, so hand the main thread back between batches.
export const parseReferencedTransactions =
    (network?: Network) =>
    async (hexes: string[]): Promise<RefTransaction[]> => {
        const refTxs: RefTransaction[] = [];

        for (let i = 0; i < hexes.length; i += REFERENCED_TRANSACTIONS_BATCH_SIZE) {
            hexes.slice(i, i + REFERENCED_TRANSACTIONS_BATCH_SIZE).forEach(hex => {
                refTxs.push(
                    transformReferencedTransaction(BitcoinJsTransaction.fromHex(hex, { network })),
                );
            });

            await yieldToMain();
        }

        return refTxs;
    };
```

`packages/connect/src/api/signTransaction.ts:289` — one `.then` instead of two, and the intermediate
`BitcoinJsTransaction[]` is never built:

```ts
const refTxs = !refTxsIds.length
    ? []
    : await blockchain
          .getTransactionHexes(refTxsIds)
          .then(parseReferencedTransactions(coinInfo.network));
```

`packages/connect/src/api/sendTransaction.ts:404` — same shape:

```ts
refTxs = await this.getBlockchain(sendCoreMessage)
    .then(blockchain => blockchain.getTransactionHexes(refTxsIds))
    .then(parseReferencedTransactions(coinInfo.network));
```

`parseTransactionHexes` stays exported and unchanged: the `origTxs` branch at
`signTransaction.ts:300` still uses it with `transformOrigTransactions`.

## Why it matters

The user has clicked "Review & send transaction"
([`ReviewButton.tsx:111`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/TotalSent/ReviewButton.tsx#L111))
on a Bitcoin send form. The button disables itself, the thunk chain reaches
`TrezorConnect.signTransaction`
([`sendFormBitcoinThunks.ts:376`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L376)),
and connect starts `fetchRefTxs`. The review modal has not opened yet — it opens off the device
button request that only arrives once this work is done. So the visible symptom on web is that the
app stops responding after the click and the modal appears late, which is indistinguishable from a
hang for a user who has just committed money.

`n` is the number of **unique** input `prev_hash` values, and nothing on the path caps it: a
consolidation, or a spend from an account built out of many small UTXOs, routinely has hundreds of
inputs. The real cost is not `O(n)` but `O(total bytes of all previous transactions)` — a five-input
spend whose previous transactions are large exchange batch payouts parses five big transactions, and
each one gets walked three times (parse, `getId()` re-serialise + hash, per-script hex encode).

What is held, and for how long, differs by platform. On web it is the whole renderer: no paint, no
hover, no scroll, and the send form's disabled button cannot even repaint. On native it is the RN JS
thread, so any in-flight animation or screen transition stops. On desktop it is the Electron main
process, which also serialises the transport read loop and every other concurrent connect call —
different in kind, because it stalls work that has nothing to do with this send.

After the change the total work is identical and the result is byte-for-byte the same; it is simply
spread over `ceil(n / 25)` tasks with the thread free in between, so the renderer keeps painting and
the modal opens on the same schedule the network already dictates.

## Notes

- **Honest sizing — this is a tail case, and the tail is narrower than it first looks.**
  `getReferencedTransactions` dedupes by `prev_hash`, so `n ≤ input count`. For the ordinary
  one-to-three-input payment this loop does nothing measurable and the fix buys nothing. Crucially,
  `requireReferencedTransactions` returns `false` when every input is `SPENDTAPROOT` or `EXTERNAL`
  ([`refTx.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L37)),
  so **taproot and coinjoin accounts skip this path entirely** — the "coinjoin accounts hold
  thousands of UTXOs" argument does not apply here, and any version of this issue that leans on it is
  wrong. The population that actually hits the tail is legacy/segwit accounts with large input
  counts: consolidations, sweeps, and heavily address-reused accounts.
- **A reviewer can reasonably reject this on the "does responsiveness matter here?" question.** The
  user has just committed to sending and there is very little they legitimately want to do in this
  window. The two arguments that survive that objection are (a) the desktop case, where the blocked
  thread is the main process and the collateral damage is unrelated connect calls and transport
  reads, and (b) cancellation, below. If neither convinces, this is a P2, not a P1.
- **Cancellation gets better but is not actually wired up by this change.** Today `TrezorConnect.cancel`
  cannot be observed at all during this stretch; after the change the core can at least process the
  `CORE_CALL_CANCEL` message between batches
  ([`core/index.ts:718`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L718)).
  Checking it _inside_ the loop would be better, but `MethodContext`
  ([`AbstractMethod.ts:36`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/AbstractMethod.ts#L36))
  carries no abort signal — `Core` holds the `AbortController` privately
  ([`core/index.ts:767`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/core/index.ts#L767)) —
  so plumbing it through is a separate change and deliberately not attempted here.
- **Ordering is safe.** `signtx` reduces `refTxs` into a hash-keyed record before use
  ([`signtx.ts:278`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/signtx.ts#L278)),
  so array order is irrelevant; index order is preserved anyway. The device conversation only starts
  after `fetchRefTxs` resolves, so no protocol exchange can interleave with a batch.
- **Batch size 25 is a guess with a known weakness.** A fixed count is a poor proxy when previous
  transactions vary by orders of magnitude in size — one multi-hundred-output previous transaction
  still blows the budget on its own, and no count fixes that. Batching by cumulative hex length
  instead would be more honest; it was left out to keep the diff small, and this is the first place a
  reviewer should push back.
- **The yield is not free on the fallback path.** `scheduler.yield()` exists in Chromium, so
  suite-desktop and Chrome/Firefox web get a front-of-queue resume. Safari and Hermes fall back to
  `setTimeout(resolve, 0)`, which appends to the back of the queue, and on web the nested-timeout
  clamp puts a 5 ms floor on each turn after the fifth — arithmetic from the spec, not a
  measurement: a 500-input consolidation is 20 batches, so roughly 100 ms of added wall clock on
  Safari. That is a real regression in total duration traded for a responsive thread, and it should
  be stated to the reviewer rather than hidden.
- **Test coverage does not currently reach this code.** `refTx.test.ts` covers
  `requireReferencedTransactions`, `getReferencedTransactions` and `validateReferencedTransactions`
  only — neither `parseTransactionHexes` nor `transformReferencedTransactions` is unit-tested. The
  connect e2e fixtures all supply `refTxs` via `TX_CACHE` (e.g.
  `packages/connect/e2e/__fixtures__/signTransaction.ts:49`), which takes the
  `validateReferencedTransactions` path in the constructor, **not** `fetchRefTxs`. So this change
  ships with no existing guard; a colocated unit test asserting that
  `parseReferencedTransactions(network)(hexes)` equals
  `transformReferencedTransactions(parseTransactionHexes(network)(hexes))` for a >25-element fixture
  is a required part of the change, not optional.
- **Published-package impact.** `@trezor/connect` publishes `./lib/*`, so `refTx`'s exports are
  reachable by deep import. This only _adds_ `parseReferencedTransactions`; `parseTransactionHexes`
  and `transformReferencedTransactions` keep their signatures, so nothing breaks for external
  consumers. `@trezor/utils` is already a dependency (`packages/connect/package.json:105`).
- **`validateReferencedTransactions` is deliberately not changed.** It runs the same `fromHex`
  loop over host-supplied transactions
  ([`refTx.ts:275`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L275))
  but is called synchronously from the `SignTransaction` constructor
  ([`signTransaction.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/signTransaction.ts#L116)),
  so making it async means changing how the method is constructed. In Suite that path is only reached
  for native RBF on taproot/coinjoin accounts, where the array is filtered down to a single
  transaction
  ([`sendFormBitcoinThunks.ts:308`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/send/sendFormBitcoinThunks.ts#L308)),
  so `n` is 1 and the value is near zero. Follow-up at best.
- **The `After` has not been compiled or run.** Type-check and the connect unit suite are the minimum
  before this is taken seriously.
- **Skill correction, relevant to the native half of this.** `skills/performance-scheduling/SKILL.md`
  calls `InteractionManager.runAfterInteractions` React Native's "nearest equivalent" to
  `requestIdleCallback`. On the pinned RN (`suite-native/app/package.json:145`) the installed
  `InteractionManager` is `InteractionManagerStub`: every member is `@deprecated`,
  `runAfterInteractions` is a bare `setImmediate`, and `setDeadline` is a no-op. Nothing in this
  document proposes it — the RN lever here is the same explicit `yieldToMain` yield, which on Hermes
  resolves to the `setTimeout(0)` fallback — but the skill needs that correction regardless.
- Cross-references: **p2-12** covers the coinselect branch-and-bound search on the same in-process
  connect core and the same signing flow; the two stack, since compose and sign are consecutive
  stretches of blocked thread for one send. This document does not touch coinselect.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
