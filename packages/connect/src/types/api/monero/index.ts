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

export interface MoneroOutputEntry {
    idx: number;
    key: {
        dest: string;
        commitment: string;
    };
}

export interface MoneroMultisigKLRki {
    K?: string;
    L?: string;
    R?: string;
    ki?: string;
}

export interface MoneroTransactionSourceEntry {
    outputs: MoneroOutputEntry[];
    real_output: number;
    real_out_tx_key: string;
    real_out_additional_tx_keys: string[];
    real_output_in_tx_index: number;
    amount: number;
    rct: boolean;
    mask: string;
    subaddr_minor: number;
    multisig_kLRki?: MoneroMultisigKLRki;
}

export interface MoneroAccountPublicAddress {
    spend_public_key: string;
    view_public_key: string;
}

export interface MoneroTransactionDestinationEntry {
    amount: number;
    addr: MoneroAccountPublicAddress;
    is_subaddress: boolean;
    original: string;
    is_integrated: boolean;
}

export interface MoneroTransactionRsigData {
    rsig_type: number;
    offload_type?: number;
    grouping: number[];
    mask?: string;
    rsig?: string;
    rsig_parts?: string[];
    bp_version: number;
}

export interface MoneroTransactionData {
    version: number;
    payment_id?: string;
    unlock_time: number;
    outputs: MoneroTransactionDestinationEntry[];
    change_dts?: MoneroTransactionDestinationEntry;
    num_inputs: number;
    mixin: number;
    fee: number;
    account: number;
    rsig_data: MoneroTransactionRsigData;
    minor_indices?: number[];
    integrated_indices?: number[];
    client_version: number;
    hard_fork: number;
    monero_version?: string;
    chunkify?: boolean;
}

export interface MoneroSignTransaction {
    path: string | number[];
    networkType: MoneroNetworkType;
    tsx_data: MoneroTransactionData;
    inputs: MoneroTransactionSourceEntry[];
}

export interface MoneroRingCtSig {
    txn_fee: number;
    message: string;
    rv_type: number;
}

export interface MoneroSignedTransaction {
    signatures: string[];
    tx_prefix_hash: string;
    rv: MoneroRingCtSig;
    cout_key: string;
    salt: string;
    rand_mult: string;
    tx_enc_keys: string;
    opening_key: string;
    pseudo_outs: string[];
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

export declare function moneroSignTransaction(
    params: Params<MoneroSignTransaction>,
): Response<MoneroSignedTransaction>;
