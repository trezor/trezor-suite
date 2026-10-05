import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';
import { rippleAssets } from '@trezor/network-ripple-assets';
import { supportedRippleNetworks } from '@trezor/network-ripple-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { createRippleIcon } from './createRippleIcon';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createRippleSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedRippleNetworks, {
        icon: createRippleIcon({ rippleAssets }),
        addressValidator: rippleValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
