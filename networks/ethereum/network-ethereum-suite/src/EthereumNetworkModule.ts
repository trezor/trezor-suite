import type { NetworkModule } from '@network-module/suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';

export const createEthereumNetworkModule = (): NetworkModule => ({
    addressValidator: ethereumValidator,
});
