import {
    type EthereumSuiteCommonNetworkModule,
    type EthereumSuiteCommonNetworkModuleDeps,
    createEthereumSuiteCommonNetworkModule,
} from '@trezor/network-ethereum-suite-common';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

export type EthereumSuiteNativeNetworkModuleDeps = EthereumSuiteCommonNetworkModuleDeps;

export type EthereumSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<EthereumSuiteCommonNetworkModule>;

export const createEthereumSuiteNativeNetworkModule = (
    deps: EthereumSuiteNativeNetworkModuleDeps,
): EthereumSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(createEthereumSuiteCommonNetworkModule(deps));
