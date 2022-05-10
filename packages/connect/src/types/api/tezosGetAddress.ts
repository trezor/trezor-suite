import type { GetAddress, Address, Params, BundledParams, Response } from '../params';

export declare function tezosGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function tezosGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
