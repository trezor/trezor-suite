import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import {
    type EthereumNamedAddressResolverDeps,
    createEthereumNamedAddressResolver,
} from './namedAddress/createEthereumNamedAddressResolver';
import { getNetworkConfig } from './networkConfig';

type EthereumSuiteCommonNetworkModuleDeps = EthereumNamedAddressResolverDeps;

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

type EthereumSuiteCommonNetworkModule = EthereumNetworkSuiteCommonNetworkModule;

const isTestnet = (symbol: EthereumNetworkSymbol): boolean => getNetworkConfig(symbol).testnet;

export const createEthereumSuiteCommonNetworkModule = (
    deps: EthereumSuiteCommonNetworkModuleDeps,
): EthereumSuiteCommonNetworkModule => ({
    addressValidator: ethereumValidator,
    namedAddressResolver: createEthereumNamedAddressResolver(deps),
    getSupportedNetworks: () => supportedEthereumNetworks,
    isSupportedNetwork: isSupportedEthereumNetwork,
    isTestnet,
    getNetworkConfig,
});
