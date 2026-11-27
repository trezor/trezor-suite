import { createMockDeps } from '@trezor/dependency-injection';

import { createNetworkModuleRepository } from './NetworkModuleRepository';
import { asNetworkSymbol } from './NetworkModules';
import {
    type GetAccountSyncIntervalDeps,
    createGetAccountSyncInterval,
    injectGetAccountSyncInterval,
} from './createGetAccountSyncInterval';
import { createNetworksCompositionRoot } from './createNetworksCompositionRoot';
import { mockCreateCustomEvmNetworkModule } from '../mocks/mockCreateCustomEvmNetworkModule';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

it('exposes the service through the networks composition root and injector', () => {
    const networks = createNetworksCompositionRoot({
        createCustomEvmNetworkModule: mockCreateCustomEvmNetworkModule(),
        networkModuleRepository: createNetworkModuleRepository({
            networkModules: [
                mockNetworkModule({
                    getSupportedNetworks: () => [asNetworkSymbol('sol')],
                    getAccountSyncInterval: () => 300_000,
                }),
            ],
        }),
        dispatch: action => action,
    });
    const { getAccountSyncInterval } = injectGetAccountSyncInterval({ networks });

    expect(getAccountSyncInterval).toBe(networks.getAccountSyncInterval);
    expect(getAccountSyncInterval(asNetworkSymbol('sol'))).toBe(300_000);
});

it('rejects a network without a registered module', () => {
    const networkModuleRepository = createNetworkModuleRepository({
        networkModules: [],
    });
    const getAccountSyncInterval = createGetAccountSyncInterval(
        createMockDeps<GetAccountSyncIntervalDeps>({ networkModuleRepository }),
    );

    expect(() => getAccountSyncInterval(asNetworkSymbol('unknown-network'))).toThrow(
        'Network module for unknown-network is not registered.',
    );
});
