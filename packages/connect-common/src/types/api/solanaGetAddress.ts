import type { Address, BundledParams, GetAddress, Params, Response } from '../params';

export declare function solanaGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function solanaGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
