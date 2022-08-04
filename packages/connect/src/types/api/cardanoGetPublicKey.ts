import type { Params, BundledParams, Response } from '../params';
import type { CardanoGetPublicKey, CardanoPublicKey } from './cardano';

export declare function cardanoGetPublicKey(
    params: Params<CardanoGetPublicKey>,
): Response<CardanoPublicKey>;
export declare function cardanoGetPublicKey(
    params: BundledParams<CardanoGetPublicKey>,
): Response<CardanoPublicKey[]>;
