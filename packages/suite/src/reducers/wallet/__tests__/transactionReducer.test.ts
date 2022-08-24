import { extraDependencies } from '@suite/support/extraDependencies';
import {
    initialState,
    transactionActions,
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
                { ...initialState, transactions },
                {
                    type: 'none',
                },
            ),
        ).toEqual({ ...initialState, transactions });
    });

    it('TRANSACTION.RESET', () => {
        const { key } = testAccounts[0];

        const account = testAccounts[0];
        delete testTransactions[key];

        expect(
            reducer(
                { ...initialState, transactions: testTransactions },
                {
                    type: transactionActions.resetTransaction.type,
                    payload: {
                        account,
                    },
                },
            ),
        ).toEqual({ ...initialState, transactions: testTransactions });
    });

    it('TRANSACTION.REMOVE', () => {
        const account = testAccounts[0];
        const { key } = account;

        const otherAccountKey = testAccounts[1].key;
        const otherAccountTransactions = testTransactions[otherAccountKey];

        expect(
            reducer(
                { ...initialState, transactions: testTransactions },
                {
                    type: transactionActions.removeTransaction.type,
                    payload: {
                        account,
                        txs: testTransactions[key],
                    },
                },
            ),
        ).toEqual({
            ...initialState,
            transactions: { [otherAccountKey]: otherAccountTransactions, [key]: [] },
        });
    });

    it('TRANSACTION.ADD', () => {
        const account = testAccounts[0];
        const { key } = account;
        expect(
            reducer(
                { ...initialState, transactions },
                {
                    type: transactionActions.addTransaction.type,
                    payload: {
                        account,
                        transactions: testTransactions[key],
                    },
                },
            ),
        ).toEqual({ ...initialState, transactions: testTransactions });
    });

    it('TRANSACTION.FETCH_INIT', () => {
        expect(
            reducer(
                { ...initialState },
                {
                    type: transactionActions.fetchInit.type,
                },
            ),
        ).toEqual({ ...initialState, isLoading: true });
    });

    it('TRANSACTION.FETCH_SUCCESS', () => {
        expect(
            reducer(undefined, {
                type: transactionActions.fetchSuccess.type,
            }),
        ).toEqual({ ...initialState, isLoading: false });
    });

    it('TRANSACTION.FETCH_ERROR', () => {
        expect(
            reducer(undefined, {
                type: transactionActions.fetchError.type,
                payload: {
                    error: 'Some error',
                },
            }),
        ).toEqual({ ...initialState, isLoading: false, error: 'Some error' });
    });
});
