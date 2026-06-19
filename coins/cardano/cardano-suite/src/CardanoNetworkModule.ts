import type { NetworkModule } from '@network-module/suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';

export type CardanoNetworkModule = NetworkModule;

export const createCardanoNetworkModule = (): CardanoNetworkModule => ({
    addressValidator: adaValidator,
});
