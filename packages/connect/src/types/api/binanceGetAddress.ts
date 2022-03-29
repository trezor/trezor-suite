import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export declare function binanceGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function binanceGetAddress(
    params: BundledParams<GetAddress>,
): BundledResponse<Address>;
