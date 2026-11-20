import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type EthereumSuiteCommonNetworkModule,
    type EthereumSuiteCommonNetworkModuleDeps,
    type SignEthereumMessageDeps,
    type VerifyEthereumMessageDeps,
    createEthereumSuiteCommonNetworkModule,
    createSignEthereumMessage,
    createVerifyEthereumMessage,
} from '@trezor/network-ethereum-suite-common';
import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

import { createEthereumSignVerifyComponent } from './signVerify/createEthereumSignVerifyComponent';

export type EthereumSuiteNativeNetworkModuleDeps = EthereumSuiteCommonNetworkModuleDeps &
    SignEthereumMessageDeps &
    VerifyEthereumMessageDeps &
    SignVerifyReporterDep;

export type EthereumSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<EthereumSuiteCommonNetworkModule>;

export const createEthereumSuiteNativeNetworkModule = (
    deps: EthereumSuiteNativeNetworkModuleDeps,
): EthereumSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createEthereumSuiteCommonNetworkModule(deps),
        supportedEthereumNetworks,
        {
            signVerify: {
                Component: createEthereumSignVerifyComponent({
                    signEthereumMessage: createSignEthereumMessage(deps),
                    verifyEthereumMessage: createVerifyEthereumMessage(deps),
                    signVerifyReporter: deps.signVerifyReporter,
                }),
            },
        },
    );
