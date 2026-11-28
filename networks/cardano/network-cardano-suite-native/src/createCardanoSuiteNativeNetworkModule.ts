import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type CardanoSuiteCommonNetworkModule,
    type SignCardanoMessageDeps,
    createCardanoSuiteCommonNetworkModule,
    createSignCardanoMessage,
} from '@trezor/network-cardano-suite-common';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteNativeNetworkModule,
    createNetworkModuleSuiteNative,
} from '@trezor/network-module-suite-native-types';

import { createCardanoSignVerifyComponent } from './signVerify/createCardanoSignVerifyComponent';

export type CardanoSuiteNativeNetworkModuleDeps = SignCardanoMessageDeps & SignVerifyReporterDep;

export type CardanoSuiteNativeNetworkModule =
    SuiteNativeNetworkModule<CardanoSuiteCommonNetworkModule>;

export const createCardanoSuiteNativeNetworkModule = (
    deps: CardanoSuiteNativeNetworkModuleDeps,
): CardanoSuiteNativeNetworkModule =>
    createNetworkModuleSuiteNative(
        createCardanoSuiteCommonNetworkModule(),
        supportedCardanoNetworks,
        {
            signVerify: {
                Component: createCardanoSignVerifyComponent({
                    signCardanoMessage: createSignCardanoMessage(deps),
                    signVerifyReporter: deps.signVerifyReporter,
                }),
            },
        },
    );
