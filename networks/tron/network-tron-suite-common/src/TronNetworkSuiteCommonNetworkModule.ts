import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import {
    type TronNetworkSymbol,
    isSupportedTronNetwork,
    supportedTronNetworks,
} from '@trezor/network-tron/constants';

import { tronIcon } from '../icons';
import { tronValidator } from './addressValidator/tronAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type TronNetworkSuiteCommonNetworkModule = SuiteCommonNetworkModule<TronNetworkSymbol>;

export const createTronSuiteCommonNetworkModule = (): TronNetworkSuiteCommonNetworkModule => ({
    icon: tronIcon,
    addressValidator: tronValidator,
    getSupportedNetworks: () => supportedTronNetworks,
    isSupportedNetwork: isSupportedTronNetwork,
    getNetworkConfig,
});
