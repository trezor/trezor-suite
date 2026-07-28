import { type TranslationKey } from '@suite/intl';
import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, filterThunkActionTypes, testMocks } from '@suite-common/test-utils';
import {
    createNotificationsReducer,
    notificationsActions,
} from '@suite-common/toast-notifications';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsState,
    type BlockchainState,
    type TransactionsState,
    feesReducer,
    initBlockchainThunk,
    initialWalletSettingsState,
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

import {
    accountsReducer,
    blockchainReducer,
    tradingReducer,
    transactionsReducer,
} from 'src/reducers/wallet';

import * as fixtures from './__fixtures__/blockchainActions';

const TrezorConnect = testMocks.getTrezorConnectMock();
const btcSymbol = asNetworkSymbol('btc');

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
        trading: tradingReducer(undefined, action),
        settings: {
            ...initialWalletSettingsState,
            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        },
    },
    notifications: notificationsReducer([], action),
    tokenDefinitions: tokenDefinitionsInitialState,
    device: {
        ...deviceInitialState,
        devices: [mockSuiteDevice({ state: { staticSessionId: '1stTestnetAddress@device_id:0' } })], // device is needed for notification/event
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
const mockStore = (preloadedState: State) =>
    configureMockStore<State>({
        reducer: (currentState = preloadedState, action) => {
            const state = currentState as State;

            return {
                ...state,
                wallet: {
                    ...state.wallet,
                    accounts: accountsReducer(state.wallet.accounts, action),
                    transactions: transactionsReducer(state.wallet.transactions, action),
                    blockchain: blockchainReducer(state.wallet.blockchain, action),
                    fees: feesReducer(state.wallet.fees, action),
                },
                notifications: notificationsReducer(state.notifications, action),
            };
        },
        preloadedState,
    });

describe('Blockchain Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.init.forEach(f => {
        it(`init: ${f.description}`, async () => {
            const store = mockStore(getInitialState(f.initialState as Args));
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
            const store = mockStore(getInitialState(f.initialState as Args));
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
            const store = mockStore(getInitialState(f.initialState as Args));
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
            const store = mockStore(getInitialState(f.initialState as Args));
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

            const store = mockStore(getInitialState(f.state as any));
            await store.dispatch(onBlockMinedThunk(f.block as any));
            const result = 'result' in f ? f.result : undefined;

            if (!result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const actions = filterThunkActionTypes(store.getActions()).filter(
                    a =>
                        a.type !== notificationsActions.addEvent.type &&
                        a.type !== notificationsActions.addToast.type,
                );
                expect(actions.length).toEqual(result.length);
                actions.forEach((action, index) => {
                    const expected = result[index];
                    if (!expected) throw new Error(`Missing expected result at index ${index}`);
                    expect(action.type).toEqual(expected);
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
                            if (!resTx) throw new Error(`Missing expected tx at index ${i}`);
                            expect(t).toMatchObject(resTx);
                        });
                    });
                }
            }
        });
    });

    fixtures.customBackend.forEach(f => {
        it(`customBackend: ${f.description}`, async () => {
            const store = mockStore(getInitialState(f.initialState as any));
            await store.dispatch(setCustomBackendThunk(asNetworkSymbol(f.symbol)));
            expect(TrezorConnect.blockchainSetCustomBackend).toHaveBeenCalledTimes(
                f.blockchainSetCustomBackend,
            );
        });
    });

    it('updateFeeInfo: just for coverage', async () => {
        const store = mockStore(
            getInitialState({
                blockchain: {
                    // @ts-expect-error partial params
                    btc: { blockHeight: 109 },
                },
                fees: {
                    [btcSymbol]: {
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
