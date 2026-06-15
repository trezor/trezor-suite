import type { NetworkModule } from '@trezor/network-module-suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import {
    type CardanoNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type CardanoNetworkModule = NetworkModule<CardanoNetworkSymbol>;

export const createCardanoNetworkModule = (): CardanoNetworkModule => ({
    addressValidator: adaValidator,
    getSupportedNetworks,
    isSupportedNetwork,
});
