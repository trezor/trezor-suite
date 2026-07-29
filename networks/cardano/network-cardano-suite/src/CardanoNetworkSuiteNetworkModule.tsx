import type TrezorConnect from '@trezor/connect';
import type {
    SignVerifyCapabilityHelpers,
    SuiteNetworkModule,
} from '@trezor/network-module-suite-types';

import { CardanoSignAdditionalResult } from './CardanoSignAdditionalResult';
import { CardanoSignOptions } from './CardanoSignOptions';
import { createCardanoSignVerifyCapability } from './createCardanoSignVerifyCapability';
import {
    type CardanoSuiteNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type CardanoNetworkSuiteNetworkModule = SuiteNetworkModule<CardanoSuiteNetworkSymbol>;

export type CardanoNetworkSuiteNetworkModuleDeps = {
    trezorConnect: Pick<typeof TrezorConnect, 'cardanoSignMessage'>;
    signVerifyHelpers: Pick<SignVerifyCapabilityHelpers, 'getAccountAddressesForSigning'>;
};

export const createCardanoSuiteNetworkModule = ({
    trezorConnect,
    signVerifyHelpers,
}: CardanoNetworkSuiteNetworkModuleDeps): CardanoNetworkSuiteNetworkModule => {
    const signVerify = {
        ...createCardanoSignVerifyCapability(trezorConnect, signVerifyHelpers),
        SignOptions: CardanoSignOptions,
        SignAdditionalResult: CardanoSignAdditionalResult,
    };

    return {
        getSupportedNetworks,
        isSupportedNetwork,
        signVerify,
    };
};
