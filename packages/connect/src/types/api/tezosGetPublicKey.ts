import type {
    GetPublicKey,
    PublicKey,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function tezosGetPublicKey(params: Params<GetPublicKey>): Response<PublicKey>;
export declare function tezosGetPublicKey(
    params: BundledParams<GetPublicKey>,
): BundledResponse<PublicKey>;
