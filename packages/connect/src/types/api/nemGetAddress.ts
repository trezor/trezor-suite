import type {
    GetAddress,
    Address,
    Params,
    BundledParams,
    Response,
    BundledResponse,
} from '../params';

export interface NEMGetAddress extends GetAddress {
    network: number;
}

export declare function nemGetAddress(params: Params<NEMGetAddress>): Response<Address>;
export declare function nemGetAddress(
    params: BundledParams<NEMGetAddress>,
): BundledResponse<Address>;
