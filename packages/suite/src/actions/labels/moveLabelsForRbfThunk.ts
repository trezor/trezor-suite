import { moveLabelsForRbfOldMetadataThunk } from '@suite/metadata';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { findLabelsToBeMovedOrDeleted } from '@suite-common/suite-rbf-labels-migrations';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectTransactions } from '@suite-common/wallet-core';
import { type StaticSessionId } from '@trezor/connect';
import { type Branded } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import { type Dispatch, type GetState } from 'src/types/suite';

export type StateBeforePush = ReturnType<GetState> & Branded<'StateBeforePush'>;

export const asStateBeforePush = (state: ReturnType<GetState>): StateBeforePush =>
    state as StateBeforePush;

type MoveLabelsForRbfThunkParams = {
    newTxId: string;
    prevTxId: string;
    deviceStaticSessionId: StaticSessionId;
    stateBeforePush: StateBeforePush;
};

export const moveLabelsForRbfThunk =
    ({ newTxId, prevTxId, deviceStaticSessionId, stateBeforePush }: MoveLabelsForRbfThunkParams) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
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
