import { createMockDeps } from '@trezor/dependency-injection';
import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import {
    type NetworkIconDeps,
    createNetworkIcon,
    injectHasNetworkIcon,
    injectNetworkIcon,
} from './createNetworkIcon';
import {
    type NetworksCompositionRootDeps,
    createNetworksCompositionRoot,
} from './createNetworksCompositionRoot';
import { mockNetworkModule } from '../mocks/mockNetworkModule';

it.each([
    { coin: 'coin.svg', network: 'network.svg' },
    { coin: 1, network: 2 },
])('delegates icon and logo lookup without changing source $coin / $network', icons => {
    const symbol = asNetworkSymbol('eth');
    const icon = createMockDeps<NetworkAssetsModule>({
        getIcons: () => icons,
        getIconPaths: null,
        getTokenLogoIdentifiers: () => ['token-logo'],
    });
    const deps = createMockDeps<NetworkIconDeps>({
        networkModuleRepository: {
            get: () => mockNetworkModule({ icon }),
            getSupportedNetworks: null,
            isSupportedNetwork: (value): value is NetworkSymbol => value === symbol,
        },
    });
    const networkIcon = createNetworkIcon(deps);

    expect(networkIcon.getCryptoIcon(symbol)).toBe(icons.coin);
    expect(networkIcon.getNetworkIcon(symbol)).toBe(icons.network);
    expect(networkIcon.getTokenLogoIdentifiers(symbol, 'contract')).toEqual(['token-logo']);
    expect(deps.networkModuleRepository.get).toHaveBeenCalledWith(symbol);
    expect(icon.getIcons).toHaveBeenCalledWith(symbol);
    expect(icon.getTokenLogoIdentifiers).toHaveBeenCalledWith(symbol, 'contract');
    expect(networkIcon.hasCryptoIcon).toBe(deps.networkModuleRepository.isSupportedNetwork);
    expect(networkIcon.hasNetworkIcon).toBe(deps.networkModuleRepository.isSupportedNetwork);
});

it('exposes the composed icon dependency through its injectors', () => {
    const networks = createNetworksCompositionRoot(
        createMockDeps<NetworksCompositionRootDeps>({ getTrezorConnect: null, dispatch: null }),
    );

    expect(injectNetworkIcon({ networks }).networkIcon).toBe(networks.networkIcon);
    expect(injectHasNetworkIcon({ networks }).hasNetworkIcon).toBe(
        networks.networkIcon.hasNetworkIcon,
    );
});
