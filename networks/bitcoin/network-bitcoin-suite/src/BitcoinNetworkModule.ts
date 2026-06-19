import type { NetworkModule } from '@network-module/suite-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';

export const createBitcoinNetworkModule = (): NetworkModule => ({
    addressValidator: bitcoinValidator,
});
