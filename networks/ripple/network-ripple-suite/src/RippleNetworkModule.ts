import type { NetworkModule } from '@network-module/suite-types';

import { rippleValidator } from './addressValidator/rippleAddressValidator';

export const createRippleNetworkModule = (): NetworkModule => ({
    addressValidator: rippleValidator,
});
