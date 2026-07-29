import type { NetworkModule } from '@trezor/network-module-suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import {
    type RippleNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type RippleNetworkSuiteCommonNetworkModule = NetworkModule<RippleNetworkSymbol>;

export const createRippleSuiteCommonNetworkModule = (): RippleNetworkSuiteCommonNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
