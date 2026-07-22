import type { NetworkModule } from '@trezor/network-module-suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import {
    type TronSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type TronNetworkModule = NetworkModule<TronSupportedNetwork>;

export const createTronNetworkModule = (): TronNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
