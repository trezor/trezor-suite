import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function rippleGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function rippleGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
