import { type AccountHistoryWithBalance } from 'src/types/wallet/graph';
import { mergeAccountBalanceHistory } from 'src/utils/wallet/graph';

const point = (time: number, balance: string): AccountHistoryWithBalance => ({
    time,
    txs: 1,
    received: '1',
    sent: '0',
    rates: {},
    balance,
});

describe('mergeAccountBalanceHistory', () => {
    it('returns fresh data when cache is empty', () => {
        const fresh = [point(2, '2'), point(1, '1')];

        expect(mergeAccountBalanceHistory([], fresh)).toEqual([point(1, '1'), point(2, '2')]);
    });

    it('returns cached data when fresh is empty', () => {
        const cached = [point(1, '1'), point(2, '2')];

        expect(mergeAccountBalanceHistory(cached, [])).toEqual(cached);
    });

    it('replaces the overlapping day with the fresh value and appends new days sorted', () => {
        const cached = [point(1, '1'), point(2, '2')];
        const fresh = [point(2, '5'), point(3, '6')];

        expect(mergeAccountBalanceHistory(cached, fresh)).toEqual([
            point(1, '1'),
            point(2, '5'),
            point(3, '6'),
        ]);
    });
});
