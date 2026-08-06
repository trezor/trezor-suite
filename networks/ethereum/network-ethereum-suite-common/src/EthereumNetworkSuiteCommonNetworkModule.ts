import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { getNetworkConfig } from './networkConfig';

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

export const createEthereumSuiteCommonNetworkModule =
    (): EthereumNetworkSuiteCommonNetworkModule => ({
        addressValidator: ethereumValidator,
        getSupportedNetworks: () => supportedEthereumNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
        getNetworkConfig,
    });
