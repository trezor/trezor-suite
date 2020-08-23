1/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import accountsReducer from '@wallet-reducers/accountsReducer';
import transactionReducer from '@wallet-reducers/transactionReducer';
import notificationsReducer from '@suite-reducers/notificationReducer';
import { BLOCKCHAIN } from '../constants';
import * as blockchainActions from '../blockchainActions';
import * as fixtures from '../__fixtures__/blockchainActions';

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            getAccountInfo: () =>
                fixture
                    ? {
                          success: true,
                          payload: fixture,
                      }
                    : {
                          success: false,
                      },
            blockchainGetTransactions: () => {
                return {
                    success: true,
                    payload: {
                        txid: 'foo',
                    },
                };
            },
            blockchainEstimateFee: () =>
                fixture || {
                    success: false,
                },
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        BLOCKCHAIN: {},
    };
});

type AccountsState = ReturnType<typeof accountsReducer>;
type TransactionsState = ReturnType<typeof transactionReducer>;
interface InitialState {
    accounts?: AccountsState;
    transactions?: TransactionsState['transactions'];
}

export const getInitialState = (state?: InitialState) => {
    const accounts = state ? state.accounts : [];
    const txs = state ? state.transactions : undefined;
    const initAction: any = { type: 'foo' };
    return {
        wallet: {
            accounts: accountsReducer(accounts, initAction),
            transactions: transactionReducer(
                {
                    transactions: txs || {},
                    isLoading: false,
                    error: null,
                },
                initAction,
            ),
            settings: {
                blockbookUrls: [],
            },
        },
        notifications: notificationsReducer([], initAction),
        devices: [{ state: 'deviceState' }], // device is needed for notification/event
        suite: {
            device: { state: 'deviceState' }, // device is needed for notification/event
        },
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];
        const { accounts, transactions } = store.getState().wallet;
        store.getState().wallet.accounts = accountsReducer(accounts, action);
        store.getState().wallet.transactions = transactionReducer(transactions, action);
        store.getState().notifications = notificationsReducer(
            store.getState().notifications,
            action,
        );
    });
    return store;
};

describe('Blockchain Actions', () => {
    it('init', async () => {
        const store = initStore(getInitialState());
        await store.dispatch(blockchainActions.init());
        const action = store.getActions().pop();
        expect(action.type).toEqual(BLOCKCHAIN.READY);
    });

    fixtures.onBlock.forEach(f => {
        it(`onBlock: ${f.description}`, async () => {
            // set fixtures in trezor-connect
            require('trezor-connect').setTestFixtures(f.connect);
            const store = initStore(getInitialState(f.state as any));
            await store.dispatch(blockchainActions.onBlockMined(f.block as any));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const actions = store.getActions().filter(a => a.type !== '@notification/event');
                expect(actions.length).toEqual(f.result.length);
                actions.forEach((action, index) => {
                    expect(action.type).toEqual(f.result[index]);
                });
                if (f.resultTxs) {
                    const txs = store.getState().wallet.transactions.transactions;
                    Object.keys(txs).forEach(key => {
                        // @ts-ignore
                        const resTxs = f.resultTxs[key];
                        expect(txs[key].length).toEqual(resTxs.length);
                        txs[key].forEach((t, i) => expect(t).toMatchObject(resTxs[i]));
                    });
                }
            }
        });
    });
});
