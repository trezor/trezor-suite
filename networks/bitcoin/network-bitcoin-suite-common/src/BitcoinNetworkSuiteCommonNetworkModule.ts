import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getNetworkColor } from './networkColor';
import {
    type BitcoinNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type BitcoinNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<BitcoinNetworkSymbol>;

export const createBitcoinSuiteCommonNetworkModule =
    (): BitcoinNetworkSuiteCommonNetworkModule => ({
        addressValidator: bitcoinValidator,
        getSupportedNetworks,
        isSupportedNetwork,
        getNetworkColor,
    });
