import { createMockDeps } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { mockNetworkIcon } from './mockNetworkIcon';
import { getMockNetworkMetadata, mockNetworkMetadata } from './mockNetworkMetadata';
import { mockNetworkModule } from './mockNetworkModule';
import { mockNetworkModuleRepository } from './mockNetworkModuleRepository';
import type { NetworksServices } from '../src/NetworksServices';

export const mockNetworksServices = (
    overrides: Partial<NetworksServices> = {},
): NetworksServices => {
    const supportedNetworks = Object.values(mockNetworkMetadata).map(network => network.symbol);
    const networkModule = mockNetworkModule({
        getSupportedNetworks: () => supportedNetworks,
        getNetworkConfig: getMockNetworkMetadata,
    });
    const networkModuleRepository =
        overrides.networkModuleRepository ??
        mockNetworkModuleRepository({
            get: symbol => {
                getMockNetworkMetadata(symbol);

                return networkModule;
            },
            getSupportedNetworks: () => supportedNetworks,
            isSupportedNetwork: (symbol): symbol is NetworkSymbol =>
                supportedNetworks.some(candidate => candidate === symbol),
        });

    return createMockDeps<NetworksServices>({
        networkIcon:
            overrides.networkIcon ??
            mockNetworkIcon({
                hasCryptoIcon: networkModuleRepository.isSupportedNetwork,
                hasNetworkIcon: networkModuleRepository.isSupportedNetwork,
            }),
        networkModuleRepository,
        getNetworkConfig: overrides.getNetworkConfig ?? getMockNetworkMetadata,
        isSupportedNetwork:
            overrides.isSupportedNetwork ?? networkModuleRepository.isSupportedNetwork,
        isWrappedNativeToken: overrides.isWrappedNativeToken ?? (() => false),
        getIconPaths: overrides.getIconPaths ?? null,
        addressValidator: overrides.addressValidator ?? {
            isAddressValid: null,
            getAddressType: null,
        },
        getAccountSyncInterval: overrides.getAccountSyncInterval ?? null,
        getNamedAddressSupport: overrides.getNamedAddressSupport ?? null,
        getNetworkByCoingeckoId: overrides.getNetworkByCoingeckoId ?? null,
        loadNetworkModules: overrides.loadNetworkModules ?? null,
        registerCustomEvmNetwork: overrides.registerCustomEvmNetwork ?? null,
        unregisterCustomEvmNetwork: overrides.unregisterCustomEvmNetwork ?? null,
    });
};
