import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function binanceGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function binanceGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
