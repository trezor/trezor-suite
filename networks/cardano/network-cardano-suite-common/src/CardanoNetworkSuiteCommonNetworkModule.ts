import type { NetworkModule } from '@trezor/network-module-suite-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import {
    type CardanoNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type CardanoNetworkSuiteCommonNetworkModule = NetworkModule<CardanoNetworkSymbol>;

export const createCardanoSuiteCommonNetworkModule =
    (): CardanoNetworkSuiteCommonNetworkModule => ({
        addressValidator: adaValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
