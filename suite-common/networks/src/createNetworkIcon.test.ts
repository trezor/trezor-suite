import { createMockDeps } from '@trezor/dependency-injection';
import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import {
    type NetworkIconDeps,
    createNetworkIcon,
    injectGetCryptoIcon,
    injectGetNetworkIcon,
    injectGetTokenLogoIdentifiers,
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
            getSupportedNetworks: () => [symbol],
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
    expect(networkIcon.hasCryptoIcon(symbol)).toBe(true);
    expect(networkIcon.hasCryptoIcon('unknown')).toBe(false);
    expect(networkIcon.hasNetworkIcon).toBe(deps.networkModuleRepository.isSupportedNetwork);
});

it('exposes the composed icon dependency through its injectors', () => {
    const networks = createNetworksCompositionRoot(
        createMockDeps<NetworksCompositionRootDeps>({ getTrezorConnect: null, dispatch: null }),
    );

    expect(injectNetworkIcon({ networks }).networkIcon).toBe(networks.networkIcon);
    expect(injectGetCryptoIcon({ networks }).getCryptoIcon).toBe(
        networks.networkIcon.getCryptoIcon,
    );
    expect(injectGetNetworkIcon({ networks }).getNetworkIcon).toBe(
        networks.networkIcon.getNetworkIcon,
    );
    expect(injectGetTokenLogoIdentifiers({ networks }).getTokenLogoIdentifiers).toBe(
        networks.networkIcon.getTokenLogoIdentifiers,
    );
    expect(injectHasNetworkIcon({ networks }).hasNetworkIcon).toBe(
        networks.networkIcon.hasNetworkIcon,
    );
});

it.each([
    { input: 'bsc', expected: 'bsc' },
    { input: 'eth', expected: 'eth' },
    { input: 'op', expected: 'op' },
    { input: 'BNB', expected: undefined },
    { input: 'bnb', expected: undefined },
    { input: 'BSC', expected: undefined },
    { input: 'ETH', expected: undefined },
    { input: 'unknown', expected: undefined },
])('resolves crypto icon $input through the service', ({ input, expected }) => {
    const supportedNetworks = [
        asNetworkSymbol('op'),
        asNetworkSymbol('bsc'),
        asNetworkSymbol('eth'),
    ];
    const icon = createMockDeps<NetworkAssetsModule>({
        getIcons: symbol => ({ coin: `${symbol}.svg`, network: `${symbol}-network.svg` }),
        getIconPaths: null,
        getTokenLogoIdentifiers: null,
    });
    const networkModule = mockNetworkModule({ icon });
    const deps = createMockDeps<NetworkIconDeps>({
        networkModuleRepository: {
            get: () => networkModule,
            getSupportedNetworks: () => supportedNetworks,
            isSupportedNetwork: (value): value is NetworkSymbol =>
                supportedNetworks.some(symbol => symbol === value),
        },
    });
    const networkIcon = createNetworkIcon(deps);

    expect(networkIcon.getCryptoIcon(asNetworkSymbol(input))).toBe(
        expected ? `${expected}.svg` : undefined,
    );
    expect(networkIcon.hasCryptoIcon(input)).toBe(expected !== undefined);
    if (expected) {
        expect(icon.getIcons).toHaveBeenCalledWith(asNetworkSymbol(expected));
    } else {
        expect(icon.getIcons).not.toHaveBeenCalled();
    }
});
