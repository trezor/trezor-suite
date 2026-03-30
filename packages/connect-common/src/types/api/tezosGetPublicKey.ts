import type { BundledParams, GetPublicKey, Params, PublicKey, Response } from '../params';

export declare function tezosGetPublicKey(params: Params<GetPublicKey>): Response<PublicKey>;
export declare function tezosGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<PublicKey[]>;
