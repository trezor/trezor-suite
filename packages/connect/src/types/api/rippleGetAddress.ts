import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function rippleGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function rippleGetAddress(
    params: BundledParams<GetAddress>,
): BundledResponse<Address>;
