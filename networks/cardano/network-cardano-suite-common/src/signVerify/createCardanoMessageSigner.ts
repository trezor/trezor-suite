import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import type { MessageSigner } from '@trezor/network-module-suite-common-types';

import {
    CARDANO_DEFAULT_SIGNATURE_FORMAT,
    CARDANO_SIGNATURE_FORMATS,
} from './cardanoSignatureFormats';
import { type SignCardanoMessageDeps, createSignCardanoMessage } from './createSignCardanoMessage';

export type CardanoMessageSignerDeps = SignCardanoMessageDeps;

export const createCardanoMessageSigner = (
    deps: CardanoMessageSignerDeps,
): MessageSigner<CardanoNetworkSymbol> => ({
    getFormats: () => CARDANO_SIGNATURE_FORMATS,
    getDefaultFormat: () => CARDANO_DEFAULT_SIGNATURE_FORMAT,
    signMessage: createSignCardanoMessage(deps),
});
