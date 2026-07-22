import type { NetworkModule } from '@trezor/network-module-suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import {
    type CardanoSupportedNetwork,
    getSupportedNetwork,
    isSupportedNetwork,
} from './supportedNetworks';

export type CardanoNetworkModule = NetworkModule<CardanoSupportedNetwork>;

export const createCardanoNetworkModule = (): CardanoNetworkModule => ({
    addressValidator: adaValidator,
    getSupportedNetwork,
    isSupportedNetwork,
});
