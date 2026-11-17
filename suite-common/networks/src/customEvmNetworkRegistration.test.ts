import {
    networks as legacyNetworks,
    registerLegacyNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/legacy-network-config';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import { createNetworksCompositionRoot } from './createNetworksCompositionRoot';
import { mockCreateCustomEvmNetworkModule } from '../mocks/mockCreateCustomEvmNetworkModule';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';
import { mockNetworkModule } from '../mocks/mockNetworkModule';
import { type NetworkMetadata } from '../reduxState/NetworkMetadata';
import { networksActions } from '../reduxState/networksReducer';

const symbol = asNetworkSymbol('evm4242');
const config = { ...mockNetworkMetadata.eth, chainId: 4242, name: 'Custom Chain' };

// Read before any test registers a custom network, which lands in the same registry.
const predefinedSymbols = Object.keys(legacyNetworks).map(asNetworkSymbol);

// Stands in for the modules the application roots compose, one per network the build ships with.
const createPredefinedNetworkModule = () =>
    mockNetworkModule({ getSupportedNetworks: () => predefinedSymbols });

const createNetworks = () => {
    const { actions, dispatch } = createMockDispatch({ getState: () => ({}) });
    const createCustomEvmNetworkModule = mockCreateCustomEvmNetworkModule();
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: [createPredefinedNetworkModule()],
    });

    return {
        actions,
        createCustomEvmNetworkModule,
        networks: createNetworksCompositionRoot({
            networkModuleRepository,
            createCustomEvmNetworkModule,
            dispatch,
        }),
    };
};

const getDispatchedMetadata = (actions: unknown[]) => {
    const action = actions.at(-1);

    if (!networksActions.setNetworks.match(action)) {
        throw new Error('setNetworks was not dispatched');
    }

    return action.payload as readonly NetworkMetadata[];
};

describe('custom EVM network registration', () => {
    it('registers the module the application root builds and publishes it to Redux', () => {
        const { actions, createCustomEvmNetworkModule, networks } = createNetworks();

        networks.registerCustomEvmNetwork({ symbol, config });

        expect(createCustomEvmNetworkModule).toHaveBeenCalledWith({ symbol, config });
        expect(networks.isSupportedNetwork(symbol)).toBe(true);
        expect(getDispatchedMetadata(actions).find(n => n.symbol === symbol)).toEqual(
            expect.objectContaining({ chainId: 4242, name: 'Custom Chain' }),
        );
    });

    it('removes an unregistered network from Redux and the repository', () => {
        const { actions, networks } = createNetworks();

        networks.registerCustomEvmNetwork({ symbol, config });
        networks.unregisterCustomEvmNetwork(symbol);

        expect(networks.isSupportedNetwork(symbol)).toBe(false);
        expect(getDispatchedMetadata(actions).some(n => n.symbol === symbol)).toBe(false);
    });

    it('loads networks restored into the legacy registry before the repository existed', () => {
        registerLegacyNetwork(symbol, { ...config, symbol, yieldXyzId: null });

        try {
            const { actions, createCustomEvmNetworkModule, networks } = createNetworks();

            expect(networks.isSupportedNetwork(symbol)).toBe(false);

            networks.loadNetworkModules();

            expect(createCustomEvmNetworkModule).toHaveBeenCalledTimes(1);
            expect(createCustomEvmNetworkModule).toHaveBeenCalledWith(
                expect.objectContaining({ symbol }),
            );
            expect(networks.isSupportedNetwork(symbol)).toBe(true);
            expect(getDispatchedMetadata(actions).some(n => n.symbol === symbol)).toBe(true);
        } finally {
            unregisterLegacyNetwork(symbol);
        }
    });
});
