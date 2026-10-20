import {
    registerLegacyNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/legacy-network-config';
import { createMockDeps } from '@trezor/dependency-injection';
import { buildCustomEvmNetworkConfig } from '@trezor/network-ethereum-suite-common';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { asNetworkSymbol } from './NetworkModules';
import {
    type NetworksCompositionRootDeps,
    createNetworksCompositionRoot,
} from './createNetworksCompositionRoot';
import { type NetworkMetadata } from '../reduxState/NetworkMetadata';
import { networksActions } from '../reduxState/networksReducer';

const symbol = asNetworkSymbol('evm4242');
const params = {
    chainId: 4242,
    name: 'Custom Chain',
    displaySymbol: 'CST',
    explorerUrl: 'https://explorer.custom.example',
    testnet: false,
};

const createNetworks = () => {
    const { actions, dispatch } = createMockDispatch({ getState: () => ({}) });
    const deps = createMockDeps<NetworksCompositionRootDeps>({
        getTrezorConnect: null,
        dispatch,
    });

    return { actions, networks: createNetworksCompositionRoot(deps) };
};

const getDispatchedMetadata = (actions: unknown[]) => {
    const action = actions.at(-1);

    if (!networksActions.setNetworks.match(action)) {
        throw new Error('setNetworks was not dispatched');
    }

    return action.payload as readonly NetworkMetadata[];
};

describe('custom EVM network registration', () => {
    it('makes a registered network usable and publishes it to Redux', () => {
        const { actions, networks } = createNetworks();

        networks.registerCustomEvmNetwork({ symbol, ...params });

        expect(networks.isSupportedNetwork(symbol)).toBe(true);
        expect(networks.getAccountSyncInterval(symbol)).toBe(60_000);
        expect(
            networks.addressValidator.isAddressValid(
                '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
                symbol,
            ),
        ).toBe(true);
        expect(getDispatchedMetadata(actions).find(n => n.symbol === symbol)).toEqual(
            expect.objectContaining({ chainId: 4242, name: 'Custom Chain' }),
        );
    });

    it('removes an unregistered network from Redux and the repository', () => {
        const { actions, networks } = createNetworks();

        networks.registerCustomEvmNetwork({ symbol, ...params });
        networks.unregisterCustomEvmNetwork(symbol);

        expect(networks.isSupportedNetwork(symbol)).toBe(false);
        expect(getDispatchedMetadata(actions).some(n => n.symbol === symbol)).toBe(false);
    });

    it('loads networks restored into the legacy registry before the repository existed', () => {
        registerLegacyNetwork(symbol, {
            ...buildCustomEvmNetworkConfig(params),
            symbol,
            yieldXyzId: null,
        });

        try {
            const { actions, networks } = createNetworks();

            expect(networks.isSupportedNetwork(symbol)).toBe(false);

            networks.loadNetworkModules();

            expect(networks.isSupportedNetwork(symbol)).toBe(true);
            expect(getDispatchedMetadata(actions).some(n => n.symbol === symbol)).toBe(true);
        } finally {
            unregisterLegacyNetwork(symbol);
        }
    });
});
