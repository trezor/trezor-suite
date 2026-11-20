import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type CardanoSuiteCommonNetworkModule,
    type SignCardanoMessageDeps,
    createCardanoSuiteCommonNetworkModule,
    createSignCardanoMessage,
} from '@trezor/network-cardano-suite-common';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

import { createCardanoSignVerifyComponent } from './signVerify/createCardanoSignVerifyComponent';

export type CardanoSuiteNetworkModuleDeps = SignCardanoMessageDeps & SignVerifyReporterDep;

export type CardanoSuiteNetworkModule = SuiteNetworkModule<CardanoSuiteCommonNetworkModule>;

export const createCardanoSuiteNetworkModule = (
    deps: CardanoSuiteNetworkModuleDeps,
): CardanoSuiteNetworkModule => {
    const signCardanoMessage = createSignCardanoMessage(deps);

    return createNetworkModuleSuite(
        createCardanoSuiteCommonNetworkModule(),
        supportedCardanoNetworks,
        {
            signVerify: {
                Component: createCardanoSignVerifyComponent({
                    signCardanoMessage,
                    signVerifyReporter: deps.signVerifyReporter,
                }),
                title: 'TR_SIGN_MESSAGE',
            },
        },
    );
};
