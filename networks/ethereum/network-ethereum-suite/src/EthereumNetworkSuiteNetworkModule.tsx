import type TrezorConnect from '@trezor/connect';
import type {
    SignVerifyCapabilityHelpers,
    SuiteNetworkModule,
} from '@trezor/network-module-suite-types';

import { createEthereumSignVerifyCapability } from './createEthereumSignVerifyCapability';
import {
    type EthereumSuiteNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type EthereumNetworkSuiteNetworkModule = SuiteNetworkModule<EthereumSuiteNetworkSymbol>;

export type EthereumNetworkSuiteNetworkModuleDeps = {
    trezorConnect: Pick<
        typeof TrezorConnect,
        'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
    >;
    signVerifyHelpers: Pick<SignVerifyCapabilityHelpers, 'formatSignedMessage'>;
};

export const createEthereumSuiteNetworkModule = ({
    trezorConnect,
    signVerifyHelpers,
}: EthereumNetworkSuiteNetworkModuleDeps): EthereumNetworkSuiteNetworkModule => {
    const signVerify = createEthereumSignVerifyCapability(trezorConnect, signVerifyHelpers);

    return {
        getSupportedNetworks,
        isSupportedNetwork,
        signVerify,
    };
};
