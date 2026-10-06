import { configureStore } from '@reduxjs/toolkit';

import { getTxsPerPage } from '@suite-common/suite-utils';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type TransactionsState,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getAccountTransactions } from '@suite-common/wallet-utils';

import { transactionsReducer } from 'src/reducers/wallet';

const btcSymbol = asNetworkSymbol('btc');

const { getWalletTransaction } = testMocks;

const initStore = (transactionsState?: TransactionsState) =>
    configureStore({
        reducer: {
            transactions: transactionsReducer,
        },
        preloadedState: {
            transactions: transactionsState ?? transactionsInitialState,
        },
    });

// TODO: more tests (updating existing/pending txs, fetching the data from blockbook,...)
describe('Transaction Actions', () => {
    it('Add transaction for first page (used on account create)', () => {
        const store = initStore();
        const account = mockWalletAccount({ symbol: btcSymbol });
        store.dispatch(
            transactionsActions.addTransaction({
                transactions: [getWalletTransaction()],
                account,
                page: 1,
                perPage: getTxsPerPage(account.networkType),
            }),
        );
        expect(
            getAccountTransactions(account.key, store.getState().transactions.transactions).length,
        ).toEqual(1);
    });

    it('Remove txs for a given account', () => {
        const account1 = mockWalletAccount({
            symbol: btcSymbol,
            descriptor: asAccountDescriptor('xpub1'),
        });
        const account2 = mockWalletAccount({
            symbol: btcSymbol,
            descriptor: asAccountDescriptor('xpub2'),
        });
        const store = initStore({
            transactions: {
                [account1.key]: [getWalletTransaction()],
                [account2.key]: [getWalletTransaction()],
            },
            phishing: {},
            fetchStatusDetail: {},
        });

        store.dispatch(transactionsActions.resetTransaction({ account: account1 }));
        // removed txs for acc1
        expect(
            getAccountTransactions(account1.key, store.getState().transactions.transactions),
        ).toEqual([]);
        // txs for acc2 are still there
        expect(
            getAccountTransactions(account2.key, store.getState().transactions.transactions).length,
        ).toEqual(1);
    });
});
