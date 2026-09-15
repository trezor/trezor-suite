import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type RippleNetworkSymbol,
    isSupportedRippleNetwork,
    supportedRippleNetworks,
} from '@trezor/network-ripple/constants';

import { rippleIcon } from '../icons';
import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type RippleNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<RippleNetworkSymbol>;

export const createRippleSuiteCommonNetworkModule = (): RippleNetworkSuiteCommonNetworkModule => ({
    icon: rippleIcon,
    addressValidator: rippleValidator,
    getSupportedNetworks: () => supportedRippleNetworks,
    isSupportedNetwork: isSupportedRippleNetwork,
    getNetworkConfig,
});
