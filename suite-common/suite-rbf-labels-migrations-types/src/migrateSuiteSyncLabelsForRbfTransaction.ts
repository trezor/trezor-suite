import { type SuiteSyncOutput, type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors } from '@suite-common/suite-sync-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountDescriptor,
    type AccountKey,
    type WalletAccountTransaction,
    type WalletDescriptor,
} from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { type Result } from '@trezor/type-utils';

export type SuiteSyncTransactionToCopy = {
    data: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated];
    suiteSyncOutputLabelsToBeUpdated: SuiteSyncOutput;
};

export type SetLabelsForSuiteSyncParams = {
    newTxId: string;
    deviceStaticSessionId: StaticSessionId;
    suiteSyncOutputLabelsToBeUpdated: SuiteSyncTransactionToCopy[];
};

type SuiteSyncTransactionToDelete = {
    data: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated];
    suiteSyncOutputLabelsToBeDeleted: SuiteSyncOutput;
};

export type DeleteLabelsForSuiteSyncParams = {
    deviceStaticSessionId: StaticSessionId;
    transactionOutputsToDelete: SuiteSyncTransactionToDelete[];
};

export type SetLabelsForSuiteSync = (
    params: SetLabelsForSuiteSyncParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>[]>;

export type DeleteLabelsForSuiteSync = (
    params: DeleteLabelsForSuiteSyncParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>[]>;

export type DeleteLabelsForSuiteSyncDep = {
    deleteLabelsForSuiteSync: DeleteLabelsForSuiteSync;
};

export type SetLabelsForSuiteSyncDep = {
    setLabelsForSuiteSync: SetLabelsForSuiteSync;
};

export type GetOutputs = (
    walletDescriptor: WalletDescriptor,
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => SuiteSyncOutput[];

export type GetOutputsDep = {
    getOutputs: GetOutputs;
};

export type RbfLabelsToBeUpdated = Record<
    AccountKey,
    {
        toBeMoved: WalletAccountTransaction;
        toBeDeleted: WalletAccountTransaction[];
    }
>;

export type MigrateSuiteSyncLabelsForRbfTransactionParams = {
    deviceStaticSessionId: StaticSessionId;
    newTxId: string;
    toBeMovedOrDeletedList: RbfLabelsToBeUpdated;
};

export type MigrateSuiteSyncLabelsForRbfTransaction = (
    params: MigrateSuiteSyncLabelsForRbfTransactionParams,
) => Promise<
    [
        Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>[],
        Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>[],
    ]
>;

export type MigrateSuiteSyncLabelsForRbfTransactionDep = {
    migrateSuiteSyncLabelsForRbfTransaction: MigrateSuiteSyncLabelsForRbfTransaction;
};
