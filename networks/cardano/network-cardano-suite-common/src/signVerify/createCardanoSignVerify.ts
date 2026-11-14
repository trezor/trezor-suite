import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import type { NetworkSignVerify } from '@trezor/network-module-suite-common-types';

import {
    CARDANO_DEFAULT_SIGNATURE_FORMAT,
    CARDANO_SIGNATURE_FORMATS,
} from './cardanoSignatureFormats';
import { type SignCardanoMessageDeps, createSignCardanoMessage } from './createSignCardanoMessage';

export type CardanoSignVerifyDeps = SignCardanoMessageDeps;

export const createCardanoSignVerify = (
    deps: CardanoSignVerifyDeps,
): NetworkSignVerify<CardanoNetworkSymbol> => ({
    getFormats: () => CARDANO_SIGNATURE_FORMATS,
    getDefaultFormat: () => CARDANO_DEFAULT_SIGNATURE_FORMAT,
    signMessage: createSignCardanoMessage(deps),
});
