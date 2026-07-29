import { SignVerify } from '@suite/sign-verify';
import type { SignVerifyNetworkCapability } from '@suite/sign-verify/network';
import type TrezorConnect from '@trezor/connect';
import type { CardanoNetworkSuiteCommonNetworkModule } from '@trezor/network-cardano-suite-common';

import { CardanoSignAdditionalResult } from './CardanoSignAdditionalResult';
import { CardanoSignOptions } from './CardanoSignOptions';
import { createCardanoSignVerifyConfig } from './createCardanoSignVerifyConfig';

export type CardanoNetworkSuiteNetworkModule = CardanoNetworkSuiteCommonNetworkModule & {
    signVerify: SignVerifyNetworkCapability;
};

export type CardanoNetworkSuiteNetworkModuleDeps = {
    suiteCommonNetworkModule: CardanoNetworkSuiteCommonNetworkModule;
    trezorConnect: Pick<typeof TrezorConnect, 'cardanoSignMessage'>;
};

export const createCardanoSuiteNetworkModule = ({
    suiteCommonNetworkModule,
    trezorConnect,
}: CardanoNetworkSuiteNetworkModuleDeps): CardanoNetworkSuiteNetworkModule => {
    const networkConfig = {
        ...createCardanoSignVerifyConfig(trezorConnect),
        SignOptions: CardanoSignOptions,
        SignAdditionalResult: CardanoSignAdditionalResult,
    };

    return {
        ...suiteCommonNetworkModule,
        signVerify: {
            Component: props => <SignVerify {...props} networkConfig={networkConfig} />,
        },
    };
};
