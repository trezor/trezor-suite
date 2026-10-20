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
    type CustomEvmNetworkDefinition,
    type WalletSettings,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

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
import { prepareBlockchainReducer } from '../blockchain/blockchainReducer';
import { discoveryInitialState } from '../discovery/discoveryReducer';
import {
    initialWalletSettingsState,
    prepareWalletSettingsReducer,
} from '../settings/walletSettingsReducer';

const symbol = asNetworkSymbol('evm4242');
const definition: CustomEvmNetworkDefinition = {
    symbol,
    chainId: 4242,
    name: 'Custom Chain',
    displaySymbol: 'CST',
    currencyName: 'Custom Token',
    rpcUrls: ['https://rpc.custom.example', 'https://rpc2.custom.example'],
    explorerUrl: 'https://explorer.custom.example',
    testnet: false,
};

// The registry types are closed over the bundled symbols, so a custom symbol is read through an open view.
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

const mockConnect = ({ chainId = 4242, isRegistered = true } = {}) => {
    const getChainId = jest
        .spyOn(TrezorConnect, 'blockchainEvmRpcGetChainId')
        .mockResolvedValue({ success: true, payload: { chainId } });
    const register = jest.spyOn(TrezorConnect, 'blockchainRegisterEvmNetwork').mockResolvedValue(
        isRegistered
            ? { success: true, payload: { symbol: definition.symbol } }
            : {
                  success: false,
                  error: { code: 'Method_InvalidParameter', message: 'bundled' },
              },
    );
    const { updateConnectSettings } = wireEnabledNetworksMock();

    return { getChainId, register, updateConnectSettings };
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
        expect(getChainId).toHaveBeenCalledWith({ url: 'https://rpc.custom.example' });
    });

    it('registers the network everywhere, stores it and enables it', async () => {
        const { register, updateConnectSettings } = mockConnect();
        const { store, registerCustomEvmNetwork } = initStore();

        const result = await store.dispatch(addCustomEvmNetworkThunk({ definition }));

        expect(addCustomEvmNetworkThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toEqual(definition);
        expect(register).toHaveBeenCalledWith({
            symbol,
            name: 'Custom Chain',
            chainId: 4242,
            rpcUrls: definition.rpcUrls,
            testnet: false,
        });
        expect(registerCustomEvmNetwork).toHaveBeenCalledWith(definition);
        expect(updateConnectSettings).toHaveBeenCalledWith({ enabledNetworks: [{ coin: symbol }] });
        expect(getNetworkOptional(symbol)?.chainId).toBe(4242);
        expect(getSupportedNetworks()).toContain(symbol);

        const { settings, blockchain } = store.getState().wallet;
        expect(settings.customEvmNetworks).toEqual([definition]);
        expect(settings.enabledNetworks).toContain(symbol);
        expect(asOpenState(blockchain)[symbol]).toBeDefined();
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
        jest.spyOn(TrezorConnect, 'blockchainEvmRpcGetChainId').mockResolvedValue({
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
        jest.spyOn(TrezorConnect, 'blockchainEvmRpcGetChainId').mockRejectedValue(new Error('x'));
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

    it('leaves Suite untouched when Connect refuses the network', async () => {
        mockConnect({ isRegistered: false });
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
