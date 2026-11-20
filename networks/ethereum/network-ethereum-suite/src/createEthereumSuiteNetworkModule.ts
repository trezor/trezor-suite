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
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

import { createEthereumSignVerifyComponent } from './signVerify/createEthereumSignVerifyComponent';

export type EthereumSuiteNetworkModuleDeps = EthereumSuiteCommonNetworkModuleDeps &
    SignEthereumMessageDeps &
    VerifyEthereumMessageDeps &
    SignVerifyReporterDep;

export type EthereumSuiteNetworkModule = SuiteNetworkModule<EthereumSuiteCommonNetworkModule>;

export const createEthereumSuiteNetworkModule = (
    deps: EthereumSuiteNetworkModuleDeps,
): EthereumSuiteNetworkModule => {
    const signEthereumMessage = createSignEthereumMessage(deps);
    const verifyEthereumMessage = createVerifyEthereumMessage(deps);

    return createNetworkModuleSuite(
        createEthereumSuiteCommonNetworkModule(deps),
        supportedEthereumNetworks,
        {
            signVerify: {
                Component: createEthereumSignVerifyComponent({
                    signEthereumMessage,
                    verifyEthereumMessage,
                    signVerifyReporter: deps.signVerifyReporter,
                }),
                title: 'TR_NAV_SIGN_VERIFY',
            },
        },
    );
};
