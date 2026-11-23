import type { NetworkModule } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import type { SuiteNetworkModule } from './SuiteNetworkModule';

export const createNetworkModuleSuite = <
    TSuiteCommonNetworkModule extends Pick<NetworkModule<string>, 'getSupportedNetworks'>,
>(
    common: TSuiteCommonNetworkModule,
): SuiteNetworkModule<TSuiteCommonNetworkModule> => ({
    getSupportedNetworks: () => asNetworkSymbols(common.getSupportedNetworks()),
    getCommon: () => common,
});
