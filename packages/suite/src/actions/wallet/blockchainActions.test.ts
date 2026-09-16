import { type UnknownAction } from '@reduxjs/toolkit';

import { type TranslationKey } from '@suite/intl';
import { type AnalyticsDep, type AnalyticsSharedEvents } from '@suite-common/analytics';
import { asGetter } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { type GetIsWindowVisibleDep } from '@suite-common/suite-types';
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
    DEFAULT_NETWORK_SYNC_INTERVAL,
    type TransactionsState,
    blockchainActions,
    feesReducer,
    initBlockchainThunk,
    initialWalletSettingsState,
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
    preloadFeeInfoThunk,
    setCustomBackendThunk,
    stellarContractTokensInitialState,
} from '@suite-common/wallet-core';
import { type FeesState, type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
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
        stellarContractTokens: stellarContractTokensInitialState,
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
type BlockchainActionsTestDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;
const extra: BlockchainActionsTestDeps = {
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
};
const mockStore = (preloadedState: State) =>
    configureMockStore<BlockchainActionsTestDeps, State, UnknownAction>({
        extra,
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
            // The repo defaults to legacy fake timers; the async advance needs the modern ones.
            if (f.armsTimer) jest.useFakeTimers({ legacyFakeTimers: false });
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

            try {
                const store = mockStore(getInitialState(f.initialState as Args));
                await store.dispatch(
                    onBlockchainDisconnectThunk({
                        // @ts-expect-error partial params
                        coin: { shortcut: f.symbol },
                        identity: f.identity,
                    }),
                );
                const actions = filterThunkActionTypes(store.getActions());
                expect(actions).toMatchObject(f.actions);

                if (f.keepsTimer) {
                    // The armed handle must be left alone — clearing it would kill the chain
                    // while the state still holds the stale handle.
                    expect(clearTimeoutSpy).not.toHaveBeenCalledWith(fixtures.MOCK_SYNC_TIMEOUT);
                }
                if (f.clearsTimer) {
                    expect(clearTimeoutSpy).toHaveBeenCalledWith(fixtures.MOCK_SYNC_TIMEOUT);
                }
                if (f.armsTimer) {
                    expect(blockchainActions.synced.match(actions[0])).toBe(true);
                    if (blockchainActions.synced.match(actions[0])) {
                        expect(actions[0].payload.timeout).toBeDefined();
                    }
                    // The armed timer must actually continue the chain, not just exist: firing
                    // it has to run syncAccountsWithBlockchainThunk, which re-arms via a second
                    // synced action.
                    await jest.advanceTimersByTimeAsync(DEFAULT_NETWORK_SYNC_INTERVAL);
                    const syncedActions = store
                        .getActions()
                        .filter(blockchainActions.synced.match)
                        .filter(a => a.payload.symbol === f.symbol);
                    expect(syncedActions.length).toBeGreaterThanOrEqual(2);
                }
            } finally {
                clearTimeoutSpy.mockRestore();
                if (f.armsTimer) jest.useRealTimers();
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
                    a => a.type !== notificationsActions.addEvent.type,
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
