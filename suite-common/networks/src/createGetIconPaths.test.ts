import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type GetIconPathsDeps, createGetIconPaths } from './createGetIconPaths';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

it('gets SVG paths from the module registered for the symbol', () => {
    const symbol = asNetworkSymbol('eth');
    const networkModule = mockNetworkModule();
    const deps = createMockDeps<GetIconPathsDeps>({
        networkModuleRepository: {
            get: () => networkModule,
            getSupportedNetworks: null,
            isSupportedNetwork: null,
        },
    });

    expect(createGetIconPaths(deps)(symbol)).toEqual({ coin: 'coin.svg', network: 'network.svg' });
    expect(deps.networkModuleRepository.get).toHaveBeenCalledWith(symbol);
    expect(networkModule.icon.getIconPaths).toHaveBeenCalledWith(symbol);
});
