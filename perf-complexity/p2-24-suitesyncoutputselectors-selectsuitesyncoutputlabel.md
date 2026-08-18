# `selectSuiteSyncOutputLabel` flattens and scans every output label per rendered row — read the dictionary that already exists

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`suite-common/suite-sync/src/data/output/suiteSyncOutputSelectors.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/suite-sync/src/data/output/suiteSyncOutputSelectors.ts#L56) (also 53,54,17) — `selectSuiteSyncOutputLabel`

`outputs` = every SuiteSync output label stored for the whole wallet, across all accounts

## Before

```ts
    ],
    (outputs, txId, txOutputId) => {
        const id = createSuiteSyncOutputId(txId, txOutputId);

        return outputs.find(output => output.id === id)?.label ?? null;
    },
);

export const selectSuiteSyncOutputLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
```

## After

Select the dictionary instead of the flattened array and read the key directly. Add a `selectOutputsRecordForWallet` (returning `selectWalletById(state, walletDescriptor)?.outputs`) and make the combiner `(outputsById, txId, txOutputId) => outputsById?.[createSuiteSyncOutputId(txId, txOutputId)]?.label ?? null`.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(rendered rows x output labels), where an O(1) dictionary read already exists`** — hot path.

suiteSyncDataReducer.ts:15 stores the labels as `outputs: Record<SuiteSyncOutput['id'], SuiteSyncOutput>` — keyed by exactly the id this selector searches for. selectAllOutputsForWallet (suiteSyncWalletSelectors.ts:53) flattens that dictionary to an array with typedObjectValues, and the selector then linearly scans it for a key the dictionary already indexes. It is called once per row: suite-native/transactions/src/components/TransactionOutputLabel.tsx:23 per transaction output row and suite-native/module-send/src/components/CoinControl/UtxoCoinControlLabel.tsx:40 per UTXO row. n grows with every label the user creates and is loaded in bulk by the BIP-329 import path (suite-common/bip329/src/suiteSync/createBip329ToSuiteSync.ts), which can insert a whole label backup at once. The weakMapMemoize cache is keyed on the `outputs` array identity, so the full rows x labels cost is repaid on first list paint and again after every label edit or sync push.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Confirmed row-level callers: suite-native/transactions/src/components/TransactionOutputLabel.tsx:23, TransactionOutputLabelEditable.tsx:42, and suite-native/module-send/src/components/CoinControl/UtxoCoinControlLabel.tsx:40 (the UTXO coin-control list is the longest of the three). Also reached non-visually via createSuiteSyncWriteLabels.ts:37 as getOutputLabel. Memoization detail the writer should keep accurate: createWeakMapSelector (weakMapMemoize) caches per distinct argument tuple, so the rows x labels cost is paid on first list paint and again after every label edit / sync push that replaces the `outputs` object identity — it is not repaid on every re-render. Fix: add a `selectOutputsRecordForWallet` returning `selectWalletById(state, walletDescriptor)?.outputs ?? null` (selectWalletById already exists at suiteSyncWalletSelectors.ts:14 and returns `WalletData | null`) and make the combiner `(outputsById, txId, txOutputId) => outputsById?.[createSuiteSyncOutputId(txId, txOutputId)]?.label ?? null`. Semantics are identical because the Record key IS the id. TypeScript note: with noUncheckedIndexedAccess the indexed read is already `| undefined`, so `?.label ?? null` type-checks without a cast. Do NOT change selectAllOutputsForWallet itself — selectSuiteSyncOutputLabelsByAccount (:14-36) and selectSuiteSyncOutputLabels (:60) still legitimately need the array form, and returnStableArrayIfEmpty there guards referential stability for React.

- Spans more than one file — see also `suite-native/transactions/src/components/TransactionOutputLabel.tsx:23`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
