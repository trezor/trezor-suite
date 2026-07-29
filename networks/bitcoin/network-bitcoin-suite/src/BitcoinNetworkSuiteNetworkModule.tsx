import { SignVerify } from '@suite/sign-verify';
import type { SignVerifyNetworkCapability } from '@suite/sign-verify/network';
import type TrezorConnect from '@trezor/connect';
import type { BitcoinNetworkSuiteCommonNetworkModule } from '@trezor/network-bitcoin-suite-common';

import { BitcoinSignAddressOptions } from './BitcoinSignAddressOptions';
import { createBitcoinSignVerifyConfig } from './createBitcoinSignVerifyConfig';

export type BitcoinNetworkSuiteNetworkModule = BitcoinNetworkSuiteCommonNetworkModule & {
    signVerify: SignVerifyNetworkCapability;
};

export type BitcoinNetworkSuiteNetworkModuleDeps = {
    suiteCommonNetworkModule: BitcoinNetworkSuiteCommonNetworkModule;
    trezorConnect: Pick<typeof TrezorConnect, 'getAddress' | 'signMessage' | 'verifyMessage'>;
};

export const createBitcoinSuiteNetworkModule = ({
    suiteCommonNetworkModule,
    trezorConnect,
}: BitcoinNetworkSuiteNetworkModuleDeps): BitcoinNetworkSuiteNetworkModule => {
    const networkConfig = {
        ...createBitcoinSignVerifyConfig(trezorConnect),
        SignAddressOptions: BitcoinSignAddressOptions,
    };

    return {
        ...suiteCommonNetworkModule,
        signVerify: {
            Component: props => <SignVerify {...props} networkConfig={networkConfig} />,
        },
    };
};
