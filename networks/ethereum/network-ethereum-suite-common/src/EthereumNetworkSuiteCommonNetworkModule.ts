import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

export const createEthereumSuiteCommonNetworkModule =
    (): EthereumNetworkSuiteCommonNetworkModule => ({
        addressValidator: ethereumValidator,
        getSupportedNetworks,
        isSupportedNetwork,
    });
