import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type BitcoinSuiteCommonNetworkModule,
    type SignBitcoinMessageDeps,
    type VerifyBitcoinMessageDeps,
    createBitcoinSuiteCommonNetworkModule,
    createSignBitcoinMessage,
    createVerifyBitcoinMessage,
} from '@trezor/network-bitcoin-suite-common';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import {
    type SuiteNetworkModule,
    createNetworkModuleSuite,
} from '@trezor/network-module-suite-types';

import { createBitcoinSignVerifyComponent } from './signVerify/createBitcoinSignVerifyComponent';

export type BitcoinSuiteNetworkModuleDeps = SignBitcoinMessageDeps &
    VerifyBitcoinMessageDeps &
    SignVerifyReporterDep;

export type BitcoinSuiteNetworkModule = SuiteNetworkModule<BitcoinSuiteCommonNetworkModule>;

export const createBitcoinSuiteNetworkModule = (
    deps: BitcoinSuiteNetworkModuleDeps,
): BitcoinSuiteNetworkModule => {
    const signBitcoinMessage = createSignBitcoinMessage(deps);
    const verifyBitcoinMessage = createVerifyBitcoinMessage(deps);

    return createNetworkModuleSuite(
        createBitcoinSuiteCommonNetworkModule(),
        supportedBitcoinNetworks,
        {
            signVerify: {
                Component: createBitcoinSignVerifyComponent({
                    signBitcoinMessage,
                    verifyBitcoinMessage,
                    signVerifyReporter: deps.signVerifyReporter,
                }),
                title: 'TR_NAV_SIGN_VERIFY',
            },
        },
    );
};
