import { SuiteSyncOutput, SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
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

import { UpdateOutputLabelDep } from './data/updateOutputLabel';
import { SuiteSyncUnavailableOnDeviceErrorType } from './refreshSuiteSyncKeys';

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
    UpdateOutputLabelDep;

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
                | DeviceCancelledErrType
                | SuiteSyncUpdateError
            >[],
            Result<
                void,
                | SuiteSyncUnavailableOnDeviceErrorType
                | DeviceErrorType
                | DeviceCancelledErrType
                | SuiteSyncUpdateError
            >[],
        ]
    >;
};
