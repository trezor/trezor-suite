// NEM types from nem-sdk
// https://nemproject.github.io/#transferTransaction

import type { UintType } from '@trezor/protobuf';

export interface MosaicID {
    namespaceId: string;
    name: string;
}

export interface MosaicDefinition {
    levy?: {
        type?: number;
        fee?: number;
        recipient?: string;
        mosaicId?: MosaicID;
    };
    id: MosaicID;
    description: string;
    properties?: Array<{
        name: 'divisibility' | 'initialSupply' | 'supplyMutable' | 'transferable';
        value: string;
    }>;
}

export interface NEMMosaic {
    mosaicId: MosaicID;
    quantity: number;
}

export interface Modification {
    modificationType: number;
    cosignatoryAccount: string;
}

export interface Message {
    payload?: string;
    type?: number;
    publicKey?: string; // not present in sdk
}

export interface TransactionCommon {
    version: number;
    timeStamp: number;
    fee: number;
    deadline: number;
    signer?: string;
}

export type NEMTransferTransaction = TransactionCommon & {
    type: 0x0101;
    recipient: string;
    amount: UintType;
    mosaics?: NEMMosaic[];
    message?: Message;
};

export type NEMImportanceTransaction = TransactionCommon & {
    type: 0x0801;
    importanceTransfer: {
        mode: number;
        publicKey: string;
    };
};

export type NEMAggregateModificationTransaction = TransactionCommon & {
    type: 0x1001;
    modifications?: Modification[];
    minCosignatories: {
        relativeChange: number;
    };
};

export type NEMProvisionNamespaceTransaction = TransactionCommon & {
    type: 0x2001;
    newPart: string;
    parent?: string;
    rentalFeeSink: string;
    rentalFee: number;
};

export type NEMMosaicCreationTransaction = TransactionCommon & {
    type: 0x4001;
    mosaicDefinition: MosaicDefinition;
    creationFeeSink: string;
    creationFee: number;
};

export type NEMSupplyChangeTransaction = TransactionCommon & {
    type: 0x4002;
    mosaicId: MosaicID;
    supplyType: number;
    delta: number;
};

export type NEMRegularTransaction =
    | NEMTransferTransaction
    | NEMImportanceTransaction
    | NEMAggregateModificationTransaction
    | NEMProvisionNamespaceTransaction
    | NEMMosaicCreationTransaction
    | NEMSupplyChangeTransaction;

export type NEMMultisigTransaction = TransactionCommon & {
    type: 0x0102 | 0x1002 | 0x1004;
    otherTrans: NEMRegularTransaction;
};

export type NEMTransaction = NEMRegularTransaction | NEMMultisigTransaction;

// get address

export interface NEMGetAddress {
    path: string | number[];
    address?: string;
    network: number;
    showOnTrezor?: boolean;
}

export interface NEMAddress {
    address: string;
    path: number[];
    serializedPath: string;
}

// sign transaction

export interface NEMSignTransaction {
    path: string | number[];
    transaction: NEMTransaction;
}
