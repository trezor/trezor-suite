import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedCardanoNetworks, {
        addressValidator: adaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
