import type { NetworkModule } from '@network-module/suite-types';

import { stellarValidator } from './addressValidator/stellarAddressValidator';

export type StellarNetworkModule = NetworkModule;

export const createStellarNetworkModule = (): StellarNetworkModule => ({
    addressValidator: stellarValidator,
});
