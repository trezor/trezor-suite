# Cardano `transformUtxos` scans the accumulated result per UTXO — group by outpoint in a `Map`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/connect/src/api/cardano/cardanoUtils.ts:10`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/cardano/cardanoUtils.ts#L10) — `transformUtxos`

AccountUtxo[] rows for one Cardano account. Blockfrost emits ONE row per (utxo, asset unit) pair (packages/blockchain-link-utils/src/blockfrost.ts:21-40 flattens utxoData.amount), so n = sum over UTXOs of native assets held, not the UTXO count.

## Before

```ts
export const transformUtxos = (utxos: AccountUtxo[]): types.Utxo[] => {
    const result: types.Utxo[] = [];
    utxos?.forEach(utxo => {
        const foundItem = result.find(
            res => res.txHash === utxo.txid && res.outputIndex === utxo.vout,
        );

        if (utxo.cardanoSpecific) {
            if (!foundItem) {
                // path: utxo.path,
```

## After

Key the grouping by outpoint in a Map instead of scanning `result`:

const byOutpoint = new Map<string, types.Utxo>();
utxos?.forEach(utxo => {
if (!utxo.cardanoSpecific) return;
const key = `${utxo.txid}:${utxo.vout}`;
const entry = { quantity: utxo.amount, unit: utxo.cardanoSpecific.unit };
const existing = byOutpoint.get(key);
if (existing) existing.amount.push(entry);
else byOutpoint.set(key, { address: utxo.address, txHash: utxo.txid, outputIndex: utxo.vout, amount: [entry] });
});
return Array.from(byOutpoint.values());

Map preserves insertion order, so the output array is identical to today's.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(utxoRows^2) per call, times feeLevels per compose`** — warm path.

Entry point: suite-common/wallet-core/src/send/sendFormCardanoThunks.ts:66 calls TrezorConnect.cardanoComposeTransaction({ feeLevels: predefinedLevels, account: { utxo: account.utxo } }) with the account's FULL utxo set on every debounced send-form compose. cardanoComposeTransaction.ts:50 maps over feeLevels and calls getCoinSelectionParams -> transformUtxos once per level, so the quadratic scan is re-run per fee level, per compose. A Cardano account holding a few hundred NFTs/native tokens produces thousands of rows; the group-by is done by linear .find over the already-built result array.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Severity P2 is right: off-render but on the debounced send-form compose path. The fee-level multiplier is smaller than the sweeper implies — Cardano feeInfo.levels is typically a single 'normal' level (plus 'custom' when selected), so treat it as ~1-2x, not a big factor; the quadratic itself is the finding. Two other entry points also hit it: packages/suite/src/hooks/earn/useCardanoStaking.ts:104 and packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:171. Proposed Map-by-`${txid}:${vout}` fix is order-preserving (Map keeps insertion order) and behaviour-identical: today the `.find` runs even for rows without `cardanoSpecific`, but its result is discarded in that branch, so hoisting the `if (!utxo.cardanoSpecific) return;` above the lookup changes nothing observable. Keep the `utxos?.` optional chaining as-is (param is typed non-optional but callers pass through unvalidated SDK payloads). Coverage exists: packages/connect/src/api/cardano/cardanoUtils.test.ts + **fixtures**/cardanoUtils.ts assert with toMatchObject, so the fixtures should keep passing unchanged.

- Spans more than one file — see also `packages/connect/src/api/cardano/api/cardanoComposeTransaction.ts:53`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
