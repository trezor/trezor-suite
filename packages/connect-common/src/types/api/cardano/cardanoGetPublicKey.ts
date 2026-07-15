import type { CardanoGetPublicKey, CardanoPublicKey } from './common';
import type { BundledParams, Params, Response } from '../../params';

export declare function cardanoGetPublicKey(
    params: Params<CardanoGetPublicKey>,
): Response<CardanoPublicKey>;
export declare function cardanoGetPublicKey(
    params: BundledParams<CardanoGetPublicKey>,
): Response<CardanoPublicKey[]>;
