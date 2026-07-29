import type { NetworkModule } from '@trezor/network-module-suite-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type EthereumNetworkSuiteCommonNetworkModule = NetworkModule<EthereumNetworkSymbol>;

export const createEthereumSuiteCommonNetworkModule =
    (): EthereumNetworkSuiteCommonNetworkModule => ({
        addressValidator: ethereumValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
