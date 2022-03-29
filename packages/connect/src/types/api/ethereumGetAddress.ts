import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function ethereumGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function ethereumGetAddress(
    params: BundledParams<GetAddress>,
): BundledResponse<Address>;
