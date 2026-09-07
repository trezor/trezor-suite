import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type {
    NetworkSuiteCommonModuleApi,
    SuiteCommonNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { ethereumValidator } from './addressValidator/ethereumAddressValidator';
import { createEthereumNamedAddressResolver } from './namedAddress/ethereumNamedAddressResolver';
import { getNetworkConfig } from './networkConfig';

export type EthereumNetworkSuiteCommonNetworkModule =
    SuiteCommonNetworkModule<EthereumNetworkSymbol>;

type EthereumSuiteCommonNetworkModule = EthereumNetworkSuiteCommonNetworkModule;
type EthereumSuiteCommonNetworkModuleDeps = NetworkSuiteCommonModuleApi;

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
