import { chainedTxsFixture } from './__fixtures__/chainedTransactions.fixture';
import { calculateBaseFee } from './calculateNewFee';

describe(calculateBaseFee.name, () => {
    it('transaction with 1410 fee and no chained txs', () => {
        expect(calculateBaseFee({ fee: '1410' })).toBe(1410);
    });

    it('transaction with 1520 fee and chained tx with 1410 fee', () => {
        expect(calculateBaseFee({ fee: '1520' }, chainedTxsFixture)).toBe(2930);
    });
});
