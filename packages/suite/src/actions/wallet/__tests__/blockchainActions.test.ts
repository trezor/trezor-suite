import { type TranslationKey } from '@suite/intl';
import { filterThunkActionTypes, testMocks } from '@suite-common/test-utils';
import {
    createNotificationsReducer,
    notificationsActions,
} from '@suite-common/toast-notifications';
import {
    type AccountsState,
    type BlockchainState,
    type TransactionsState,
    feesReducer,
    initBlockchainThunk,
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
    preloadFeeInfoThunk,
    setCustomBackendThunk,
} from '@suite-common/wallet-core';
import { type FeesState } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { typedObjectKeys } from '@trezor/utils';

import { accountsReducer, blockchainReducer, transactionsReducer } from 'src/reducers/wallet';
import { configureStore } from 'src/support/tests/configureStore';

import * as fixtures from '../__fixtures__/blockchainActions';

const TrezorConnect = testMocks.getTrezorConnectMock();

const { reducer: notificationsReducer } = createNotificationsReducer<TranslationKey>();

interface Args {
    accounts?: AccountsState;
    blockchain?: Partial<BlockchainState>;
    fees?: Partial<FeesState>;
    transactions?: TransactionsState['transactions'];
}

const getInitialState = (
    { accounts, transactions, blockchain, fees }: Args = {},
    action: any = { type: 'initial' },
) => ({
    wallet: {
        accounts: accountsReducer(accounts, action),
        transactions: transactionsReducer(
            {
                transactions: transactions || {},
                phishing: {},
                fetchStatusDetail: {},
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
        devices: [{ state: { staticSessionId: '1stTestnetAddress@device_id:0' } }], // device is needed for notification/event
    },
    suite: {
        device: { state: { staticSessionId: '1stTestnetAddress@device_id:0' } }, // device is needed for notification/event
        settings: { debug: { showDebugMenu: false } },
    },
    window: {
        isVisible: true,
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
            expect(TrezorConnect.blockchainSetCustomBackend).toHaveBeenCalledTimes(
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
            expect(TrezorConnect.blockchainEstimateFee).toHaveBeenCalledTimes(
                f.blockchainEstimateFee,
            );
            expect(TrezorConnect.blockchainSubscribe).toHaveBeenCalledTimes(f.blockchainSubscribe);
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
                const timeout = (actions[0]?.payload.time ?? 0) - new Date().getTime() + 500;
                jest.setTimeout(10000);
                await new Promise(resolve => setTimeout(resolve, timeout));
                expect(TrezorConnect.blockchainUnsubscribeFiatRates).toHaveBeenCalledTimes(1);
            }
        });
    });

    fixtures.onNotification.forEach(f => {
        it(`onNotification: ${f.description}`, async () => {
            // testMocks.setTrezorConnectFixtures(f.connect);
            const store = initStore(getInitialState(f.initialState as Args));
            await store.dispatch(onBlockchainNotificationThunk(f.params as any));
            expect(filterThunkActionTypes(store.getActions())).toMatchObject(f.actions);
            expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(f.getAccountInfo);
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
            const result = 'result' in f ? f.result : undefined;

            if (!result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const actions = filterThunkActionTypes(store.getActions()).filter(
                    a => a.type !== notificationsActions.addEvent.type,
                );
                expect(actions.length).toEqual(result.length);
                actions.forEach((action, index) => {
                    expect(action.type).toEqual(result?.[index]);
                });
                const resultTxs = 'resultTxs' in f ? f.resultTxs : undefined;
                if (resultTxs) {
                    const txs = store.getState().wallet.transactions.transactions;
                    typedObjectKeys(txs).forEach(key => {
                        const resTxs = resultTxs[key as unknown as keyof typeof resultTxs]; // Todo: type fixtures
                        const keyTxs = txs[key] ?? [];
                        expect(keyTxs.length).toEqual(resTxs.length);
                        keyTxs.forEach((t, i) => {
                            const resTx = resTxs[i];
                            if (resTx) {
                                expect(t).toMatchObject(resTx);
                            }
                        });
                    });
                }
            }
        });
    });

    fixtures.customBackend.forEach(f => {
        it(`customBackend: ${f.description}`, async () => {
            const store = initStore(getInitialState(f.initialState as any));
            await store.dispatch(setCustomBackendThunk(f.symbol));
            expect(TrezorConnect.blockchainSetCustomBackend).toHaveBeenCalledTimes(
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
                    btc: {
                        status: 'loaded',
                        data: {
                            minPriorityFee: 0,
                            minFee: 1,
                            maxFee: 100,
                            blockHeight: 100,
                            blockTime: 1,
                            levels: [
                                { label: 'high', feePerUnit: '40', blocks: 1 },
                                { label: 'normal', feePerUnit: '4', blocks: 1 },
                                { label: 'economy', feePerUnit: '1', blocks: 1 },
                            ],
                        },
                    },
                },
            }),
        );

        // preload fee info failed in connect
        testMocks.setTrezorConnectFixtures({ success: false });
        await store.dispatch(preloadFeeInfoThunk());
        expect(filterThunkActionTypes(store.getActions())).toMatchObject([{ payload: {} }]);
    });
});
