import type { NetworkModule } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';

export type RippleNetworkModule = NetworkModule;

export const createRippleNetworkModule = (): RippleNetworkModule => ({
    addressValidator: rippleValidator,
});
