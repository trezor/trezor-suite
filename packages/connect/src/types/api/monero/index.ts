// Monero API types

import { PROTO } from '../../../constants';
import type { Address as AddressShared, BundledParams, Params, Response } from '../../params';

export type MoneroNetworkType = PROTO.MoneroNetworkType;

export interface MoneroGetAddress {
    path: string | number[];
    address?: string;
    showOnTrezor?: boolean;
    networkType?: MoneroNetworkType;
    account?: number;
    minor?: number;
    paymentId?: string;
    chunkify?: boolean;
}

type MoneroAddress = AddressShared;

// Request/Response types
export declare function moneroGetAddress(params: Params<MoneroGetAddress>): Response<MoneroAddress>;
export declare function moneroGetAddress(
    params: BundledParams<MoneroGetAddress>,
): Response<MoneroAddress[]>;
