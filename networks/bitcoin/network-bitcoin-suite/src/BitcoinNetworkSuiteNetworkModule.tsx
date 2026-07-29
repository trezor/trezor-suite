import type TrezorConnect from '@trezor/connect';
import type {
    SignVerifyCapabilityHelpers,
    SuiteNetworkModule,
} from '@trezor/network-module-suite-types';

import { BitcoinSignAddressOptions } from './BitcoinSignAddressOptions';
import { createBitcoinSignVerifyCapability } from './createBitcoinSignVerifyCapability';
import {
    type BitcoinSuiteNetworkSymbol,
    getSupportedNetworks,
    isSupportedNetwork,
} from './supportedNetworks';

export type BitcoinNetworkSuiteNetworkModule = SuiteNetworkModule<BitcoinSuiteNetworkSymbol>;

export type BitcoinNetworkSuiteNetworkModuleDeps = {
    trezorConnect: Pick<typeof TrezorConnect, 'getAddress' | 'signMessage' | 'verifyMessage'>;
    signVerifyHelpers: SignVerifyCapabilityHelpers;
};

export const createBitcoinSuiteNetworkModule = ({
    trezorConnect,
    signVerifyHelpers,
}: BitcoinNetworkSuiteNetworkModuleDeps): BitcoinNetworkSuiteNetworkModule => {
    const signVerify = {
        ...createBitcoinSignVerifyCapability(trezorConnect, signVerifyHelpers),
        SignAddressOptions: BitcoinSignAddressOptions,
    };

    return {
        getSupportedNetworks,
        isSupportedNetwork,
        signVerify,
    };
};
