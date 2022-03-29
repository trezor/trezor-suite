import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function tezosGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function tezosGetAddress(
    params: BundledParams<GetAddress>,
): BundledResponse<Address>;
