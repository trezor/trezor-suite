import { type Dispatch } from '@reduxjs/toolkit';

import {
    type DeleteLabelsForSuiteSync,
    type DeleteLabelsForSuiteSyncDep,
    type GetOutputsDep,
    type MigrateSuiteSyncLabelsForRbfTransaction,
    type RbfLabelsToBeUpdated,
    type SetLabelsForSuiteSync,
    type SetLabelsForSuiteSyncDep,
} from '@suite-common/suite-rbf-labels-migrations-types';
import { type UpdateOutputLabelDep } from '@suite-common/suite-sync-types';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { typedObjectEntries } from '@trezor/utils';

type SetLabelsForSuiteSyncDeps = UpdateOutputLabelDep;

export const createSetLabelsForSuiteSync =
    (deps: SetLabelsForSuiteSyncDeps): SetLabelsForSuiteSync =>
    ({ newTxId, deviceStaticSessionId, suiteSyncOutputLabelsToBeUpdated }) =>
        Promise.all(
            suiteSyncOutputLabelsToBeUpdated.map(outputLabel =>
                deps.updateOutputLabel({
                    deviceStaticSessionId,
                    txId: newTxId,
                    txTargetId: outputLabel.suiteSyncOutputLabelsToBeUpdated.txTargetId,
                    label: outputLabel.suiteSyncOutputLabelsToBeUpdated.label,
                    accountDescriptor: outputLabel.data.toBeMoved.descriptor,
                    networkSymbol: outputLabel.data.toBeMoved.symbol,
                }),
            ),
        );

type DeleteLabelsForSuiteSyncDeps = UpdateOutputLabelDep;

export const createDeleteLabelsForSuiteSync =
    (deps: DeleteLabelsForSuiteSyncDeps): DeleteLabelsForSuiteSync =>
    ({ deviceStaticSessionId, transactionOutputsToDelete }) =>
        Promise.all(
            transactionOutputsToDelete.flatMap(deleteOutput =>
                deleteOutput.data.toBeDeleted.map(toBeDeleted =>
                    deps.updateOutputLabel({
                        deviceStaticSessionId,
                        txId: toBeDeleted.txid,
                        txTargetId: deleteOutput.suiteSyncOutputLabelsToBeDeleted.txTargetId,
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
            deps
                .getOutputs(
                    parseStaticSessionId(deviceStaticSessionId).walletDescriptor,
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

        const setLabelsForSuiteSyncResult = deps.setLabelsForSuiteSync({
            newTxId,
            deviceStaticSessionId,
            suiteSyncOutputLabelsToBeUpdated: transactionsToCopy,
        });

        const transactionOutputsToDelete = labelsToBeMoved.flatMap(data =>
            deps
                .getOutputs(
                    parseStaticSessionId(deviceStaticSessionId).walletDescriptor,
                    data.toBeMoved.descriptor,
                    data.toBeMoved.symbol,
                )
                .filter(output => output.txId === data.toBeMoved.txid)
                .map(output => ({
                    data,
                    suiteSyncOutputLabelsToBeDeleted: output,
                })),
        );

        const deleteLabelsForSuiteSyncResult = deps.deleteLabelsForSuiteSync({
            deviceStaticSessionId,
            transactionOutputsToDelete,
        });

        return await Promise.all([setLabelsForSuiteSyncResult, deleteLabelsForSuiteSyncResult]);
    };

export type MigrateSuiteSyncLabelsForRbfTransactionDeps = {
    dispatch: Dispatch;
} & GetOutputsDep &
    SetLabelsForSuiteSyncDep &
    DeleteLabelsForSuiteSyncDep;

export const createMigrateSuiteSyncLabelsForRbfTransaction =
    (deps: MigrateSuiteSyncLabelsForRbfTransactionDeps): MigrateSuiteSyncLabelsForRbfTransaction =>
    ({ newTxId, deviceStaticSessionId, toBeMovedOrDeletedList }) => {
        const labelsToBeMoved = typedObjectEntries(toBeMovedOrDeletedList).map(([_, data]) => data);

        return moveLabelsForSuiteSyncRbf(deps)({
            deviceStaticSessionId,
            labelsToBeMoved,
            newTxId,
        });
    };
