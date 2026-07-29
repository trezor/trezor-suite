import { SignVerify } from '@suite/sign-verify';
import type { SignVerifyNetworkCapability } from '@suite/sign-verify/network';
import type TrezorConnect from '@trezor/connect';
import type { EthereumNetworkSuiteCommonNetworkModule } from '@trezor/network-ethereum-suite-common';

import { createEthereumSignVerifyConfig } from './createEthereumSignVerifyConfig';

export type EthereumNetworkSuiteNetworkModule = EthereumNetworkSuiteCommonNetworkModule & {
    signVerify: SignVerifyNetworkCapability;
};

export type EthereumNetworkSuiteNetworkModuleDeps = {
    suiteCommonNetworkModule: EthereumNetworkSuiteCommonNetworkModule;
    trezorConnect: Pick<
        typeof TrezorConnect,
        'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
    >;
};

export const createEthereumSuiteNetworkModule = ({
    suiteCommonNetworkModule,
    trezorConnect,
}: EthereumNetworkSuiteNetworkModuleDeps): EthereumNetworkSuiteNetworkModule => {
    const networkConfig = createEthereumSignVerifyConfig(trezorConnect);

    return {
        ...suiteCommonNetworkModule,
        signVerify: {
            Component: props => <SignVerify {...props} networkConfig={networkConfig} />,
        },
    };
};
