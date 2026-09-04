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

const isTestnet = (symbol: EthereumNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createEthereumSuiteCommonNetworkModule =
    (): EthereumNetworkSuiteCommonNetworkModule => ({
        addressValidator: ethereumValidator,
        namedAddressResolver: ethereumNamedAddressResolver,
        getSupportedNetworks: () => supportedEthereumNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
        isTestnet,
        getNetworkConfig,
    });
