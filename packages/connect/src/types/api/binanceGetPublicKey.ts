import type { GetPublicKey, PublicKey, Params, BundledParams, Response } from '../params';

export declare function binanceGetPublicKey(params: Params<GetPublicKey>): Response<PublicKey>;
export declare function binanceGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<PublicKey[]>;
