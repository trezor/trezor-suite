import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { tronValidator } from './addressValidator/tronAddressValidator';
import {
    type TronNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type TronNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<TronNetworkSymbol>;

export const createTronSuiteCommonNetworkModule = (): TronNetworkSuiteCommonNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
