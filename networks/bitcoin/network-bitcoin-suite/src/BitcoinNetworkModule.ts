import type { NetworkModule } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';

export type BitcoinNetworkModule = NetworkModule;

export const createBitcoinNetworkModule = (): BitcoinNetworkModule => ({
    addressValidator: bitcoinValidator,
});
