import { btcAccountBalanceHistoryResult, btcAccountInfoResult } from './__fixtures__/btc';
import { xrpAccountInfoResult, xrpBalanceHistoryResult } from './__fixtures__/xrp';
import { getAccountBalanceHistoryFromTransactions } from '../balanceHistoryUtils';

describe('TransactionCacheEngine', () => {
    it('should getAccoutBalanceHistory for bitcoin', async () => {
        const balanceHistory = await getAccountBalanceHistoryFromTransactions({
            transactions: btcAccountInfoResult.history.transactions!,
            coin: 'btc',
        });

        expect(balanceHistory).toMatchObject(btcAccountBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ripple', async () => {
        const balanceHistory = await getAccountBalanceHistoryFromTransactions({
            transactions: xrpAccountInfoResult.history.transactions!,
            coin: 'xrp',
        });

        expect(balanceHistory).toMatchObject(xrpBalanceHistoryResult);
    });
});
