import type { Address, GetAddress, Params, BundledParams, Response } from '../params';

export declare function solanaGetAddress(params: Params<GetAddress>): Response<Address>;
export declare function solanaGetAddress(params: BundledParams<GetAddress>): Response<Address[]>;
