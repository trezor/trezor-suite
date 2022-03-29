import type {
    GetPublicKey,
    PublicKey,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function binanceGetPublicKey(params: Params<GetPublicKey>): Response<PublicKey>;
export declare function binanceGetPublicKey(
    params: BundledParams<GetPublicKey>,
): BundledResponse<PublicKey>;
