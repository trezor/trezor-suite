import {
    fetchTransactionsPageThunk,
    prepareTransactionsReducer,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

import { accounts, transactions } from '../__fixtures__/transactionConstants';

const reducer = prepareTransactionsReducer(extraDependencies);

describe('transaction reducer', () => {
    let testAccounts = [...accounts];
    let testTransactions = { ...transactions };

    beforeEach(() => {
        testAccounts = [...accounts];
        testTransactions = { ...transactions };
    });

    it('test initial state', () => {
        expect(
            reducer(
                { ...transactionsInitialState, transactions },
                {
                    type: 'none',
                },
            ),
        ).toEqual({ ...transactionsInitialState, transactions });
    });

    it('reset transactions', () => {
        const account = testAccounts[0];
        if (!account) return;
        const { key } = account;
        delete testTransactions[key];

        expect(
            reducer(
                { ...transactionsInitialState, transactions: testTransactions },
                {
                    type: transactionsActions.resetTransaction.type,
                    payload: {
                        account,
                    },
                },
            ),
        ).toEqual({ ...transactionsInitialState, transactions: testTransactions });
    });

    it('remove transactions', () => {
        const account = testAccounts[0];
        if (!account) return;
        const { key } = account;

        const otherAccountKey = testAccounts[1]?.key ?? '';
        const otherAccountTransactions = testTransactions[otherAccountKey];

        expect(
            reducer(
                { ...transactionsInitialState, transactions: testTransactions },
                {
                    type: transactionsActions.removeTransaction.type,
                    payload: {
                        account,
                        txs: testTransactions[key],
                    },
                },
            ),
        ).toEqual({
            ...transactionsInitialState,
            transactions: { [otherAccountKey]: otherAccountTransactions, [key]: [] },
        });
    });

    it('remove transactions (incl. nonexistent)', () => {
        const account = testAccounts[0];
        if (!account) return;
        const txs = testTransactions[account.key] ?? [];
        const tx1 = txs[0];
        const tx2 = txs[1];
        const txsToRemove = [
            tx2,
            { ...tx1, txid: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' },
        ];

        expect(
            reducer(
                { ...transactionsInitialState, transactions: testTransactions },
                {
                    type: transactionsActions.removeTransaction.type,
                    payload: { account, txs: txsToRemove },
                },
            ).transactions[account.key] ?? [],
        ).toEqual([tx1]);
    });

    it('add transactions', () => {
        const account = testAccounts[0];
        if (!account) return;
        const { key } = account;
        expect(
            reducer(
                { ...transactionsInitialState, transactions },
                {
                    type: transactionsActions.addTransaction.type,
                    payload: {
                        account,
                        transactions: testTransactions[key],
                    },
                },
            ),
        ).toEqual({ ...transactionsInitialState, transactions: testTransactions });
    });

    it('fetch init', () => {
        expect(
            reducer(
                { ...transactionsInitialState },
                {
                    type: fetchTransactionsPageThunk.pending.type,
                    meta: { arg: { accountKey: 'someAccountKey', page: 1 } },
                },
            ),
        ).toEqual({
            ...transactionsInitialState,
            fetchStatusDetail: {
                someAccountKey: {
                    status: 'loading',
                    error: null,
                },
            },
        });
    });

    it('fetch success', () => {
        expect(
            reducer(undefined, {
                type: fetchTransactionsPageThunk.fulfilled.type,
                meta: { arg: { accountKey: 'someAccountKey', page: 1 } },
            }),
        ).toEqual({
            ...transactionsInitialState,
            fetchStatusDetail: {
                someAccountKey: {
                    status: 'idle',
                    error: null,
                },
            },
        });
    });

    it('fetch error', () => {
        expect(
            reducer(undefined, {
                type: fetchTransactionsPageThunk.rejected.type,
                meta: { arg: { accountKey: 'someAccountKey', page: 1 } },
                error: 'Some error',
            }),
        ).toEqual({
            ...transactionsInitialState,
            fetchStatusDetail: {
                someAccountKey: {
                    status: 'error',
                    error: 'Some error',
                },
            },
        });
    });
});
