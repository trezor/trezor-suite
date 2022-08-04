import type { Params, Response } from '../params';
import type { CardanoGetNativeScriptHash, CardanoNativeScriptHash } from './cardano';

export declare function cardanoGetNativeScriptHash(
    params: Params<CardanoGetNativeScriptHash>,
): Response<CardanoNativeScriptHash>;
