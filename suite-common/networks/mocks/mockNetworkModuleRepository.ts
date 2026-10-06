import { type NetworkModuleRepository, type NetworkSymbol } from '../src';

export const mockNetworkModuleRepository = (
    overrides: Partial<NetworkModuleRepository> = {},
): NetworkModuleRepository => ({
    get: () => {
        throw new Error('Network module repository mock is not implemented.');
    },
    getSupportedNetworks: () => [],
    isSupportedNetwork: (_symbol: string): _symbol is NetworkSymbol => false,
    ...overrides,
});
