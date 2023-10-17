import type { PROTO, NEM } from '../../../constants';
import type { DerivationPath } from '../../params';

// NEM types from nem-sdk
// https://nemproject.github.io/#transferTransaction

export interface MosaicID {
    namespaceId: string;
    name: string;
}

export interface MosaicDefinition {
    levy?: {
        type?: PROTO.NEMMosaicLevy;
        fee?: number;
        recipient?: string;
        mosaicId?: MosaicID;
    };
    id: MosaicID;
    description: string;
    properties?: {
        name: 'divisibility' | 'initialSupply' | 'supplyMutable' | 'transferable';
        value: string;
    }[];
}

export interface NEMMosaic {
    mosaicId: MosaicID;
    quantity: number;
}

export interface Modification {
    modificationType: PROTO.NEMModificationType;
    cosignatoryAccount: string;
}

export interface Message {
    payload?: string;
    type?: number;
    publicKey?: string; // not present in sdk
}

export interface TransactionCommon {
    version: NEM.TxVersion;
    timeStamp: number;
    fee: number;
    deadline: number;
    signer?: string;
}

export type NEMTransferTransaction = TransactionCommon & {
    type: NEM.TxType.TRANSFER;
    recipient: string;
    amount: PROTO.UintType;
    mosaics?: NEMMosaic[];
    message?: Message;
};

export type NEMImportanceTransaction = TransactionCommon & {
    type: NEM.TxType.IMPORTANCE_TRANSFER;
    importanceTransfer: {
        mode: PROTO.NEMImportanceTransferMode;
        publicKey: string;
    };
};

export type NEMAggregateModificationTransaction = TransactionCommon & {
    type: NEM.TxType.AGGREGATE_MODIFICATION;
    modifications?: Modification[];
    minCosignatories: {
        relativeChange: number;
    };
};

export type NEMProvisionNamespaceTransaction = TransactionCommon & {
    type: NEM.TxType.PROVISION_NAMESPACE;
    newPart: string;
    parent?: string;
    rentalFeeSink: string;
    rentalFee: number;
};

export type NEMMosaicCreationTransaction = TransactionCommon & {
    type: NEM.TxType.MOSAIC_CREATION;
    mosaicDefinition: MosaicDefinition;
    creationFeeSink: string;
    creationFee: number;
};

export type NEMSupplyChangeTransaction = TransactionCommon & {
    type: NEM.TxType.SUPPLY_CHANGE;
    mosaicId: MosaicID;
    supplyType: PROTO.NEMSupplyChangeType;
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
    type: NEM.TxType.COSIGNING | NEM.TxType.MULTISIG | NEM.TxType.MULTISIG_SIGNATURE;
    otherTrans: NEMRegularTransaction;
};

export type NEMTransaction = NEMRegularTransaction | NEMMultisigTransaction;

export interface NEMSignTransaction {
    path: DerivationPath;
    transaction: NEMTransaction;
    chunkify?: boolean;
}
