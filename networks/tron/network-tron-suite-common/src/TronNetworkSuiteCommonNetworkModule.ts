import type { NetworkModule } from '@trezor/network-module-suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import {
    type TronNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type TronNetworkSuiteCommonNetworkModule = NetworkModule<TronNetworkSymbol>;

export const createTronSuiteCommonNetworkModule = (): TronNetworkSuiteCommonNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
