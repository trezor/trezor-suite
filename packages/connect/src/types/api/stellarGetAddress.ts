import type { GetAddress, Address, Params, BundledParams, Response } from '../params';

export declare function stellarGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function stellarGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
