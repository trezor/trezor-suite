import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';

export const createStellarNetworkModule = (): NetworkModule => ({
    addressValidator: stellarValidator,
});
