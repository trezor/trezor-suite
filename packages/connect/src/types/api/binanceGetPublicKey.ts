import type { BundledParams, GetPublicKey, Params, PublicKey, Response } from '../params';

export declare function binanceGetPublicKey(params: Params<GetPublicKey>): Response<PublicKey>;
export declare function binanceGetPublicKey(
    params: BundledParams<GetPublicKey>,
): Response<PublicKey[]>;
