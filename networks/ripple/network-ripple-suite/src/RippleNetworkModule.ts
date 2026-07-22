import type { NetworkModule } from '@trezor/network-module-suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';
import { type RippleSupportedCoin, getSupportedCoins, isSupportedCoin } from './supportedCoins';

export type RippleNetworkModule = NetworkModule<RippleSupportedCoin>;

export const createRippleNetworkModule = (): RippleNetworkModule => ({
    addressValidator: rippleValidator,
    getSupportedCoins,
    isSupportedCoin,
});
