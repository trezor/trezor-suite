import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { getNetworkColor } from './networkColor';
import {
    type RippleNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type RippleNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<RippleNetworkSymbol>;

export const createRippleSuiteCommonNetworkModule = (): RippleNetworkSuiteCommonNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedNetworks,
    isSupportedNetwork,
    getNetworkColor,
});
