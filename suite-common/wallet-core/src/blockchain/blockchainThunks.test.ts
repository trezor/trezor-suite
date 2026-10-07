import { combineReducers } from '@reduxjs/toolkit';

import { createMockDispatch, mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { blockchainActions } from './blockchainActions';
import {
    type BlockchainState,
    blockchainInitialState,
    prepareBlockchainReducer,
} from './blockchainReducer';
import {
    type SetCustomBackendThunkState,
    type SubscribeBlockchainThunkState,
    type UnsubscribeBlockchainThunkState,
    setCustomBackendThunk,
    subscribeBlockchainThunk,
    unsubscribeBlockchainThunk,
    unwatchAccountHistoryThunk,
    watchAccountHistoryThunk,
} from './blockchainThunks';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../settings/walletSettingsReducer';

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

describe('account history watching on a polled RPC backend', () => {
    const arcSymbol = asNetworkSymbol('arc');
    const ethSymbol = asNetworkSymbol('eth');

    const mockEvmAccount = (symbol: NetworkSymbol, descriptor: string) =>
        mockWalletAccount(
            { symbol, descriptor: asAccountDescriptor(descriptor) },
            networkSpecificDefaultEthereum,
        );

    const arcAccount = mockEvmAccount(arcSymbol, '0x1111111111111111111111111111111111111111');
    const otherArcAccount = mockEvmAccount(arcSymbol, '0x2222222222222222222222222222222222222222');
    const ethAccount = mockEvmAccount(ethSymbol, '0x3333333333333333333333333333333333333333');

    const createState = ({
        accounts = [arcAccount, otherArcAccount],
        watchedAccountKey,
        isCustomBackend = false,
    }: {
        accounts?: Account[];
        watchedAccountKey?: AccountKey;
        isCustomBackend?: boolean;
    } = {}): SubscribeBlockchainThunkState => {
        const blockchain: BlockchainState = {
            ...blockchainInitialState,
            arc: {
                ...blockchainInitialState.arc,
                watchedAccountKey,
                backends: isCustomBackend
                    ? { selected: 'evm-rpc', urls: { 'evm-rpc': ['https://rpc.example'] } }
                    : {},
            },
        };

        return { wallet: { accounts, blockchain } };
    };

    const createDispatch = (state: SubscribeBlockchainThunkState) => {
        const getState = () => state;

        return { getState, ...createMockDispatch({ getState }) };
    };

    const mockSubscribe = () =>
        jest
            .spyOn(TrezorConnect, 'blockchainSubscribe')
            .mockResolvedValue({ success: true, payload: { subscribed: true } });
    const mockUnsubscribe = () =>
        jest
            .spyOn(TrezorConnect, 'blockchainUnsubscribe')
            .mockResolvedValue({ success: true, payload: { subscribed: false } });

    afterEach(() => jest.restoreAllMocks());

    it('subscribes neither accounts nor blocks while no history is on screen', async () => {
        const subscribe = mockSubscribe();

        const { dispatch, getState } = createDispatch(createState());

        await subscribeBlockchainThunk({ symbol: arcSymbol, onConnect: true })(
            dispatch,
            getState,
            {},
        );

        expect(subscribe).not.toHaveBeenCalled();
    });

    it('subscribes only the account whose history is on screen', async () => {
        const subscribe = mockSubscribe();

        const { dispatch, getState } = createDispatch(
            createState({ watchedAccountKey: arcAccount.key }),
        );

        await subscribeBlockchainThunk({ symbol: arcSymbol, onConnect: true })(
            dispatch,
            getState,
            {},
        );

        expect(subscribe).toHaveBeenCalledTimes(1);
        expect(subscribe).toHaveBeenCalledWith({
            accounts: [arcAccount],
            coin: 'arc',
            identity: arcAccount.deviceState,
            blocks: false,
        });
    });

    it('subscribes every account when the network runs on a custom backend', async () => {
        const subscribe = mockSubscribe();

        const { dispatch, getState } = createDispatch(createState({ isCustomBackend: true }));

        await subscribeBlockchainThunk({ symbol: arcSymbol })(dispatch, getState, {});

        expect(subscribe).toHaveBeenCalledWith(
            expect.objectContaining({ accounts: [arcAccount, otherArcAccount] }),
        );
    });

    it('does not subscribe the remaining accounts when one is removed', async () => {
        const subscribe = mockSubscribe();
        jest.spyOn(TrezorConnect, 'blockchainDisconnect').mockResolvedValue({
            success: true,
            payload: { disconnected: true },
        });
        const state: UnsubscribeBlockchainThunkState = createState({
            accounts: [otherArcAccount],
        });
        const getState = () => state;
        const { dispatch } = createMockDispatch({ getState });

        await unsubscribeBlockchainThunk([arcAccount])(dispatch, getState, {});

        expect(subscribe).not.toHaveBeenCalled();
    });

    it('subscribes the account once its history comes on screen', async () => {
        const subscribe = mockSubscribe();

        const { actions, dispatch, getState } = createDispatch(createState());

        await watchAccountHistoryThunk({ accountKey: arcAccount.key })(dispatch, getState, {});

        expect(actions).toContainEqual(
            blockchainActions.setWatchedAccount({
                symbol: arcSymbol,
                accountKey: arcAccount.key,
            }),
        );
        expect(subscribe).toHaveBeenCalledWith({
            accounts: [arcAccount],
            coin: 'arc',
            identity: arcAccount.deviceState,
            blocks: false,
        });
    });

    it('unsubscribes the account once its history leaves the screen', async () => {
        const unsubscribe = mockUnsubscribe();

        const { actions, dispatch, getState } = createDispatch(
            createState({ watchedAccountKey: arcAccount.key }),
        );

        await unwatchAccountHistoryThunk({ accountKey: arcAccount.key })(dispatch, getState, {});

        expect(actions).toContainEqual(
            blockchainActions.setWatchedAccount({ symbol: arcSymbol, accountKey: undefined }),
        );
        expect(unsubscribe).toHaveBeenCalledWith({
            accounts: [arcAccount],
            coin: 'arc',
            identity: arcAccount.deviceState,
        });
    });

    it('keeps watching an account that took over the screen before the previous one left', async () => {
        const unsubscribe = mockUnsubscribe();

        const { actions, dispatch, getState } = createDispatch(
            createState({ watchedAccountKey: otherArcAccount.key }),
        );

        await unwatchAccountHistoryThunk({ accountKey: arcAccount.key })(dispatch, getState, {});

        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: blockchainActions.setWatchedAccount.type }),
        );
        expect(unsubscribe).toHaveBeenCalledWith(
            expect.objectContaining({ accounts: [arcAccount] }),
        );
    });

    it('leaves networks that are not polled over RPC alone', async () => {
        const subscribe = mockSubscribe();

        const { actions, dispatch, getState } = createDispatch(
            createState({ accounts: [ethAccount] }),
        );

        await watchAccountHistoryThunk({ accountKey: ethAccount.key })(dispatch, getState, {});

        expect(actions).not.toContainEqual(
            expect.objectContaining({ type: blockchainActions.setWatchedAccount.type }),
        );
        expect(subscribe).not.toHaveBeenCalled();
    });
});
