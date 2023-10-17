import type { DerivationPath } from '../../params';

// ethereumSignMessage

export interface EthereumSignMessage {
    path: DerivationPath;
    message: string;
    hex?: boolean;
}

// ethereumSignTransaction

export interface EthereumTransaction {
    to: string;
    value: string;
    gasPrice: string;
    gasLimit: string;
    maxFeePerGas?: typeof undefined;
    maxPriorityFeePerGas?: typeof undefined;
    nonce: string;
    data?: string;
    chainId: number;
    txType?: number;
}

export interface EthereumAccessList {
    address: string;
    storageKeys: string[];
}

export interface EthereumTransactionEIP1559 {
    to: string;
    value: string;
    gasLimit: string;
    gasPrice?: typeof undefined;
    nonce: string;
    data?: string;
    chainId: number;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    accessList?: EthereumAccessList[];
}

export interface EthereumSignTransaction {
    path: DerivationPath;
    transaction: EthereumTransaction | EthereumTransactionEIP1559;
    chunkify?: boolean;
}

export interface EthereumSignedTx {
    v: string;
    r: string;
    s: string;
    serializedTx: string;
}

// ethereumSignTypedData

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
    path: DerivationPath;
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
    domain_separator_hash?: undefined;
    message_hash?: undefined;
}

/**
 * T1B1 cannot currently calculate EIP-712 hashes by itself,
 * so we have to precalculate them.
 * Used for full EIP-712 signing or blind signing.
 * Supports both T2T1 and T1B1.
 */
export interface EthereumSignTypedHash<T extends EthereumSignTypedDataTypes> {
    path: DerivationPath;
    data: EthereumSignTypedDataMessage<T>;
    metamask_v4_compat: boolean;
    domain_separator_hash: string;
    /** Not required for domain-only signing, when EIP712Domain is the `primaryType` */
    message_hash?: string;
}

// ethereumVerifyMessage

export interface EthereumVerifyMessage {
    address: string;
    message: string;
    hex?: boolean;
    signature: string;
}
