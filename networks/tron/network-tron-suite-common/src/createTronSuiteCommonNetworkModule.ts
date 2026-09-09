import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type TronNetworkSymbol,
    isSupportedTronNetwork,
    supportedTronNetworks,
} from '@trezor/network-tron/constants';

import { tronValidator } from './addressValidator/tronAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type TronNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<TronNetworkSymbol>;

const isTestnet = (symbol: TronNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createTronSuiteCommonNetworkModule = (): TronNetworkSuiteCommonNetworkModule => ({
    addressValidator: tronValidator,
    getSupportedNetworks: () => supportedTronNetworks,
    isSupportedNetwork: isSupportedTronNetwork,
    isTestnet,
    getNetworkConfig,
});
