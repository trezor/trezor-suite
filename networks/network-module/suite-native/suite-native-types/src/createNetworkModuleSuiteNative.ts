import type { NetworkModule } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import type { SuiteNativeNetworkModule } from './SuiteNativeNetworkModule';

export const createNetworkModuleSuiteNative = <
    TSuiteCommonNetworkModule extends Pick<NetworkModule<string>, 'getSupportedNetworks'>,
>(
    common: TSuiteCommonNetworkModule,
): SuiteNativeNetworkModule<TSuiteCommonNetworkModule> => ({
    getSupportedNetworks: () => asNetworkSymbols(common.getSupportedNetworks()),
    getCommon: () => common,
});
