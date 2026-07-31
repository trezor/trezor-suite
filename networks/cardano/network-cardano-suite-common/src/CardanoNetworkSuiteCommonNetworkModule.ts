import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getNetworkColor } from './networkColor';
import {
    type CardanoNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type CardanoNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<CardanoNetworkSymbol>;

export const createCardanoSuiteCommonNetworkModule =
    (): CardanoNetworkSuiteCommonNetworkModule => ({
        addressValidator: adaValidator,
        getSupportedNetworks,
        isSupportedNetwork,
        getNetworkColor,
    });
