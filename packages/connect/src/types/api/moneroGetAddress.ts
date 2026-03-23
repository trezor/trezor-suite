import type { MoneroAddress, MoneroGetAddress as MoneroGetAddressParams } from './monero';
import type { BundledParams, Params, Response } from '../params';

export declare function moneroGetAddress(
    params: Params<MoneroGetAddressParams>,
): Response<MoneroAddress>;
export declare function moneroGetAddress(
    params: BundledParams<MoneroGetAddressParams>,
): Response<MoneroAddress[]>;
