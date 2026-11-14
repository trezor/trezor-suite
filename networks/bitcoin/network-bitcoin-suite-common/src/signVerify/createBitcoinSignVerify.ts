import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { NetworkSignVerify } from '@trezor/network-module-suite-common-types';

import {
    BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    getBitcoinSignatureFormats,
} from './bitcoinSignatureFormats';
import { type SignBitcoinMessageDeps, createSignBitcoinMessage } from './createSignBitcoinMessage';
import {
    type VerifyBitcoinMessageDeps,
    createVerifyBitcoinMessage,
} from './createVerifyBitcoinMessage';

export type BitcoinSignVerifyDeps = SignBitcoinMessageDeps & VerifyBitcoinMessageDeps;

export const createBitcoinSignVerify = (
    deps: BitcoinSignVerifyDeps,
): NetworkSignVerify<BitcoinNetworkSymbol> => ({
    getFormats: getBitcoinSignatureFormats,
    getDefaultFormat: () => BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    signMessage: createSignBitcoinMessage(deps),
    verifyMessage: createVerifyBitcoinMessage(deps),
});
