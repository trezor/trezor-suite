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

export interface MoneroGetWatchKey {
    path: string | number[];
    networkType?: MoneroNetworkType;
}

export interface MoneroWatchKey {
    watch_key: string;
    address: string;
}

export interface MoneroTransferDetails {
    out_key: string;
    tx_pub_key: string;
    additional_tx_pub_keys?: string[] | string; // Optional: can be array, comma-separated string, or omitted
    internal_output_index: string | number;
    sub_addr_major?: number;
    sub_addr_minor?: number;
}

export interface MoneroSubAddressIndicesList {
    account: number;
    minor_indices: number[];
}

export interface MoneroKeyImageSync {
    path: string | number[];
    networkType?: MoneroNetworkType;
    subs?: MoneroSubAddressIndicesList[];
    tdis: MoneroTransferDetails[];
}

export interface MoneroExportedKeyImage {
    iv: string;
    key_image: string;
    signature: string;
}

export interface MoneroKeyImageSyncResult {
    key_images: MoneroExportedKeyImage[];
}

// Request/Response types
export declare function moneroGetAddress(params: Params<MoneroGetAddress>): Response<MoneroAddress>;
export declare function moneroGetAddress(
    params: BundledParams<MoneroGetAddress>,
): Response<MoneroAddress[]>;

export declare function moneroGetWatchKey(
    params: Params<MoneroGetWatchKey>,
): Response<MoneroWatchKey>;

export declare function moneroKeyImageSync(
    params: Params<MoneroKeyImageSync>,
): Response<MoneroKeyImageSyncResult>;
