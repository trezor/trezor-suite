import { type SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { mockNetworkMetadata } from './mockNetworkMetadata';

export const mockNetworkModule = <TSymbol extends string>(
    overrides: Partial<SuiteCommonNetworkModule<TSymbol>> = {},
): SuiteCommonNetworkModule<TSymbol> => ({
    addressValidator: {
        isAddressValid: () => false,
        getAddressType: () => undefined,
    },
    getSupportedNetworks: () => [],
    isSupportedNetwork: (_symbol: string): _symbol is TSymbol => false,
    getNetworkConfig: () => ({ ...mockNetworkMetadata.btc, color: '#000000', protocols: [] }),
    ...overrides,
});
