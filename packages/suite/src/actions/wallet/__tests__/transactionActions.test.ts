import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import transactionReducer from '@wallet-reducers/transactionReducer';
import { getAccountTransactions } from '@suite-common/wallet-utils';
import * as transactionActions from '../transactionActions';

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
        store.dispatch(transactionActions.add([getWalletTransaction()], account, 1));
        expect(
            getAccountTransactions(account.key, store.getState().wallet.transactions.transactions)
                .length,
        ).toEqual(1);
    });

    it('Remove txs for a given account', () => {
        const account1 = global.JestMocks.getWalletAccount({ descriptor: 'xpub1' });
        const account2 = global.JestMocks.getWalletAccount({ descriptor: 'xpub2' });
        const store = initStore(
            getInitialState({
                transactions: {
                    [account1.key]: [getWalletTransaction()],
                    [account2.key]: [getWalletTransaction()],
                },
                isLoading: false,
                error: null,
            }),
        );
        store.dispatch(transactionActions.reset(account1));
        // removed txs for acc1
        expect(
            getAccountTransactions(account1.key, store.getState().wallet.transactions.transactions),
        ).toEqual([]);
        // txs for acc2 are still there
        expect(
            getAccountTransactions(account2.key, store.getState().wallet.transactions.transactions)
                .length,
        ).toEqual(1);
    });
});
