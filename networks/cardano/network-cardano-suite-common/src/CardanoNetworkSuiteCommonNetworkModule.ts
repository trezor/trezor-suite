import { supportedCardanoNetworks } from '@trezor/network-cardano/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedCardanoNetworks, {
        addressValidator: adaValidator,
        getNetworkConfig,
    });
