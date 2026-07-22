import type { NetworkModule } from '@trezor/network-module-suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import {
    type BitcoinSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type BitcoinNetworkModule = NetworkModule<BitcoinSupportedNetwork>;

export const createBitcoinNetworkModule = (): BitcoinNetworkModule => ({
    addressValidator: bitcoinValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
