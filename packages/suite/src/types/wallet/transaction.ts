import { FeeLevel } from '@trezor/connect';
import { FeeInfo, PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { Network, Account } from '@wallet-types';

export interface SignTransactionData {
    account: Account;
    address: string;
    amount: string;
    network: Network;
    destinationTag?: string;
    transactionInfo: PrecomposedTransactionFinal | null;
}

export interface ComposeTransactionData {
    account: Account;
    amount: string;
    feeInfo: FeeInfo;
    feePerUnit: string;
    feeLimit: string;
    network: Network;
    selectedFee: FeeLevel['label'];
    isMaxActive: boolean;
    address?: string;
    token?: string;
    ethereumDataHex?: string;
    isInvity?: boolean;
}

export interface SignedTx {
    tx: string;
    coin: string;
}

export interface ReviewTransactionData {
    signedTx: SignedTx | undefined;
    transactionInfo: PrecomposedTransactionFinal;
    extraFields?: {
        destinationTag?: string;
    };
}
