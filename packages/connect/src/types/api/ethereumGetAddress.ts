import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function ethereumGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function ethereumGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
