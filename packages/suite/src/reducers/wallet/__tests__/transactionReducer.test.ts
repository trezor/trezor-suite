import { extraDependencies } from 'src/support/extraDependencies';
import {
    transactionsInitialState,
    transactionsActions,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { transactions, accounts } from '../__fixtures__/transactionConstants';

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
        const { key } = testAccounts[0];

        const account = testAccounts[0];
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
        const { key } = account;

        const otherAccountKey = testAccounts[1].key;
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
        const [tx1, tx2] = testTransactions[account.key];
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
            ).transactions[account.key],
        ).toEqual([tx1]);
    });

    it('add transactions', () => {
        const account = testAccounts[0];
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
                    type: transactionsActions.fetchInit.type,
                },
            ),
        ).toEqual({ ...transactionsInitialState, isLoading: true });
    });

    it('fetch success', () => {
        expect(
            reducer(undefined, {
                type: transactionsActions.fetchSuccess.type,
            }),
        ).toEqual({ ...transactionsInitialState, isLoading: false });
    });

    it('fetch error', () => {
        expect(
            reducer(undefined, {
                type: transactionsActions.fetchError.type,
                payload: {
                    error: 'Some error',
                },
            }),
        ).toEqual({ ...transactionsInitialState, isLoading: false, error: 'Some error' });
    });
});
