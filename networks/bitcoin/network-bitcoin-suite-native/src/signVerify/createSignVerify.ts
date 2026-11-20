import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type SignBitcoinMessageDeps,
    type VerifyBitcoinMessageDeps,
    createSignBitcoinMessage,
    createVerifyBitcoinMessage,
} from '@trezor/network-bitcoin-suite-common';
import { type BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import { type SignVerify } from '@trezor/network-module-suite-native-types';

import { createBitcoinSignVerifyComponent } from './createBitcoinSignVerifyComponent';

export type SignVerifyDeps = SignBitcoinMessageDeps &
    VerifyBitcoinMessageDeps &
    SignVerifyReporterDep;

export const createSignVerify = (deps: SignVerifyDeps): SignVerify<BitcoinNetworkSymbol> => ({
    Component: createBitcoinSignVerifyComponent({
        signBitcoinMessage: createSignBitcoinMessage(deps),
        verifyBitcoinMessage: createVerifyBitcoinMessage(deps),
        signVerifyReporter: deps.signVerifyReporter,
    }),
});
