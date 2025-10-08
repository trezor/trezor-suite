import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function moneroGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function moneroGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
