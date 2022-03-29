import type { Messages } from '@trezor/transport';
import type { Params, BundledParams, Response, BundledResponse } from '../params';

export interface CardanoGetPublicKey {
    path: string | number[];
    showOnTrezor?: boolean;
    derivationType?: Messages.CardanoDerivationType;
}

export interface CardanoPublicKey {
    path: number[];
    serializedPath: string;
    publicKey: string;
    node: Messages.HDNodeType;
}

export declare function cardanoGetPublicKey(
    params: Params<CardanoGetPublicKey>,
): Response<CardanoPublicKey>;
export declare function cardanoGetPublicKey(
    params: BundledParams<CardanoGetPublicKey>,
): BundledResponse<CardanoPublicKey>;
