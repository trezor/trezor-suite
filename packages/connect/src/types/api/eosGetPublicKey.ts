import type { Params, BundledParams, Response, BundledResponse } from '../params';

export interface EosGetPublicKey {
    path: string | number[];
    showOnTrezor?: boolean;
}

export interface EosPublicKey {
    wifPublicKey: string;
    rawPublicKey: string;
    path: number[];
    serializedPath: string;
}

export declare function eosGetPublicKey(params: Params<EosGetPublicKey>): Response<EosPublicKey>;
export declare function eosGetPublicKey(
    params: BundledParams<EosGetPublicKey>,
): BundledResponse<EosPublicKey>;
