import type { NetworkModule } from '@trezor/network-module-suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import {
    type TronNetworkSymbol,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type TronNetworkModule = NetworkModule<TronNetworkSymbol>;

export const createTronNetworkModule = (): TronNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
