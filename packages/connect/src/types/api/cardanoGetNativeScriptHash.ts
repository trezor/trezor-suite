import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface CardanoNativeScript {
    type: Messages.CardanoNativeScriptType;
    scripts?: CardanoNativeScript[];
    keyHash?: string;
    keyPath?: string | number[];
    requiredSignaturesCount?: number;
    invalidBefore?: string;
    invalidHereafter?: string;
}

export interface CardanoGetNativeScriptHash {
    script: CardanoNativeScript;
    displayFormat: Messages.CardanoNativeScriptHashDisplayFormat;
    derivationType?: Messages.CardanoDerivationType;
}

export interface CardanoNativeScriptHash {
    scriptHash: string;
}

export declare function cardanoGetNativeScriptHash(
    params: Params<CardanoGetNativeScriptHash>,
): Response<CardanoNativeScriptHash>;
