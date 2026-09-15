import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { supportedRippleNetworks } from '@trezor/network-ripple/constants';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getNetworkConfig } from './networkConfig';

export const createRippleSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedRippleNetworks, {
        addressValidator: rippleValidator,
        getNetworkConfig,
    });
