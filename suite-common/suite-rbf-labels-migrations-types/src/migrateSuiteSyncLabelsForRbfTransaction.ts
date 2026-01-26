import { SuiteSyncOutput, SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import {
    SuiteSyncFirmwareUpgradeNeededDeviceErrorType,
    SuiteSyncUnavailableOnDeviceErrorType,
} from '@suite-common/suite-sync-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountDescriptor,
    AccountKey,
    DeviceCancelledErrType,
    DeviceErrorType,
    WalletAccountTransaction,
    WalletDescriptor,
} from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { Result } from '@trezor/type-utils';

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
) => Promise<
    Result<
        void,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
        | DeviceCancelledErrType
        | SuiteSyncUpdateError
    >[]
>;

export type DeleteLabelsForSuiteSync = (
    params: DeleteLabelsForSuiteSyncParams,
) => Promise<
    Result<
        void,
        | SuiteSyncUnavailableOnDeviceErrorType
        | DeviceErrorType
        | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
        | DeviceCancelledErrType
        | SuiteSyncUpdateError
    >[]
>;

export type DeleteLabelsForSuiteSyncDep = {
    deleteLabelsForSuiteSync: DeleteLabelsForSuiteSync;
};

export type SetLabelsForSuiteSyncDep = {
    setLabelsForSuiteSync: SetLabelsForSuiteSync;
};

export type GetOutputs = (params: {
    walletDescriptor: WalletDescriptor;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
}) => SuiteSyncOutput[];

export type GetOutputsDep = {
    getOutputs: GetOutputs;
};

export type MigrateSuiteSyncLabelsForRbfTransactionDeps = {
    dispatch: (args: any) => void;
} & GetOutputsDep &
    SetLabelsForSuiteSyncDep &
    DeleteLabelsForSuiteSyncDep;

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

export type MigrateSuiteSyncLabelsForRbfTransactionDep = {
    migrateSuiteSyncLabelsForRbfTransaction: (
        params: MigrateSuiteSyncLabelsForRbfTransactionParams,
    ) => Promise<
        [
            Result<
                void,
                | SuiteSyncUnavailableOnDeviceErrorType
                | DeviceErrorType
                | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
                | DeviceCancelledErrType
                | SuiteSyncUpdateError
            >[],
            Result<
                void,
                | SuiteSyncUnavailableOnDeviceErrorType
                | DeviceErrorType
                | SuiteSyncFirmwareUpgradeNeededDeviceErrorType
                | DeviceCancelledErrType
                | SuiteSyncUpdateError
            >[],
        ]
    >;
};
