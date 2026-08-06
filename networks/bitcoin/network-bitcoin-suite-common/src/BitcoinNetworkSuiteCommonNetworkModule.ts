import {
    type BitcoinNetworkSymbol,
    isSupportedBitcoinNetwork,
    supportedBitcoinNetworks,
} from '@trezor/network-bitcoin/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { bitcoinValidator } from './addressValidator/bitcoinAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type BitcoinNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<BitcoinNetworkSymbol>;

export const createBitcoinSuiteCommonNetworkModule =
    (): BitcoinNetworkSuiteCommonNetworkModule => ({
        addressValidator: bitcoinValidator,
        getSupportedNetworks: () => supportedBitcoinNetworks,
        isSupportedNetwork: isSupportedBitcoinNetwork,
        getNetworkConfig,
    });
