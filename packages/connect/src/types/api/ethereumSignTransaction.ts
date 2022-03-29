import type { Params, Response } from '../params';

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
    path: string | number[];
    transaction: EthereumTransaction | EthereumTransactionEIP1559;
}

export interface EthereumSignedTx {
    v: string;
    r: string;
    s: string;
}

export declare function ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
): Response<EthereumSignedTx>;
