/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import accountsReducer from '@wallet-reducers/accountsReducer';
import transactionReducer from '@wallet-reducers/transactionReducer';
import blockchainReducer from '@wallet-reducers/blockchainReducer';
import feesReducer from '@wallet-reducers/feesReducer';
import notificationsReducer from '@suite-reducers/notificationReducer';
import * as blockchainActions from '../blockchainActions';
import * as fixtures from '../__fixtures__/blockchainActions';

jest.mock('trezor-connect', () => global.JestMocks.getTrezorConnect({}));
const TrezorConnect = require('trezor-connect').default;

type AccountsState = ReturnType<typeof accountsReducer>;
type TransactionsState = ReturnType<typeof transactionReducer>;
type FeesState = ReturnType<typeof feesReducer>;
type BlockchainState = ReturnType<typeof blockchainReducer>;
interface Args {
    accounts?: AccountsState;
    blockchain?: Partial<BlockchainState>;
    fees?: Partial<FeesState>;
    transactions?: TransactionsState['transactions'];
    blockbookUrls?: { coin: string }[];
}

export const getInitialState = (
    { accounts, transactions, blockchain, fees, blockbookUrls }: Args = {},
    action: any = { type: 'initial' },
) => ({
    wallet: {
        accounts: accountsReducer(accounts, action),
        transactions: transactionReducer(
            {
                transactions: transactions || {},
                isLoading: false,
                error: null,
            },
            action,
        ),
        blockchain: {
            ...blockchainReducer(undefined, action),
            ...blockchain,
        },
        fees: {
            ...feesReducer(undefined, action),
            ...fees,
        },
        settings: {
            blockbookUrls: blockbookUrls || [],
        },
    },
    notifications: notificationsReducer([], action),
    devices: [{ state: 'deviceState' }], // device is needed for notification/event
    suite: {
        device: { state: 'deviceState' }, // device is needed for notification/event
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];
        const state = store.getState();
        const { wallet } = state;
        store.getState().wallet = {
            ...wallet,
            accounts: accountsReducer(wallet.accounts, action),
            transactions: transactionReducer(wallet.transactions, action),
            blockchain: blockchainReducer(wallet.blockchain, action),
            fees: feesReducer(wallet.fees, action),
        };
        store.getState().notifications = notificationsReducer(state.notifications, action);
    });
    return store;
};

describe('Blockchain Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(blockchainActions.init());
            expect(store.getActions()).toMatchObject(f.actions);
            expect(TrezorConnect.blockchainUnsubscribeFiatRates).toBeCalledTimes(
                f.blockchainUnsubscribeFiatRates,
            );
        });
    });

    fixtures.onConnect.forEach(f => {
        it(`onConnect: ${f.description}`, async () => {
            TrezorConnect.setTestFixtures(f.connect);
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(blockchainActions.onConnect(f.symbol));
            expect(store.getActions()).toMatchObject(f.actions);
            expect(TrezorConnect.blockchainEstimateFee).toBeCalledTimes(f.blockchainEstimateFee);
            expect(TrezorConnect.blockchainSubscribe).toBeCalledTimes(f.blockchainSubscribe);
        });
    });

    fixtures.onDisconnect.forEach(f => {
        it(`onDisconnect: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(
                blockchainActions.onDisconnect({
                    // @ts-ignore partial params
                    coin: { shortcut: f.symbol },
                }),
            );
            const actions = store.getActions();
            expect(actions).toMatchObject(f.actions);
            if (actions.length) {
                // wait for reconnection timeout
                const timeout = actions[0].payload.time - new Date().getTime() + 500;
                jest.setTimeout(10000);
                await new Promise(resolve => setTimeout(resolve, timeout));
                expect(TrezorConnect.blockchainUnsubscribeFiatRates).toBeCalledTimes(1);
            }
        });
    });

    fixtures.onNotification.forEach(f => {
        it(`onConnect: ${f.description}`, async () => {
            // TrezorConnect.setTestFixtures(f.connect);
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(blockchainActions.onNotification(f.params as any));
            expect(store.getActions()).toMatchObject(f.actions);
            expect(TrezorConnect.getAccountInfo).toBeCalledTimes(f.getAccountInfo);
        });
    });

    fixtures.onBlock.forEach(f => {
        it(`onBlock: ${f.description}`, async () => {
            // set fixtures in trezor-connect
            if (Array.isArray(f.connect)) {
                TrezorConnect.setTestFixtures(
                    f.connect.map(payload => ({ success: true, payload })),
                );
            } else {
                TrezorConnect.setTestFixtures(f.connect && { success: true, payload: f.connect });
            }

            const store = initStore(getInitialState(f.state as any));
            await store.dispatch(blockchainActions.onBlockMined(f.block as any));
            const { result } = f;
            if (!result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const actions = store.getActions().filter(a => a.type !== '@notification/event');
                expect(actions.length).toEqual(result.length);
                actions.forEach((action, index) => {
                    expect(action.type).toEqual(result[index]);
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

    fixtures.customBacked.forEach(f => {
        it(`customBacked: ${f.description}`, async () => {
            const store = initStore(
                getInitialState({
                    blockbookUrls: f.initialState,
                }),
            );
            await store.dispatch(blockchainActions.setCustomBackend(f.symbol));
            expect(TrezorConnect.blockchainSetCustomBackend).toBeCalledTimes(
                f.blockchainSetCustomBackend,
            );
        });
    });

    it('updateFeeInfo: just for coverage', async () => {
        const store = initStore(
            getInitialState({
                blockchain: {
                    // @ts-ignore partial params
                    btc: { blockHeight: 109 },
                },
                fees: {
                    // @ts-ignore partial params
                    btc: { blockHeight: 100 },
                },
            }),
        );
        // try invalid coin
        await store.dispatch(blockchainActions.updateFeeInfo('btc-invalid'));
        // will not trigger update because of blockHeight's
        await store.dispatch(blockchainActions.updateFeeInfo('btc'));
        expect(TrezorConnect.blockchainEstimateFee).toBeCalledTimes(0);

        // preload fee info failed in connect
        TrezorConnect.setTestFixtures({ success: false });
        await store.dispatch(blockchainActions.preloadFeeInfo());
        expect(store.getActions()).toMatchObject([{ payload: {} }]);
    });
});
