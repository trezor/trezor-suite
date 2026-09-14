import { createMockDeps } from '@suite-common/dependency-injection';

import { type NetworkSymbol, asNetworkSymbol } from './NetworkModules';
import { type GetNetworkConfigsDeps, createGetNetworkConfigs } from './createGetNetworkConfigs';
import { type MockNetworkSymbol, mockNetworkMetadata } from '../mocks/mockNetworkMetadata';

it('loads only registered networks and takes their metadata from the module', () => {
    const config = { ...mockNetworkMetadata.btc, name: 'Registered Bitcoin' };
    const deps = createMockDeps<GetNetworkConfigsDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => [asNetworkSymbol('btc')],
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: () => config,
    });

    expect(createGetNetworkConfigs(deps)()).toEqual([config]);
});

it('preserves display order without mutating registered networks on Hermes', () => {
    const supportedNetworks: NetworkSymbol[] = [asNetworkSymbol('eth'), asNetworkSymbol('btc')];
    Object.defineProperty(supportedNetworks, 'toSorted', { value: undefined });
    Object.freeze(supportedNetworks);

    const deps = createMockDeps<GetNetworkConfigsDeps>({
        networkModuleRepository: {
            getSupportedNetworks: () => supportedNetworks,
            get: null,
            isSupportedNetwork: null,
        },
        getNetworkConfig: symbol => mockNetworkMetadata[symbol as MockNetworkSymbol],
    });

    expect(createGetNetworkConfigs(deps)().map(network => network.symbol)).toEqual(['btc', 'eth']);
});
