import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function stellarGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function stellarGetAddress(
    params: BundledParams<GetAddress>,
): BundledResponse<Address>;
