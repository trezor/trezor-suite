import { mock } from '@trezor/dependency-injection';
import type { NetworkIcon } from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export const mockNetworkIcon = (overrides: Partial<NetworkIcon> = {}): NetworkIcon => ({
    getIconPaths: mock<NetworkIcon['getIconPaths']>(() => ({
        coin: 'coin.svg',
        network: 'network.svg',
    })),
    getIcon: mock<NetworkIcon['getIcon']>(() => ({
        coin: 'coin.svg',
        network: 'network.svg',
        testnet: false,
    })),
    getCryptoIcon: mock<NetworkIcon['getCryptoIcon']>(() => 'coin.svg'),
    getNetworkIcon: mock<NetworkIcon['getNetworkIcon']>(() => 'network.svg'),
    hasCryptoIcon: mock<NetworkIcon['hasCryptoIcon']>(() => true),
    hasNetworkIcon: mock<NetworkIcon['hasNetworkIcon']>(
        (_symbol): _symbol is NetworkSymbol => true,
    ),
    isTestnetNetworkIcon: mock<NetworkIcon['isTestnetNetworkIcon']>(() => false),
    isWrappedNativeToken: mock<NetworkIcon['isWrappedNativeToken']>(() => false),
    getTokenLogoIdentifiers: mock<NetworkIcon['getTokenLogoIdentifiers']>(() => []),
    ...overrides,
});
