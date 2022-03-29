/**
 * @param params Passing:
 * - {@link Ethereum.EthereumSignTypedData} is required for Trezor T
 * - {@link Ethereum.EthereumSignTypedHash} is required for Trezor 1 compatability
 */

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

interface EthereumSignTypedDataTypeProperty {
    name: string;
    type: string;
}

export interface EthereumSignTypedDataTypes {
    EIP712Domain: EthereumSignTypedDataTypeProperty[];
    [additionalProperties: string]: EthereumSignTypedDataTypeProperty[];
}

export interface EthereumSignTypedDataMessage<T extends EthereumSignTypedDataTypes> {
    types: T;
    primaryType: keyof T;
    domain: {
        name?: string;
        version?: string;
        chainId?: number | bigint;
        verifyingContract?: string;
        salt?: ArrayBuffer;
    };
    message: { [fieldName: string]: any };
}

export interface EthereumSignTypedData<T extends EthereumSignTypedDataTypes> {
    path: string | number[];
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
}

/**
 * The Trezor Model 1 cannot currently calculate EIP-712 hashes by itself,
 * so we have to precalculate them.
 */
export interface EthereumSignTypedHash {
    path: string | number[];
    domain_separator_hash: string;
    /** Not required for domain-only signing, when EIP712Domain is the `primaryType` */
    message_hash?: string;
}

/**
 * Used for full EIP-712 signing or blind signing.
 * Supports both Trezor Model T and Trezor Model 1.
 */
export type EthereumSignTypedHashAndData<T extends EthereumSignTypedDataTypes> =
    EthereumSignTypedData<T> & EthereumSignTypedHash;

export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedData<T> | EthereumSignTypedHashAndData<T>>,
): Response<Messages.EthereumTypedDataSignature>;
