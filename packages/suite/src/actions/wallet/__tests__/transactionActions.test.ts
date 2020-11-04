import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import transactionReducer from '@wallet-reducers/transactionReducer';
import { AccountTransaction } from 'trezor-connect';
import { getAccountKey, getAccountTransactions } from '@wallet-utils/accountUtils';
import * as transactionActions from '../transactionActions';
import { Account, WalletAccountTransaction } from '@wallet-types';

type transactionsState = ReturnType<typeof transactionReducer>;

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

// TODO: move to setupJest, could accepts account as a param and change necessary fields?
const getAccountTransaction = (t?: Partial<AccountTransaction>) => ({
    descriptor:
        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
    symbol: 'btc',
    type: 'sent',
    txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
    blockTime: 1565797979,
    blockHeight: 590093,
    blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
    amount: '0.00006497',
    fee: '0.00002929',
    targets: [
        {
            addresses: ['36JkLACrdxARqXXffZk91V9W6SJvghKaVK'],
            amount: '0.00006497',
        },
    ],
    tokens: [],
    ...t,
});

// TODO: more tests (updating existing/pending txs, fetching the data from blockbook,...)
describe('Transaction Actions', () => {
    it('Add transaction for first page (used on account create)', () => {
        const store = initStore(getInitialState());
        const account = global.JestMocks.getWalletAccount();
        store.dispatch(
            transactionActions.add(
                [getAccountTransaction() as AccountTransaction],
                account as Account,
                1,
            ),
        );
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
                    [key1]: [getAccountTransaction() as WalletAccountTransaction],
                    [key2]: [getAccountTransaction() as WalletAccountTransaction],
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
