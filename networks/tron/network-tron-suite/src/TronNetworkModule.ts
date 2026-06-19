import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';

export type TronNetworkModule = NetworkModule;

export const createTronNetworkModule = (): TronNetworkModule => ({
    addressValidator: tronValidator,
});
