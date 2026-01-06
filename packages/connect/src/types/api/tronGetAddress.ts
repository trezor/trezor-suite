import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function tronGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function tronGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
