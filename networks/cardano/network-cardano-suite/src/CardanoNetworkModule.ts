import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';

export const createCardanoNetworkModule = (): NetworkModule => ({
    addressValidator: adaValidator,
});
