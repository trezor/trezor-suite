import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import type { SuiteNetworkModule } from './SuiteNetworkModule';

export const createNetworkModuleSuite = <
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule,
>(
    common: TSuiteCommonNetworkModule,
): SuiteNetworkModule<TSuiteCommonNetworkModule> => ({
    getSupportedNetworks: common.getSupportedNetworks,
    getCommon: () => common,
});
