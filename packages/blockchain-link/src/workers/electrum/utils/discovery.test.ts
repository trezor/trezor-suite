import type { ElectrumHistoryTx } from '@trezor/blockchain-link-types';

import { sanitizeHistory } from './discovery';

const validTx = (over: Partial<ElectrumHistoryTx> = {}): ElectrumHistoryTx => ({
    tx_hash: 'a'.repeat(64),
    height: 100,
    ...over,
});

describe('electrum sanitizeHistory', () => {
    it('passes through a valid array of history records', () => {
        const input = [validTx(), validTx({ tx_hash: 'b'.repeat(64), height: 0 })];
        expect(sanitizeHistory(input)).toEqual(input);
    });

    it('coerces a non-array response to an empty array (no throw)', () => {
        // A malicious/MITM Electrum server may return a non-array for `get_history`;
        // a bare `.map`/`.filter`/`.length` deref would throw and abort the whole request.
        expect(() => sanitizeHistory({} as unknown)).not.toThrow();
        expect(sanitizeHistory({} as unknown)).toEqual([]);
        expect(sanitizeHistory(null)).toEqual([]);
        expect(sanitizeHistory(42 as unknown)).toEqual([]);
    });

    it('drops poison records but keeps the valid ones', () => {
        const good = validTx();
        const input = [
            good,
            null, // destructuring `{ tx_hash }` of null throws in getTransactions
            { height: 1 }, // missing tx_hash
            42,
        ];

        const result = sanitizeHistory(input as unknown);

        expect(result).toEqual([good]);
        // the surviving records must be safe to map through getTransactions' `{ tx_hash }` destructure
        expect(() => result.map(({ tx_hash }) => tx_hash)).not.toThrow();
    });
});
