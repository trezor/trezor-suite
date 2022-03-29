import type { PROTO } from '../../constants';
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
    domain_separator_hash?: undefined;
    message_hash?: undefined;
}

/**
 * The Trezor Model 1 cannot currently calculate EIP-712 hashes by itself,
 * so we have to precalculate them.
 * Used for full EIP-712 signing or blind signing.
 * Supports both Trezor Model T and Trezor Model 1.
 */
export interface EthereumSignTypedHash<T extends EthereumSignTypedDataTypes> {
    path: string | number[];
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
    domain_separator_hash: string;
    /** Not required for domain-only signing, when EIP712Domain is the `primaryType` */
    message_hash?: string;
}

export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedData<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
