# Transaction export formats the whole account history in one synchronous pass, so the wallet freezes for the length of the history

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and
yield to the main thread"_. This is the clearest long-task case in the set, and the only one where the
freeze is a direct answer to a click: the user picks `.csv` / `.pdf` / `.json` from the export dropdown,
and every transaction the account has ever had is formatted into rows in a single task before anything
can repaint. The caller deliberately force-fetches the complete history first, so `n` is not "a page" or
"what is on screen" — it is the account.

## Where

[`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:144`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L144)
— `prepareContent`, a `filter → map → flatMap → filter` chain from
[`:152`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L152)
to
[`:318`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L318)
over `data.transactions`. It is called once by `prepareCsv`
([`:353`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L353))
and once by `preparePdf`
([`:400`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L400)),
each of which then walks the produced rows again in its own `content.forEach`
([`:369`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L369),
[`:403`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L403)).

### How the whole history gets there

`ExportAction.runExport`
([`ExportAction.tsx:44`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L44))
first awaits `fetchAllTransactionsForAccountThunk`
([`:60-65`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L60-L65)),
whose `while (true)` page loop
([`transactionsThunks.ts:743`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L743))
runs until there are no more pages, and only then dispatches `exportTransactionsThunk`
([`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L67)).
That thunk reads the account's transactions out of the store
([`exportTransactionsActions.ts:79`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/exportTransactionsActions.ts#L79)),
sorts them
([`:97`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/exportTransactionsActions.ts#L97))
and awaits `formatData`
([`:100`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/exportTransactionsActions.ts#L100)).
So the fetch is paginated and interruptible; the formatting that follows it is not.

### What one transaction costs, and what one transaction produces

The `flatMap` at
[`:163`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L163)
emits **one row per target, per token transfer, per internal transfer**, plus one for Cardano staking
([`:316`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L316)),
so the row count is a multiple of the transaction count and the multiplier varies per transaction. Per
transaction, before any row is emitted:

| Work                                                                                                                                                                   | Where                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isPhishingTransaction` — rebuilds the transaction with fiat amounts, one `BigNumber` + rate lookup per token and per internal transfer                                | [`phishing.ts:89`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/phishing/phishing.ts#L89) → [`utils.ts:72`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/phishing/utils.ts#L72)                                                                                                                                              |
| `formatAmounts` — a second deep copy: `details.vin`, `details.vout`, `targets`, `tokens`, `internalTransfers` all re-mapped, each amount through `formatNetworkAmount` | [`:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L81)                                                                                                                                                                                                                                                                                      |
| **two** `new Intl.DateTimeFormat(...)` constructions — a fresh formatter per transaction, not per export                                                               | [`:165`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L165), [`:168`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L168)                                                                                                                                                     |
| per emitted row with a fiat amount: `getFiatRateKey` + `new BigNumber(...).multipliedBy(...)` + `localizeNumber` (which itself may construct an `Intl.NumberFormat`)   | [`:176`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L176), [`:189`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L189), [`localizeNumberUtils.ts:39-44`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/localizeNumberUtils.ts#L39-L44) |

On top of that shared pass, CSV builds 13 fields per row through `sanitizeCsvValue` and two `join`s
([`:369-377`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L369-L377)),
PDF builds 6 template strings per row
([`:403-434`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L403-L434))
and then hands every row to pdfmake's table layout at
[`:141-142`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L141-L142).
JSON takes a different path entirely — it never calls `prepareContent`, only `formatAmounts` per
transaction and one `JSON.stringify`
([`:505-512`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L505-L512)).

`formatData` is already `async`
([`:478`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.ts#L478))
and its only caller already awaits it, so nothing above `prepareContent` needs restructuring — the whole
chain is synchronous purely because nothing in it ever yields.

## Before

`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:144-163` — the head of the chain; the
`flatMap` body continues to `:316` and the closing `.filter(isNotNull)` is at `:318`:

```ts
const prepareContent = (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
): Fields[] => {
    const { transactions, symbol, baseCurrencyCode } = data;

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
```

`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:353-380`:

```ts
    const content = prepareContent(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

    const lines: string[] = [];

    const fieldKeys = Object.keys(csvFields);
    const fieldValues = Object.values(csvFields);

    // Prepare header
    let line: string[] = [];
    fieldValues.forEach(v => {
        line.push(v);
    });

    lines.push(line.join(CSV_SEPARATOR));

    // Prepare data
    content.forEach(item => {
        line = [];

        fieldKeys.forEach(field => {
            line.push(sanitizeCsvValue(item[field] ?? ''));
        });

        lines.push(line.join(CSV_SEPARATOR));
    });

    return lines.join(CSV_NEWLINE);
};
```

`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:400-404` — the same shape in `preparePdf`;
the `forEach` body runs to `:434`:

```ts
    const content = prepareContent(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

    const lines: any[] = [];
    content.forEach(item => {
        const line: string[] = [];
```

`packages/suite/src/utils/wallet/exportTransactionsUtils.ts:486-503`:

```ts
    switch (type) {
        case 'csv': {
            const csv = prepareCsv(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

            return new Blob([csv], { type: 'text/csv;charset=utf-8' });
        }
        case 'pdf': {
            const pdfLayout = preparePdf(
                data,
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicFiatRates,
            );
            const pdfMake = await loadPdfMake();
            const pdf = await makePdf(pdfLayout, pdfMake);

            return pdf;
        }
```

## After

`yieldToMain()` is the shared helper introduced by whichever of these scheduling issues lands first —
proposed home `packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`: `scheduler.yield()`
when present, `setTimeout(resolve, 0)` otherwise. This file already imports from `@trezor/utils` at
`:29`, so the import is one added specifier:

```ts
import { BigNumber, isNotNull, yieldToMain } from '@trezor/utils';
```

`:60-62`, alongside the other CSV constants:

```ts
const EXPORT_BATCH_SIZE = 500;
```

`:76`, after `timeFormat` — the two formatters are export-invariant, so they are built once instead of
once per transaction:

```ts
const dateFormatter = new Intl.DateTimeFormat('default', dateFormat);
const timeFormatter = new Intl.DateTimeFormat('default', timeFormat);
```

`:144` — the existing function is renamed and keeps its body **byte for byte**, apart from the two
formatter call sites at `:165`/`:168`. Passing a batch through a shallow copy of `data` rather than a new
parameter is what keeps the 175-line body from re-indenting:

```ts
const prepareTransactionRows = (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
): Fields[] => {
    const { transactions, symbol, baseCurrencyCode } = data;

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
                date: dateFormatter.format((t.blockTime || 0) * 1000),
                time: timeFormatter.format((t.blockTime || 0) * 1000),
                timestamp: t.blockTime?.toString() || '',
                type: t.type.toUpperCase(),
                txid: t.txid,
            };

            // Editorial marker, not proposed code: :175-316 are unchanged.
        })
        .filter(isNotNull);
};

const prepareContent = async (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
): Promise<Fields[]> => {
    const { transactions } = data;
    const content: Fields[] = [];

    for (let i = 0; i < transactions.length; i += EXPORT_BATCH_SIZE) {
        const batch = transactions.slice(i, i + EXPORT_BATCH_SIZE);

        content.push(
            ...prepareTransactionRows(
                { ...data, transactions: batch },
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicFiatRates,
            ),
        );

        await yieldToMain();
    }

    return content;
};
```

`:331` — `prepareCsv` becomes `async` and its row loop gets the same treatment:

```ts
const prepareCsv = async (
    data: Data,
    tokenDefinitions: TokenDefinitions,
    txsMarkedAsNotScam: string[],
    historicFiatRates?: RatesByTimestamps,
) => {
```

```ts
const content = await prepareContent(data, tokenDefinitions, txsMarkedAsNotScam, historicFiatRates);

const lines: string[] = [];

const fieldKeys = Object.keys(csvFields);
const fieldValues = Object.values(csvFields);

// Prepare header
let line: string[] = [];
fieldValues.forEach(v => {
    line.push(v);
});

lines.push(line.join(CSV_SEPARATOR));

// Prepare data
for (let i = 0; i < content.length; i += EXPORT_BATCH_SIZE) {
    content.slice(i, i + EXPORT_BATCH_SIZE).forEach(item => {
        line = [];

        fieldKeys.forEach(field => {
            line.push(sanitizeCsvValue(item[field] ?? ''));
        });

        lines.push(line.join(CSV_SEPARATOR));
    });

    await yieldToMain();
}

return lines.join(CSV_NEWLINE);
```

`:382` — `preparePdf` mirrors it exactly: `async`, `Promise<TDocumentDefinitions>`, `await prepareContent`
at `:400`, and the `content.forEach` at `:403` wrapped in the same `for` / `await yieldToMain()` loop
appending into `lines`. The returned document definition at `:436-475` is untouched.

`:478` — `formatData` is already `async`, so both cases only gain an `await`:

```ts
    switch (type) {
        case 'csv': {
            const csv = await prepareCsv(
                data,
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicFiatRates,
            );

            return new Blob([csv], { type: 'text/csv;charset=utf-8' });
        }
        case 'pdf': {
            const pdfLayout = await preparePdf(
                data,
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicFiatRates,
            );
            const pdfMake = await loadPdfMake();
            const pdf = await makePdf(pdfLayout, pdfMake);

            return pdf;
        }
```

`exportTransactionsActions.ts:100` and `ExportAction.tsx:67` need no change at all.

## Why it matters

The user is on the transactions tab of an account they own and has just clicked Export. Because
`fetchAllTransactionsForAccountThunk` is network-bound, React does get to paint the dropdown's loading
state ([`ExportAction.tsx:129`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L129))
before the formatting starts — and then that spinner is the thing that stops moving. Nothing else in the
renderer runs either: the transaction list will not scroll, the sidebar will not switch account, and a
device event arriving mid-export (`confirm on device`, a disconnect) queues behind it.

`n` is the account's entire transaction history, and it is unbounded by anything in this path — the
export explicitly waits for every page to be fetched before it starts, so an old BTC account or a
coinjoin account brings its full lifetime of transactions into one task, multiplied by the per-transaction
row fan-out described above. The 50 ms long-task threshold is the spec's number; nothing here has been
measured.

After the fix, the export takes the same amount of CPU — marginally more, in fact — but it is spread over
`⌈rows / 500⌉` tasks with the main thread free between them. The spinner animates, the list scrolls,
device events land. The user sees the same file appear at the end. This is the honest claim: **yielding
does not make the export faster, it stops the export from taking the app hostage while it runs.**

## Notes

- **The claim is responsiveness, not speed.** Total wall-clock time goes slightly _up_: yields cost a
  task boundary each, and on Safari the `setTimeout(0)` fallback appends to the back of the queue and gets
  clamped to a 5 ms floor after five nested timeouts, so a large export could add a visible fraction of a
  second overall. That is the trade being proposed, and a reviewer who thinks "the user asked for a file
  and expects to wait" is entitled to reject it on those grounds.
- **PDF is the worst format and the one this helps least.** Chunking `preparePdf`'s row loop does nothing
  about `pdfMake.createPdf(definitions).getBlob()` at `:141-142`. In the installed pdfmake
  (`node_modules/pdfmake/src/Printer.js:31`), everything after `await this.resolveUrls(docDefinition)` —
  the `LayoutBuilder.layoutDocument(...)` call at `:82` that measures and lays out every table row, and
  the render pass after it — is one synchronous block with no yield point. So after this change the PDF
  export will still freeze, just later and for less of the total. The remaining lever there is running
  pdfmake in a worker, which is a separate and much larger issue; do not let this one be closed as "PDF
  export fixed".
- **JSON is deliberately untouched.** It does not go through `prepareContent`. Chunking the
  `transactions.map(formatAmounts(symbol))` at `:508` would be trivial, but the `JSON.stringify` at `:505`
  — over the whole history, with 2-space indentation — is the dominant term and is not chunkable without a
  streaming serializer. Adding a yield to the map alone would be cosmetic, so it is left out.
- **New re-entrancy hazard, and it is the part to scrutinise.** `isExportRunning`
  ([`ExportAction.tsx:26`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/ExportAction.tsx#L26),
  guard at `:46`) is component-local state, and `ExportAction` unmounts when the user leaves the
  transactions tab ([`TransactionListActions.tsx:109`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/TransactionListActions.tsx#L109)).
  Today the format is one task, so there is no window in which to switch accounts; after this change there
  is. The user can leave mid-export, land on another account with a fresh `isExportRunning === false`, and
  start a second export — both run interleaved and both call `saveAs`
  ([`exportTransactionsActions.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/exportTransactionsActions.ts#L116)),
  producing two downloads. The output of each stays correct (each has its own arrays), but the guard is
  now in the wrong place. The fix is to make `exportTransactionsThunk` a `createSingleInstanceThunk`, the
  same primitive `fetchAllTransactionsForAccountThunk` already uses
  ([`transactionsThunks.ts:714`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L714)).
  It is called out rather than folded in because it changes thunk semantics and deserves its own review.
- **No cancellation is added.** If the user navigates away mid-export, the export still completes and
  still saves the file. That is the behaviour today too — the synchronous version simply finished before
  anyone could navigate. A `signal.aborted` check at each batch boundary is the obvious follow-up and
  pairs naturally with the single-instance thunk above.
- **The snapshot stays consistent across yields.** `historicFiatRates`, `tokenDefinitions` and
  `txsMarkedAsNotScam` are read once at
  [`exportTransactionsActions.ts:56-63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/wallet/exportTransactionsActions.ts#L56-L63)
  and captured by reference; Redux state is immutable, so a rate update landing mid-export replaces the
  store's object without touching the one the loop holds. The transaction array is freshly built at
  `:79-87` and sorted in place at `:97`, so nothing outside the thunk can mutate it either. Row order is
  preserved exactly, because batches are appended in index order.
- **Why 500, and where that number is weakest.** Per-transaction work here is heavy — two deep copies,
  BigNumber arithmetic, `Intl` formatting — so the 25 of the skill's discovery example would over-yield,
  while a few thousand would put a batch back over a frame. The real weakness is that batching by
  _transaction_ count is the wrong knob: one transaction with hundreds of targets emits hundreds of rows
  and counts as one unit, so batch cost is uneven for exactly the accounts this issue is about. Counting
  emitted rows since the last yield would be more even, at the cost of a less obvious loop. A reviewer who
  prefers that shape is right; the simpler one is proposed to keep the diff mechanical.
- **The two `Intl.DateTimeFormat` hoists are a separate, cheap win** riding along in the same change.
  They are safe here because `'default'` resolves the runtime locale, which does not change during a
  session, and neither formatter depends on `data`. Note that `localizeNumber` also constructs an
  `Intl.NumberFormat` per call on one branch
  ([`localizeNumberUtils.ts:42`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/localizeNumberUtils.ts#L42));
  that one is not touched, because it is shared with the rest of Suite.
- **Deliberately not changed:** the double deep copy per transaction — `isPhishingTransaction` rebuilds
  the transaction with fiat amounts, then `formatAmounts` copies `vin`/`vout`/`targets`/`tokens`/
  `internalTransfers` again. That is an allocation-and-complexity defect belonging to the
  [`../asymptotic-complexity`](../asymptotic-complexity) sweep, not this one. Yielding spreads that cost
  out; it does not remove it. Same for the final `lines.join(CSV_NEWLINE)` at `:379`, which is one task
  over the whole output — it is a string concatenation rather than per-row formatting, so it is a much
  smaller term, but it is not zero and this change does not address it.
- **A progress indicator becomes possible, and is explicitly a follow-up.** Once the loop yields, the
  batch index is a real progress fraction and could drive a determinate indicator instead of the
  indeterminate spinner at `ExportAction.tsx:129`. It is not folded in here: it needs a thunk-to-UI
  progress channel and a design decision about where the number is shown.
- **Tests.** `packages/suite/src/utils/wallet/exportTransactionsUtils.test.ts` covers only
  `sanitizeCsvValue` ([`:3`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/utils/wallet/exportTransactionsUtils.test.ts#L3)),
  so no unit test breaks — and none covers the row ordering this change has to preserve. The e2e test
  `suite/e2e/tests/wallet/export-transactions.test.ts` only waits for the download event and asserts the
  file is non-empty
  ([`:41-50`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/wallet/export-transactions.test.ts#L41-L50)),
  so it passes either way. The cheapest guard worth adding with this change is a unit test that runs
  `formatData` over a fixture longer than `EXPORT_BATCH_SIZE` and asserts the CSV is byte-identical to the
  pre-change output.
- **API surface.** `prepareContent`, `prepareCsv` and `preparePdf` are module-private; only
  `sanitizeCsvValue` (`:321`), `formatData` (`:478`) and `getExportedFileName` (`:520`) are exported, and
  none of their signatures change. The only published-package impact is adding `yieldToMain` to
  `@trezor/utils`; `packages/suite` already depends on it
  ([`package.json:169`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/package.json#L169)).
- **Platform.** `packages/suite` only — the web app and the `suite-desktop-ui` Electron renderer, where
  the identical code runs and `scheduler.yield` is always available. suite-native has no transaction
  export and does not import this file, so React Native and the `InteractionManager` question do not arise
  here.
- **The `After` hunks have not been compiled.** They are written against the surrounding types by
  reading, not by running `tsc`. The one place to check is `preparePdf`'s return type, which becomes
  `Promise<TDocumentDefinitions>` and is consumed by `makePdf(pdfLayout, pdfMake)` at `:500`.
- **`skills/performance-scheduling/SKILL.md` needs a correction unrelated to this document**: it names
  `InteractionManager.runAfterInteractions` as React Native's nearest equivalent to
  `requestIdleCallback`, but on the pinned `react-native@0.85.3` the installed
  `Libraries/Interaction/InteractionManager.js` exports `InteractionManagerStub`, every member
  `@deprecated`, with `runAfterInteractions` reduced to a bare `setImmediate`. Noted here for the sweep's
  record; it does not affect this web-only issue.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
