import { TokenAddress } from '@suite-common/wallet-types';

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

    it('should getAccoutBalanceHistory for bitcoin with timestamp filters', async () => {
        const from = 1666021435;
        const to = 1711445680;
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: btcAccountTransactions,
            coin: 'btc',
            from,
            to,
        });

        const filteredBalanceHistory = btcAccountBalanceHistoryResult.filter(
            item => item.time >= from && item.time <= to,
        );

        expect(balanceHistory.main).toMatchObject(filteredBalanceHistory);
    });

    it('should getAccoutBalanceHistory for ripple', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: xrpAccountTransactions,
            coin: 'xrp',
        });

        expect(balanceHistory.main).toMatchObject(xrpBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ripple with timestamp filters', async () => {
        const from = 1672923931;
        const to = 1690884611;
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: xrpAccountTransactions,
            coin: 'xrp',
            from,
            to,
        });

        const filteredBalanceHistory = xrpBalanceHistoryResult.filter(
            item => item.time >= from && item.time <= to,
        );

        expect(balanceHistory.main).toMatchObject(filteredBalanceHistory);
    });

    it('should getAccoutBalanceHistory for ethereum', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
        });

        expect(balanceHistory.main).toMatchObject(ethAccountBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ethereum with timestamp filters', async () => {
        const from = 1665760907;
        const to = 1716201815;
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
            from,
            to,
        });

        const filteredBalanceHistory = ethAccountBalanceHistoryResult.filter(
            item => item.time >= from && item.time <= to,
        );

        expect(balanceHistory.main).toMatchObject(filteredBalanceHistory);
    });

    it('should getAccoutBalanceHistory for ethereum with token', async () => {
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
        });

        expect(balanceHistory.tokens).toMatchObject(ethTokenBalanceHistoryResult);
    });

    it('should getAccoutBalanceHistory for ethereum with token and timestamp filters', async () => {
        const from = 1665760907;
        const to = 1716201815;
        const balanceHistory = await getAccountHistoryMovementFromTransactions({
            transactions: ethAccountTransactions,
            coin: 'eth',
            from,
            to,
        });

        for (const token of Object.keys(balanceHistory.tokens)) {
            const filteredBalanceHistory = ethTokenBalanceHistoryResult[token].filter(
                item => item.time >= from && item.time <= to,
            );

            expect(balanceHistory.tokens[token as TokenAddress]).toMatchObject(
                filteredBalanceHistory,
            );
        }
    });
});
