import { chainedTxsFixture } from './chainedTransactions.fixture';
import { calculateNewFee } from '../../../src/send/composeCancelTransaction/calculateNewFee';

describe(calculateNewFee.name, () => {
    it('accounts default RELAY_FEE for the new transaction size (110B) which is less then original TX (141B) ', () => {
        const result = calculateNewFee({
            chainedTxs: chainedTxsFixture,
            newTransactionSize: 110,
            originalFee: '1410',
        });

        expect(result.chainedTransactionFees).toBe(1410); // This is just sum of fees in `chainedTxsFixture`

        // (originalFee + newTransactionSize * RELAY_FEE) / newTransactionSize = (1410 + 110 * 1) / 110 = 13.81818181818181818182
        expect(result.newFeeRate.toString()).toBe('13.81818181818181818182');
    });

    it('accounts RELAY_FEE for the new transaction size (110B) which is less then original TX (141B) ', () => {
        const result = calculateNewFee({
            chainedTxs: chainedTxsFixture,
            newTransactionSize: 110,
            originalFee: '1410',
            relayFee: 2,
        });

        expect(result.chainedTransactionFees).toBe(1410); // This is just sum of fees in `chainedTxsFixture`

        // (originalFee + newTransactionSize * RELAY_FEE) / newTransactionSize = (1410 + 110 * 2) / 110 = 14.81818181818181818182
        expect(result.newFeeRate.toString()).toBe('14.81818181818181818182');
    });
});
