import { btcAccountBalanceHistoryResult, btcAccountTransactions } from './__fixtures__/btc';
import { xrpAccountTransactions, xrpBalanceHistoryResult } from './__fixtures__/xrp';
import {
    ethAccountBalanceHistoryResult,
    ethTokenBalanceHistoryResult,
    ethAccountTransactions,
} from './__fixtures__/eth';
import { getAccountHistoryMovementFromTransactions } from '../balanceHistoryUtils';

describe('Account balance movement history', () => {
    it('should getAccoutBalanceHistory for bitcoin', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: btcAccountTransactions,
            coin: 'btc',
        });

        expect(balanceHistory.main).toMatchObject(btcAccountBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ripple', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: xrpAccountTransactions,
            coin: 'xrp',
        });

        expect(balanceHistory.main).toMatchObject(xrpBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ethereum', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
        });

        expect(balanceHistory.main).toMatchObject(ethAccountBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ethereum with token', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
        });

        expect(balanceHistory.tokens).toMatchObject(ethTokenBalanceHistoryResult);
    });
});
