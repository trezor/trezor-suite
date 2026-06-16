import type { CardanoGetNativeScriptHash, CardanoNativeScriptHash } from './common';
import type { Params, Response } from '../../params';

export declare function cardanoGetNativeScriptHash(
    params: Params<CardanoGetNativeScriptHash>,
): Response<CardanoNativeScriptHash>;
