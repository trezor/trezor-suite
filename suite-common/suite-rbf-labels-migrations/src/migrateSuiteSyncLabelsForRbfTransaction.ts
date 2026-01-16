import {
    SuiteSyncDataRootState,
    selectSuiteSyncOutputLabelsByAccount,
} from '@suite-common/suite-sync';
import { SuiteSyncOutput } from '@suite-common/suite-sync-storage';
import { UpdateOutputLabelDep } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { typedObjectEntries } from '@trezor/utils';

import { type RbfLabelsToBeUpdated } from './findLabelsToBeMovedOrDeleted';

export type MigrateSuiteSyncLabelsForRbfTransactionDeps = {
    dispatch: (args: any) => void;
    getState: () => SuiteSyncDataRootState;
} & UpdateOutputLabelDep;

type SuiteSyncTransactionToCopy = {
    data: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated];
    suiteSyncOutputLabelsToBeUpdated: SuiteSyncOutput;
};

type SuiteSyncTransactionToDelete = {
    data: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated];
    suiteSyncOutputLabelsToBeDeleted: SuiteSyncOutput;
};

type SetLabelsForSuiteSyncParams = {
    newTxId: string;
    deviceStaticSessionId: StaticSessionId;
    suiteSyncOutputLabelsToBeUpdated: SuiteSyncTransactionToCopy[];
};

const setLabelsForSuiteSync =
    (deps: MigrateSuiteSyncLabelsForRbfTransactionDeps) =>
    ({
        newTxId,
        deviceStaticSessionId,
        suiteSyncOutputLabelsToBeUpdated,
    }: SetLabelsForSuiteSyncParams) =>
        Promise.all(
            suiteSyncOutputLabelsToBeUpdated.map(outputLabel =>
                deps.updateOutputLabel({
                    deviceStaticSessionId,
                    txId: newTxId,
                    outputIndex: Number(outputLabel.suiteSyncOutputLabelsToBeUpdated.outputIndex),
                    label: outputLabel.suiteSyncOutputLabelsToBeUpdated.label,
                    accountDescriptor: outputLabel.data.toBeMoved.descriptor,
                    networkSymbol: outputLabel.data.toBeMoved.symbol,
                }),
            ),
        );

type DeleteLabelsForSuiteSyncParams = {
    deviceStaticSessionId: StaticSessionId;
    transactionOutputsToDelete: SuiteSyncTransactionToDelete[];
};

const deleteLabelsForSuiteSync =
    (deps: MigrateSuiteSyncLabelsForRbfTransactionDeps) =>
    ({ deviceStaticSessionId, transactionOutputsToDelete }: DeleteLabelsForSuiteSyncParams) =>
        Promise.all(
            transactionOutputsToDelete.flatMap(deleteOutput =>
                deleteOutput.data.toBeDeleted.map(toBeDeleted =>
                    deps.updateOutputLabel({
                        deviceStaticSessionId,
                        txId: toBeDeleted.txid,
                        outputIndex: Number(
                            deleteOutput.suiteSyncOutputLabelsToBeDeleted.outputIndex,
                        ),
                        label: null,
                        accountDescriptor: deleteOutput.data.toBeMoved.descriptor,
                        networkSymbol: deleteOutput.data.toBeMoved.symbol,
                    }),
                ),
            ),
        );

type MoveLabelsForSuiteSyncRbfParams = {
    deviceStaticSessionId: StaticSessionId;
    newTxId: string;
    labelsToBeMoved: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated][];
};

const moveLabelsForSuiteSyncRbf =
    (deps: MigrateSuiteSyncLabelsForRbfTransactionDeps) =>
    async ({
        newTxId,
        deviceStaticSessionId,
        labelsToBeMoved,
    }: MoveLabelsForSuiteSyncRbfParams) => {
        const transactionsToCopy = labelsToBeMoved.flatMap(data =>
            selectSuiteSyncOutputLabelsByAccount(
                deps.getState(),
                parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor,
                data.toBeMoved.descriptor,
                data.toBeMoved.symbol,
            )
                .filter(output => output.txId === data.toBeMoved.txid)
                .map(output => ({
                    newTxId,
                    data,
                    suiteSyncOutputLabelsToBeUpdated: output,
                })),
        );

        const setLabelsForSuiteSyncResult = setLabelsForSuiteSync(deps)({
            newTxId,
            deviceStaticSessionId,
            suiteSyncOutputLabelsToBeUpdated: transactionsToCopy,
        });

        const transactionOutputsToDelete = labelsToBeMoved.flatMap(data =>
            selectSuiteSyncOutputLabelsByAccount(
                deps.getState(),
                parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor,
                data.toBeMoved.descriptor,
                data.toBeMoved.symbol,
            )
                .filter(output => output.txId === data.toBeMoved.txid)
                .map(output => ({
                    data,
                    suiteSyncOutputLabelsToBeDeleted: output,
                })),
        );

        const deleteLabelsForSuiteSyncResult = deleteLabelsForSuiteSync(deps)({
            deviceStaticSessionId,
            transactionOutputsToDelete,
        });

        return await Promise.all([setLabelsForSuiteSyncResult, deleteLabelsForSuiteSyncResult]);
    };

type MoveSuiteSyncLabelsForRbfParams = {
    deviceStaticSessionId: StaticSessionId;
    newTxId: string;
    toBeMovedOrDeletedList: RbfLabelsToBeUpdated;
};

export const createMigrateSuiteSyncLabelsForRbfTransaction =
    (deps: MigrateSuiteSyncLabelsForRbfTransactionDeps) =>
    ({
        newTxId,
        deviceStaticSessionId,
        toBeMovedOrDeletedList,
    }: MoveSuiteSyncLabelsForRbfParams) => {
        const labelsToBeMoved = typedObjectEntries(toBeMovedOrDeletedList).map(([_, data]) => data);

        return moveLabelsForSuiteSyncRbf(deps)({
            deviceStaticSessionId,
            labelsToBeMoved,
            newTxId,
        });
    };
