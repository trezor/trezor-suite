import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import {
    type MoveLabelsForRbfOldMetadataThunkState,
    moveLabelsForRbfOldMetadataThunk,
} from '@suite/metadata';
import { type DeviceRootState } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type WithServices } from '@suite-common/redux-utils';
import { findLabelsToBeMovedOrDeleted } from '@suite-common/suite-rbf-labels-migrations';
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { type WithSuiteSyncState, selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { type TransactionsRootState, selectTransactions } from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/connect';
import { type Branded } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

export type StateBeforePush = TransactionsRootState & Branded<'StateBeforePush'>;

export const asStateBeforePush = (state: TransactionsRootState): StateBeforePush =>
    state as StateBeforePush;

type MoveLabelsForRbfThunkParams = {
    newTxId: string;
    prevTxId: string;
    deviceStaticSessionId: StaticSessionId;
    stateBeforePush: StateBeforePush;
};

export type MoveLabelsForRbfThunkState = DeviceRootState &
    MessageSystemRootState &
    MoveLabelsForRbfOldMetadataThunkState &
    WithSuiteSyncState;

export type MoveLabelsForRbfThunkDeps = WithServices<MigrateSuiteSyncLabelsForRbfTransactionDep>;

type MoveLabelsForRbfThunkDispatch = ThunkDispatch<
    MoveLabelsForRbfThunkState,
    MoveLabelsForRbfThunkDeps,
    UnknownAction
>;

export const moveLabelsForRbfThunk =
    ({ newTxId, prevTxId, deviceStaticSessionId, stateBeforePush }: MoveLabelsForRbfThunkParams) =>
    async (
        dispatch: MoveLabelsForRbfThunkDispatch,
        getState: () => MoveLabelsForRbfThunkState,
        extra: MoveLabelsForRbfThunkDeps,
    ) => {
        const toBeMovedOrDeletedList = findLabelsToBeMovedOrDeleted({
            prevTxId,
            // NOTE: beware of stateBeforePush, this has to be passed here which is a state
            // before a new TX is pushed to the chain
            walletTransactions: selectTransactions(stateBeforePush),
        });
        const suiteSyncEnabled = selectIsSuiteSyncEnabled(getState());
        if (suiteSyncEnabled) {
            return extra.services.migrateSuiteSyncLabelsForRbfTransaction({
                toBeMovedOrDeletedList,
                deviceStaticSessionId,
                newTxId,
            });
        }

        for (const toBeMovedOrDeleted of typedObjectEntries(toBeMovedOrDeletedList)) {
            const [accountKey, data] = toBeMovedOrDeleted;

            await dispatch(
                moveLabelsForRbfOldMetadataThunk({ accountKey, data, newTxid: newTxId }),
            );
        }
    };
