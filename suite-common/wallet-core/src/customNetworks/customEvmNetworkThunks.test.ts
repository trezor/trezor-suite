import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { createTestCompositionRoot, wireEnabledNetworksMock } from '@suite-common/test-utils';
import {
    asNetworkSymbol,
    getNetworkOptional,
    getSupportedNetworks,
    isNetworkSymbol,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';
import { mockGetSupportedNetworks } from '@suite-common/wallet-config/mocks';
import {
    type Account,
    type Blockchain,
    type BlockchainNetworks,
    type WalletSettings,
} from '@suite-common/wallet-types';
import {
    mockCustomEvmNetworkDefinition,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';
import { buildCustomEvmNetworkConfig } from '@trezor/network-ethereum-suite-common';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import type { TimerId } from '@trezor/type-utils';

import {
    type AddCustomEvmNetworkThunkDeps,
    type AddCustomEvmNetworkThunkState,
    type RemoveCustomEvmNetworkThunkDeps,
    type RemoveCustomEvmNetworkThunkState,
    addCustomEvmNetworkThunk,
    removeCustomEvmNetworkThunk,
} from './customEvmNetworkThunks';
import { customEvmNetworksActions } from './customEvmNetworksActions';
import { accountsActions } from '../accounts/accountsActions';
import { blockchainActions } from '../blockchain/blockchainActions';
import { prepareBlockchainReducer } from '../blockchain/blockchainReducer';
import { discoveryInitialState } from '../discovery/discoveryReducer';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../settings/walletSettingsReducer';

const symbol = asNetworkSymbol('evm4242');
const definition = mockCustomEvmNetworkDefinition({
    rpcUrls: ['https://rpc.custom.example', 'https://rpc2.custom.example'],
});

// The registry types are closed over the predefined symbols, so a custom symbol is read through an open view.
const asOpenState = (state: BlockchainNetworks): Record<string, Blockchain | undefined> => state;

type ThunkDeps = AddCustomEvmNetworkThunkDeps & RemoveCustomEvmNetworkThunkDeps;
type State = AddCustomEvmNetworkThunkState & RemoveCustomEvmNetworkThunkState;

const settingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});
const blockchainReducer = prepareBlockchainReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadBlockchain: mockReducer() },
});

const initStore = ({
    accounts = [],
    settings = initialWalletSettingsState,
}: { accounts?: Account[]; settings?: WalletSettings } = {}) => {
    const registerCustomEvmNetwork = jest.fn();
    const unregisterCustomEvmNetwork = jest.fn();
    const networks = mockNetworksState(mockGetSupportedNetworks());
    const root = createTestCompositionRoot<ThunkDeps, State>({
        reducer: {
            networks: () => networks,
            device: () => deviceInitialState,
            persistentDeviceData: () => persistentDeviceDataInitialState,
            wallet: combineReducers({
                settings: settingsReducer,
                blockchain: blockchainReducer,
                accounts: () => accounts,
                discovery: () => discoveryInitialState,
            }),
        },
        preloadedState: {
            networks,
            device: deviceInitialState,
            persistentDeviceData: persistentDeviceDataInitialState,
            wallet: {
                settings,
                accounts,
                blockchain: blockchainReducer(undefined, { type: 'init' }),
                discovery: discoveryInitialState,
            },
        },
        services: () => ({
            networks: { registerCustomEvmNetwork, unregisterCustomEvmNetwork },
        }),
    });

    return {
        store: root.services.store,
        registerCustomEvmNetwork,
        unregisterCustomEvmNetwork,
    };
};

const MEASURED_BLOCK_TIME_SECONDS = 2.5;

const rejection = {
    success: false,
    error: { code: 'Method_InvalidParameter', message: 'no' },
} as const;

const mockConnect = ({
    chainId = 4242,
    isBlockTimeMeasured = true,
    isRegistered = true,
    isBackendRegistered = true,
} = {}) => {
    const blockTimeSeconds = isBlockTimeMeasured ? MEASURED_BLOCK_TIME_SECONDS : undefined;
    const getChainId = jest
        .spyOn(TrezorBlockchain, 'evmRpcGetChainId')
        .mockResolvedValue({ success: true, payload: { chainId, blockTimeSeconds } });
    const register = jest
        .spyOn(TrezorConnect, 'registerEvmNetwork')
        .mockResolvedValue(
            isRegistered ? { success: true, payload: { symbol: definition.symbol } } : rejection,
        );
    const registerBackend = jest
        .spyOn(TrezorBlockchain, 'registerEvmNetwork')
        .mockResolvedValue(
            isBackendRegistered
                ? { success: true, payload: { symbol: definition.symbol } }
                : rejection,
        );
    const { updateConnectSettings } = wireEnabledNetworksMock();

    return { getChainId, register, registerBackend, updateConnectSettings };
};

// The thunks register in the global legacy registry, which must not leak between tests.
const cleanUp = () => {
    jest.restoreAllMocks();
    if (isNetworkSymbol(symbol)) {
        unregisterLegacyNetwork(symbol);
    }
};

describe('addCustomEvmNetworkThunk', () => {
    afterEach(cleanUp);

    it('validates the first RPC url against the chain id', async () => {
        const { getChainId } = mockConnect();
        const { store } = initStore();

        await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(getChainId).toHaveBeenCalledTimes(1);
        expect(getChainId).toHaveBeenCalledWith({
            url: 'https://rpc.custom.example',
            measureBlockTime: true,
        });
    });

    it('registers the network everywhere, stores it and enables it', async () => {
        const { register, registerBackend, updateConnectSettings } = mockConnect();
        const { store, registerCustomEvmNetwork } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));
        const storedDefinition = { ...definition, blockTimeSeconds: MEASURED_BLOCK_TIME_SECONDS };

        expect(addCustomEvmNetworkThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual(storedDefinition);
        expect(register).toHaveBeenCalledWith({ symbol, name: 'Custom Chain', chainId: 4242 });
        expect(registerBackend).toHaveBeenCalledWith({
            symbol,
            name: 'Custom Chain',
            rpcUrls: definition.rpcUrls,
            blockTimeSeconds: MEASURED_BLOCK_TIME_SECONDS,
        });
        expect(registerCustomEvmNetwork).toHaveBeenCalledWith({
            symbol,
            config: buildCustomEvmNetworkConfig(storedDefinition),
        });
        expect(updateConnectSettings).not.toHaveBeenCalled();
        expect(getNetworkOptional(symbol)?.chainId).toBe(4242);
        expect(getSupportedNetworks()).toContain(symbol);

        const { settings, blockchain } = store.getState().wallet;
        expect(settings.customEvmNetworks).toEqual([storedDefinition]);
        expect(settings.enabledNetworks).toContain(symbol);
        expect(asOpenState(blockchain)[symbol]).toBeDefined();
    });

    it('still adds a network whose block time could not be measured', async () => {
        const { registerBackend } = mockConnect({ isBlockTimeMeasured: false });
        const { store } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(addCustomEvmNetworkThunk.fulfilled.match(result)).toBe(true);
        expect(registerBackend).toHaveBeenCalledWith(
            expect.objectContaining({ blockTimeSeconds: undefined }),
        );
        expect(store.getState().wallet.settings.customEvmNetworks).toEqual([definition]);
    });

    it('rejects a network whose symbol or chain id is already known', async () => {
        const { getChainId } = mockConnect({ chainId: 1 });
        const { store, registerCustomEvmNetwork } = initStore();

        const sameChainId = await store.dispatch(
            addCustomEvmNetworkThunk({ definition: { ...definition, chainId: 1 } }),
        );
        const sameSymbol = await store.dispatch(
            addCustomEvmNetworkThunk({
                definition: { ...definition, symbol: asNetworkSymbol('eth') },
            }),
        );

        expect(sameChainId.payload).toEqual({ error: 'TR_CUSTOM_NETWORK_ALREADY_EXISTS' });
        expect(sameSymbol.payload).toEqual({ error: 'TR_CUSTOM_NETWORK_ALREADY_EXISTS' });
        expect(getChainId).not.toHaveBeenCalled();
        expect(registerCustomEvmNetwork).not.toHaveBeenCalled();
    });

    it('rejects an RPC that is not reachable', async () => {
        mockConnect();
        jest.spyOn(TrezorBlockchain, 'evmRpcGetChainId').mockResolvedValue({
            success: false,
            error: { code: 'Method_InvalidParameter', message: 'unreachable' },
        });
        const { store, registerCustomEvmNetwork } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(result.payload).toEqual({ error: 'TR_CUSTOM_BACKEND_CONNECTION_ERROR' });
        expect(registerCustomEvmNetwork).not.toHaveBeenCalled();
        expect(store.getState().wallet.settings.customEvmNetworks).toEqual([]);
    });

    it('rejects an RPC serving a different chain', async () => {
        mockConnect({ chainId: 1337 });
        const { store } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(result.payload).toEqual({
            error: 'TR_CUSTOM_BACKEND_CHAIN_MISMATCH',
            actualChainId: 1337,
        });
        expect(isNetworkSymbol(symbol)).toBe(false);
    });

    it('rejects when the RPC check throws', async () => {
        mockConnect();
        jest.spyOn(TrezorBlockchain, 'evmRpcGetChainId').mockRejectedValue(new Error('x'));
        const { store } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(result.payload).toEqual({ error: 'TR_CUSTOM_BACKEND_VALIDATION_ERROR' });
    });

    it('rejects a definition without any RPC url', async () => {
        const { getChainId } = mockConnect();
        const { store } = initStore();

        const result = await store.dispatch(
            addCustomEvmNetworkThunk({ definition: { ...definition, rpcUrls: [] } }),
        );

        expect(result.payload).toEqual({ error: 'TR_CUSTOM_BACKEND_VALIDATION_ERROR' });
        expect(getChainId).not.toHaveBeenCalled();
    });

    it.each([
        ['Connect', { isRegistered: false }],
        ['the backends', { isBackendRegistered: false }],
    ])('leaves Suite untouched when %s refuse the network', async (_, mockParams) => {
        mockConnect(mockParams);
        const { store, registerCustomEvmNetwork } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(addCustomEvmNetworkThunk.rejected.match(result)).toBe(true);
        expect(registerCustomEvmNetwork).not.toHaveBeenCalled();
        expect(isNetworkSymbol(symbol)).toBe(false);
        expect(store.getState().wallet.settings.customEvmNetworks).toEqual([]);
    });
});

describe('removeCustomEvmNetworkThunk', () => {
    afterEach(cleanUp);

    const addNetwork = async () => {
        mockConnect();
        const stores = initStore({
            settings: { ...initialWalletSettingsState, enabledNetworks: [asNetworkSymbol('btc')] },
            accounts: [
                {
                    ...mockWalletAccount({ symbol: asNetworkSymbol('eth'), imported: true }),
                    symbol,
                },
                mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
            ],
        });
        await stores.store.dispatch(addCustomEvmNetworkThunk({ definition }));

        return stores;
    };

    it('disables the network, drops its accounts and unregisters it', async () => {
        const { store, unregisterCustomEvmNetwork } = await addNetwork();
        store.clearActions();

        await store.dispatch(removeCustomEvmNetworkThunk({ symbol }));

        const removedAccounts = store
            .getActions()
            .filter(accountsActions.removeAccount.match)
            .flatMap(action => action.payload);
        expect(removedAccounts.map(account => account.symbol)).toEqual([symbol]);

        const { settings, blockchain } = store.getState().wallet;
        expect(settings.customEvmNetworks).toEqual([]);
        expect(settings.enabledNetworks).not.toContain(symbol);
        expect(asOpenState(blockchain)[symbol]).toBeUndefined();
        expect(unregisterCustomEvmNetwork).toHaveBeenCalledWith(symbol);
        expect(isNetworkSymbol(symbol)).toBe(false);
        expect(getSupportedNetworks()).not.toContain(symbol);
    });

    it('cancels the pending account sync of the removed network', async () => {
        const { store } = await addNetwork();
        // A plain number keeps the serializability check quiet, unlike Node's Timeout object.
        const timeout = 42 as unknown as TimerId;
        store.dispatch(blockchainActions.synced({ symbol, timeout }));
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        await store.dispatch(removeCustomEvmNetworkThunk({ symbol }));

        expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
    });

    it('ignores a network that was not added by the user', async () => {
        const { store, unregisterCustomEvmNetwork } = initStore();

        await store.dispatch(removeCustomEvmNetworkThunk({ symbol: asNetworkSymbol('eth') }));

        expect(unregisterCustomEvmNetwork).not.toHaveBeenCalled();
        expect(isNetworkSymbol(asNetworkSymbol('eth'))).toBe(true);
        expect(store.getActions().map(action => action.type)).not.toContain(
            customEvmNetworksActions.unregistered.type,
        );
    });
});
