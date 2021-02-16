import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import transactionReducer from '@wallet-reducers/transactionReducer';
import { getAccountKey, getAccountTransactions } from '@wallet-utils/accountUtils';
import * as transactionActions from '../transactionActions';
import { Account } from '@wallet-types';

type transactionsState = ReturnType<typeof transactionReducer>;
const { getWalletTransaction } = global.JestMocks;

export const getInitialState = (transactions?: transactionsState) => ({
    wallet: {
        transactions: transactions || transactionReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { transactions } = store.getState().wallet;
        store.getState().wallet = {
            transactions: transactionReducer(transactions, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

// TODO: more tests (updating existing/pending txs, fetching the data from blockbook,...)
describe('Transaction Actions', () => {
    it('Add transaction for first page (used on account create)', () => {
        const store = initStore(getInitialState());
        const account = global.JestMocks.getWalletAccount();
        store.dispatch(transactionActions.add([getWalletTransaction()], account as Account, 1));
        expect(
            getAccountTransactions(
                store.getState().wallet.transactions.transactions,
                account as Account,
            ).length,
        ).toEqual(1);
    });

    it('Remove txs for a given account', () => {
        const account1 = global.JestMocks.getWalletAccount({ descriptor: 'xpub1' });
        const account2 = global.JestMocks.getWalletAccount({ descriptor: 'xpub2' });
        const key1 = getAccountKey(account1.descriptor, account1.symbol, account1.deviceState);
        const key2 = getAccountKey(account2.descriptor, account2.symbol, account2.deviceState);
        const store = initStore(
            getInitialState({
                transactions: {
                    [key1]: [getWalletTransaction()],
                    [key2]: [getWalletTransaction()],
                },
                isLoading: false,
                error: null,
            }),
        );
        store.dispatch(transactionActions.reset(account1 as Account));
        // removed txs for acc1
        expect(
            getAccountTransactions(
                store.getState().wallet.transactions.transactions,
                account1 as Account,
            ),
        ).toEqual([]);
        // txs for acc2 are still there
        expect(
            getAccountTransactions(
                store.getState().wallet.transactions.transactions,
                account2 as Account,
            ).length,
        ).toEqual(1);
    });
});
