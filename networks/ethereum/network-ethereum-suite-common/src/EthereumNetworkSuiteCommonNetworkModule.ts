import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { ethereumNamedAddressResolver } from './namedAddress/ethereumNamedAddressResolver';
import { getNetworkConfig } from './networkConfig';

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

export const createEthereumSuiteCommonNetworkModule =
    (): EthereumNetworkSuiteCommonNetworkModule => ({
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        getSupportedNetworks: () => supportedEthereumNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
        getNetworkConfig,
    });
