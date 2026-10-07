import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { createMockDispatch, mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { type BlockchainNotification } from '@trezor/connect';

import { blockchainInitialState, prepareBlockchainReducer } from './blockchainReducer';
import {
    type OnBlockchainNotificationThunkDeps,
    type OnBlockchainNotificationThunkState,
    type SetCustomBackendThunkState,
    onBlockchainNotificationThunk,
    setCustomBackendThunk,
} from './blockchainThunks';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../settings/walletSettingsReducer';
import { stellarContractTokensInitialState } from '../token/stellarContractTokensSlice';
import { transactionsInitialState } from '../transactions/transactionsReducer';

const blockchainReducer = prepareBlockchainReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadBlockchain: mockReducer() },
});
const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

const electrumUrl = '127.0.0.1:50001:t';

const initStore = (enabledNetworks: NetworkSymbol[]) =>
    createTestCompositionRoot<void, SetCustomBackendThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
                blockchain: blockchainReducer,
                settings: walletSettingsReducer,
            }),
        }),
        preloadedState: {
            wallet: {
                blockchain: {
                    ...blockchainInitialState,
                    btc: {
                        ...blockchainInitialState.btc,
                        backends: {
                            selected: 'electrum' as const,
                            urls: { electrum: [electrumUrl] },
                        },
                    },
                },
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks,
                },
            },
        },
    }).services.store;

describe(setCustomBackendThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('requests a connection after applying a custom backend', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore([asNetworkSymbol('btc')]);

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('btc')));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).toHaveBeenCalledWith({ coin: 'btc', identity: undefined });
        const setCustomBackendOrder =
            setCustomBackend.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY;
        const reconnectOrder = reconnect.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY;
        expect(setCustomBackendOrder).toBeLessThan(reconnectOrder);
    });

    it('applies the custom backend of a disabled network without connecting to it', async () => {
        const setCustomBackend = jest
            .spyOn(TrezorConnect, 'blockchainSetCustomBackend')
            .mockResolvedValue({ success: true, payload: true });
        const reconnect = jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribeFiatRates')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });
        const store = initStore([]);

        await store.dispatch(setCustomBackendThunk(asNetworkSymbol('btc')));

        expect(setCustomBackend).toHaveBeenCalledWith({
            coin: 'btc',
            blockchainLink: { type: 'electrum', url: [electrumUrl] },
        });
        expect(reconnect).not.toHaveBeenCalled();
    });
});

describe('onBlockchainNotificationThunk', () => {
    // The sync queue is keyed by account, so each test needs an account of its own to stay
    // independent of what the ones before it left in flight.
    const initThunkApi = (descriptor: string) => {
        const account = {
            key: `${descriptor}-key`,
            descriptor,
            symbol: 'sol',
            networkType: 'solana',
            balance: '1',
            history: { total: 1, unconfirmed: 0 },
        } as unknown as Account;

        const notification = {
            coin: { shortcut: 'SOL' },
            notification: { descriptor, tx: { type: 'recv', txid: 'txid', blockHeight: 1 } },
        } as unknown as BlockchainNotification;

        const state = {
            device: deviceInitialState,
            tokenDefinitions: {},
            wallet: {
                accounts: [account],
                blockchain: blockchainInitialState,
                settings: initialWalletSettingsState,
                stellarContractTokens: stellarContractTokensInitialState,
                transactions: { ...transactionsInitialState, transactions: {} },
            },
        } satisfies OnBlockchainNotificationThunkState;

        const extra = {
            services: {
                analytics: { report: jest.fn() },
                getIsWindowVisible: () => true,
                getTradedAccountKeys: () => [],
            },
        } as unknown as OnBlockchainNotificationThunkDeps;

        const getState = () => state;

        return { ...createMockDispatch({ getState, extra }), getState, extra, notification };
    };

    const mockGetAccountInfo = (descriptor: string) => {
        // An unchanged account, so a sync stops after the pre-check instead of fetching history.
        const unchangedAccountInfo = {
            success: true,
            payload: { descriptor, balance: '1', history: { total: 1, unconfirmed: 0 } },
        } as unknown as Awaited<ReturnType<typeof TrezorConnect.getAccountInfo>>;

        const pendingSyncs: (() => void)[] = [];
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockImplementation(
            () =>
                new Promise(resolve => {
                    pendingSyncs.push(() => resolve(unchangedAccountInfo));
                }),
        );

        return {
            syncCount: () => getAccountInfo.mock.calls.length,
            finishSync: async (index: number) => {
                pendingSyncs[index]?.();
                await new Promise(resolve => {
                    setTimeout(resolve, 0);
                });
            },
        };
    };

    afterEach(() => jest.restoreAllMocks());

    it('coalesces notifications arriving during a sync into one trailing sync', async () => {
        const { dispatch, getState, extra, notification } = initThunkApi('coalesced-account');
        const { syncCount, finishSync } = mockGetAccountInfo('coalesced-account');

        await onBlockchainNotificationThunk(notification)(dispatch, getState, extra);
        await onBlockchainNotificationThunk(notification)(dispatch, getState, extra);
        await onBlockchainNotificationThunk(notification)(dispatch, getState, extra);

        expect(syncCount()).toBe(1);

        await finishSync(0);
        expect(syncCount()).toBe(2);

        await finishSync(1);
        expect(syncCount()).toBe(2);
    });

    it('syncs a notification that arrives once the account is idle again', async () => {
        const { dispatch, getState, extra, notification } = initThunkApi('idle-account');
        const { syncCount, finishSync } = mockGetAccountInfo('idle-account');

        await onBlockchainNotificationThunk(notification)(dispatch, getState, extra);
        await finishSync(0);

        await onBlockchainNotificationThunk(notification)(dispatch, getState, extra);

        expect(syncCount()).toBe(2);
    });
});
