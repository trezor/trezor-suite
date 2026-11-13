import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { MessageSigner } from '@trezor/network-module-suite-common-types';

import {
    BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    getBitcoinSignatureFormats,
} from './bitcoinSignatureFormats';
import { type SignBitcoinMessageDeps, createSignBitcoinMessage } from './createSignBitcoinMessage';
import {
    type VerifyBitcoinMessageDeps,
    createVerifyBitcoinMessage,
} from './createVerifyBitcoinMessage';

export type BitcoinMessageSignerDeps = SignBitcoinMessageDeps & VerifyBitcoinMessageDeps;

export const createBitcoinMessageSigner = (
    deps: BitcoinMessageSignerDeps,
): MessageSigner<BitcoinNetworkSymbol> => ({
    getFormats: getBitcoinSignatureFormats,
    getDefaultFormat: () => BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    signMessage: createSignBitcoinMessage(deps),
    verifyMessage: createVerifyBitcoinMessage(deps),
});
