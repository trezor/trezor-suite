import {
    DEFAULT_ACCOUNT_SYNC_INTERVAL,
    type SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { mockNetworkMetadata } from './mockNetworkMetadata';

export const mockNetworkModule = (
    overrides: Partial<SuiteCommonNetworkModule> = {},
): SuiteCommonNetworkModule => ({
    addressValidator: {
        isAddressValid: () => false,
        getAddressType: () => undefined,
    },
    getSupportedNetworks: () => [],
    getAccountSyncInterval: () => DEFAULT_ACCOUNT_SYNC_INTERVAL,
    getNetworkConfig: () => ({ ...mockNetworkMetadata.btc, color: '#000000', protocols: [] }),
    ...overrides,
});
