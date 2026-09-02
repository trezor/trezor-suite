import { type SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

export const mockNetworkModule = <TSymbol extends string>(
    overrides: Partial<SuiteCommonNetworkModule<TSymbol>> = {},
): SuiteCommonNetworkModule<TSymbol> => ({
    addressValidator: {
        isAddressValid: () => false,
        getAddressType: () => undefined,
    },
    getSupportedNetworks: () => [],
    isSupportedNetwork: (_symbol: string): _symbol is TSymbol => false,
    getNetworkConfig: () => ({ color: '#000000', protocols: [] }),
    ...overrides,
});
