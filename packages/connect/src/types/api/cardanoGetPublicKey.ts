import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response } from '../params';

export interface CardanoGetPublicKey {
    path: string | number[];
    showOnTrezor?: boolean;
    derivationType?: PROTO.CardanoDerivationType;
}

export interface CardanoPublicKey {
    path: number[];
    serializedPath: string;
    publicKey: string;
    node: PROTO.HDNodeType;
}

export declare function cardanoGetPublicKey(
    params: Params<CardanoGetPublicKey>,
): Response<CardanoPublicKey>;
export declare function cardanoGetPublicKey(
    params: BundledParams<CardanoGetPublicKey>,
): Response<CardanoPublicKey[]>;
