import {
    type CardanoNetworkSymbol,
    isSupportedCardanoNetwork,
    supportedCardanoNetworks,
} from '@trezor/network-cardano/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { cardanoIcon } from '../icons';
import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type CardanoNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<CardanoNetworkSymbol>;

export const createCardanoSuiteCommonNetworkModule =
    (): CardanoNetworkSuiteCommonNetworkModule => ({
        icon: cardanoIcon,
        addressValidator: adaValidator,
        getSupportedNetworks: () => supportedCardanoNetworks,
        isSupportedNetwork: isSupportedCardanoNetwork,
        getNetworkConfig,
    });
