import type { NetworkModule } from '@trezor/network-module-suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import {
    type BitcoinNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type BitcoinNetworkSuiteCommonNetworkModule = NetworkModule<BitcoinNetworkSymbol>;

export const createBitcoinSuiteCommonNetworkModule =
    (): BitcoinNetworkSuiteCommonNetworkModule => ({
        addressValidator: bitcoinValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
