import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import type { SuiteNativeNetworkModule } from './SuiteNativeNetworkModule';

export const createNetworkModuleSuiteNative = <
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule,
>(
    common: TSuiteCommonNetworkModule,
): SuiteNativeNetworkModule<TSuiteCommonNetworkModule> => ({
    getSupportedNetworks: common.getSupportedNetworks,
    getCommon: () => common,
});
