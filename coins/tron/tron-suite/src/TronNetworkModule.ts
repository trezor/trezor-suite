import type { NetworkModule } from '@network-module/suite-types';

import { tronValidator } from './addressValidator/tronAddressValidator';

export const createTronNetworkModule = (): NetworkModule => ({
    addressValidator: tronValidator,
});
