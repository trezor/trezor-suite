import { type SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { mockNetworkMetadata } from './mockNetworkMetadata';

export const mockNetworkModule = (
    overrides: Partial<SuiteCommonNetworkModule> = {},
): SuiteCommonNetworkModule => ({
    addressValidator: {
        isAddressValid: () => false,
        getAddressType: () => undefined,
    },
    getSupportedNetworks: () => [],
    getNetworkConfig: () => ({ ...mockNetworkMetadata.btc, color: '#000000', protocols: [] }),
    ...overrides,
});
