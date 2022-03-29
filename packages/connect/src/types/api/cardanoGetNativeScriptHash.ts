import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface CardanoNativeScript {
    type: PROTO.CardanoNativeScriptType;
    scripts?: CardanoNativeScript[];
    keyHash?: string;
    keyPath?: string | number[];
    requiredSignaturesCount?: number;
    invalidBefore?: string;
    invalidHereafter?: string;
}

export interface CardanoGetNativeScriptHash {
    script: CardanoNativeScript;
    displayFormat: PROTO.CardanoNativeScriptHashDisplayFormat;
    derivationType?: PROTO.CardanoDerivationType;
}

export interface CardanoNativeScriptHash {
    scriptHash: string;
}

export declare function cardanoGetNativeScriptHash(
    params: Params<CardanoGetNativeScriptHash>,
): Response<CardanoNativeScriptHash>;
