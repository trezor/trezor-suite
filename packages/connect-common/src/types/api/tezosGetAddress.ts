import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function tezosGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function tezosGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
