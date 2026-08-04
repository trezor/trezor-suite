import type { ElectrumUtxo } from '@trezor/blockchain-link-types';

import { sanitizeUtxos } from './getAccountUtxo';

const validUtxo = (over: Partial<ElectrumUtxo> = {}): ElectrumUtxo => ({
    tx_hash: 'a'.repeat(64),
    height: 100,
    tx_pos: 0,
    value: 12345,
    ...over,
});

describe('electrum getAccountUtxo sanitizeUtxos', () => {
    it('passes through a valid array of utxos', () => {
        const input = [validUtxo(), validUtxo({ tx_pos: 1, value: 1 })];
        expect(sanitizeUtxos(input)).toEqual(input);
    });

    it('coerces a non-array response to an empty array (no throw)', () => {
        // A malicious/MITM Electrum server may return a non-array for `listunspent`;
        // a bare `.map` would throw and abort the whole getAccountUtxo request.
        expect(() => sanitizeUtxos({} as unknown)).not.toThrow();
        expect(sanitizeUtxos({} as unknown)).toEqual([]);
        expect(sanitizeUtxos(null)).toEqual([]);
        expect(sanitizeUtxos(42 as unknown)).toEqual([]);
    });

    it('drops poison records but keeps the valid ones (preserves spendable UTXOs)', () => {
        const good = validUtxo();
        const input = [
            good,
            null, // destructuring `{ height, tx_hash, ... }` of null throws in transformUtxo
            { tx_hash: 'b'.repeat(64), height: 1, tx_pos: 0 }, // missing `value` → value.toString() throws
            42,
        ];

        const result = sanitizeUtxos(input as unknown);

        expect(result).toEqual([good]);
        // the surviving records must be safe to map through transformUtxo's `value.toString()`
        expect(() => result.map(u => u.value.toString())).not.toThrow();
    });
});
