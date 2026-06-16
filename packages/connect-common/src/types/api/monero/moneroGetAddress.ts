import type { MoneroAddress, MoneroGetAddress } from './common';
import type { BundledParams, Params, Response } from '../../params';

export declare function moneroGetAddress(params: Params<MoneroGetAddress>): Response<MoneroAddress>;
export declare function moneroGetAddress(
    params: BundledParams<MoneroGetAddress>,
): Response<MoneroAddress[]>;
