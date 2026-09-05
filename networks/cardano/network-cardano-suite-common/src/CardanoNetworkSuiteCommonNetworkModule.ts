import {
    type CardanoNetworkSymbol,
    isSupportedCardanoNetwork,
    supportedCardanoNetworks,
} from '@trezor/network-cardano/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type CardanoNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<CardanoNetworkSymbol>;

const isTestnet = (symbol: CardanoNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createCardanoSuiteCommonNetworkModule =
    (): CardanoNetworkSuiteCommonNetworkModule => ({
        addressValidator: adaValidator,
        getSupportedNetworks: () => supportedCardanoNetworks,
        isSupportedNetwork: isSupportedCardanoNetwork,
        isTestnet,
        getNetworkConfig,
    });
