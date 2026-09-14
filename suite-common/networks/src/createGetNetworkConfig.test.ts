import { createMockDeps } from '@suite-common/dependency-injection';

import { type GetNetworkConfigDeps, createGetNetworkConfig } from './createGetNetworkConfig';
import { mockNetworkMetadata } from '../mocks/mockNetworkMetadata';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

it('reads configuration from the injected module for each lookup', () => {
    const { symbol, ...config } = { ...mockNetworkMetadata.btc, name: 'Injected Bitcoin' };
    const deps = createMockDeps<GetNetworkConfigDeps>({
        networkModuleRepository: {
            get: () => mockNetworkModule({ getNetworkConfig: () => config }),
            getSupportedNetworks: null,
            isSupportedNetwork: null,
        },
    });

    expect(createGetNetworkConfig(deps)('btc')).toEqual({ ...config, symbol });
    expect(deps.networkModuleRepository.get).toHaveBeenCalledWith('btc');
});

it('keeps a network configuration stable within one injected service', () => {
    const deps = createMockDeps<GetNetworkConfigDeps>({
        networkModuleRepository: {
            get: () => mockNetworkModule(),
            getSupportedNetworks: null,
            isSupportedNetwork: null,
        },
    });
    const getNetworkConfig = createGetNetworkConfig(deps);

    expect(getNetworkConfig('btc')).toBe(getNetworkConfig('btc'));
});
