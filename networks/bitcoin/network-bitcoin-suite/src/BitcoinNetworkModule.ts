import type { NetworkModule } from '@trezor/network-module-suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import {
    type BitcoinNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type BitcoinNetworkModule = NetworkModule<BitcoinNetworkSymbol>;

export const createBitcoinNetworkModule = (): BitcoinNetworkModule => ({
    addressValidator: bitcoinValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
