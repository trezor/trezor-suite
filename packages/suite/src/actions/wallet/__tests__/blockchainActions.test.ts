import { PROTO } from '@trezor/connect';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions, notificationsReducer } from '@suite-common/toast-notifications';
import {
    initBlockchainThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockMinedThunk,
    onBlockchainNotificationThunk,
    preloadFeeInfoThunk,
    setCustomBackendThunk,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';

import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import { accountsReducer, transactionsReducer, blockchainReducer } from 'src/reducers/wallet';
import feesReducer from 'src/reducers/wallet/feesReducer';

import * as fixtures from '../__fixtures__/blockchainActions';

const TrezorConnect = testMocks.getTrezorConnectMock();

type AccountsState = ReturnType<typeof accountsReducer>;
type TransactionsState = ReturnType<typeof transactionsReducer>;
type FeesState = ReturnType<typeof feesReducer>;
type BlockchainState = ReturnType<typeof blockchainReducer>;
interface Args {
    accounts?: AccountsState;
    blockchain?: Partial<BlockchainState>;
    fees?: Partial<FeesState>;
    transactions?: TransactionsState['transactions'];
}

export const getInitialState = (
    { accounts, transactions, blockchain, fees }: Args = {},
    action: any = { type: 'initial' },
) => ({
    wallet: {
        accounts: accountsReducer(accounts, action),
        transactions: transactionsReducer(
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
            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        },
    },
    notifications: notificationsReducer([], action),
    device: {
        devices: [{ state: 'deviceState' }], // device is needed for notification/event
    },
    suite: {
        device: { state: 'deviceState' }, // device is needed for notification/event
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

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
            transactions: transactionsReducer(wallet.transactions, action),
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
            await store.dispatch(initBlockchainThunk());
            expect(filterThunkActionTypes(store.getActions())).toMatchObject(f.actions);
            expect(TrezorConnect.blockchainUnsubscribeFiatRates).toBeCalledTimes(
                f.blockchainUnsubscribeFiatRates,
            );
            expect(TrezorConnect.blockchainSetCustomBackend).toBeCalledTimes(
                f.blockchainSetCustomBackend,
            );
        });
    });

    fixtures.onConnect.forEach(f => {
        it(`onConnect: ${f.description}`, async () => {
            testMocks.setTrezorConnectFixtures(f.connect);
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(onBlockchainConnectThunk(f.symbol));
            expect(filterThunkActionTypes(store.getActions())).toMatchObject(f.actions);
            expect(TrezorConnect.blockchainEstimateFee).toBeCalledTimes(f.blockchainEstimateFee);
            expect(TrezorConnect.blockchainSubscribe).toBeCalledTimes(f.blockchainSubscribe);
        });
    });

    fixtures.onDisconnect.forEach(f => {
        it(`onDisconnect: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(
                onBlockchainDisconnectThunk({
                    // @ts-expect-error partial params
                    coin: { shortcut: f.symbol },
                }),
            );
            const actions = filterThunkActionTypes(store.getActions());
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
        it(`onNotification: ${f.description}`, async () => {
            // testMocks.setTrezorConnectFixtures(f.connect);
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(onBlockchainNotificationThunk(f.params as any));
            expect(filterThunkActionTypes(store.getActions())).toMatchObject(f.actions);
            expect(TrezorConnect.getAccountInfo).toBeCalledTimes(f.getAccountInfo);
        });
    });

    fixtures.onBlock.forEach(f => {
        it(`onBlock: ${f.description}`, async () => {
            // set fixtures in @trezor/connect
            if (Array.isArray(f.connect)) {
                testMocks.setTrezorConnectFixtures(
                    f.connect.map(payload => ({ success: true, payload })),
                );
            } else {
                testMocks.setTrezorConnectFixtures(
                    f.connect && { success: true, payload: f.connect },
                );
            }

            const store = initStore(getInitialState(f.state as any));
            await store.dispatch(onBlockMinedThunk(f.block as any));
            const { result } = f;

            if (!result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const actions = filterThunkActionTypes(store.getActions()).filter(
                    a => a.type !== notificationsActions.addEvent.type,
                );
                expect(actions.length).toEqual(result.length);
                actions.forEach((action, index) => {
                    expect(action.type).toEqual(result[index]);
                });
                if (f.resultTxs) {
                    const txs = store.getState().wallet.transactions.transactions;
                    Object.keys(txs).forEach(key => {
                        // @ts-expect-error
                        const resTxs = f.resultTxs[key];
                        expect(txs[key].length).toEqual(resTxs.length);
                        txs[key].forEach((t, i) => expect(t).toMatchObject(resTxs[i]));
                    });
                }
            }
        });
    });

    fixtures.customBackend.forEach(f => {
        it(`customBackend: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState as any));
            await store.dispatch(setCustomBackendThunk(f.symbol));
            expect(TrezorConnect.blockchainSetCustomBackend).toBeCalledTimes(
                f.blockchainSetCustomBackend,
            );
        });
    });

    it('updateFeeInfo: just for coverage', async () => {
        const store = initStore(
            getInitialState({
                blockchain: {
                    // @ts-expect-error partial params
                    btc: { blockHeight: 109 },
                },
                fees: {
                    // @ts-expect-error partial params
                    btc: { blockHeight: 100 },
                },
            }),
        );
        // try invalid coin
        await store.dispatch(updateFeeInfoThunk('btc-invalid'));
        // will not trigger update because of blockHeight's
        await store.dispatch(updateFeeInfoThunk('btc'));
        expect(TrezorConnect.blockchainEstimateFee).toBeCalledTimes(0);

        // preload fee info failed in connect
        testMocks.setTrezorConnectFixtures({ success: false });
        await store.dispatch(preloadFeeInfoThunk());
        expect(filterThunkActionTypes(store.getActions())).toMatchObject([{ payload: {} }]);
    });
});
