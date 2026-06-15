import type { NetworkModule } from '@trezor/network-module-suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import {
    type RippleNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type RippleNetworkModule = NetworkModule<RippleNetworkSymbol>;

export const createRippleNetworkModule = (): RippleNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
