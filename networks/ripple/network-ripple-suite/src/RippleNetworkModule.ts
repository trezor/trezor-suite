import type { NetworkModule } from '@trezor/network-module-suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import {
    type RippleSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type RippleNetworkModule = NetworkModule<RippleSupportedNetwork>;

export const createRippleNetworkModule = (): RippleNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
