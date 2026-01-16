import { ExtraDependencies } from '@suite-common/redux-utils';
import {
    createMigrateSuiteSyncLabelsForRbfTransaction,
    findLabelsToBeMovedOrDeleted,
} from '@suite-common/suite-rbf-labels-migrations';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { selectTransactions } from '@suite-common/wallet-core';
import { StaticSessionId } from '@trezor/connect';

import { Dispatch, GetState } from 'src/types/suite';

import { moveLabelsForRbfOldMetadataThunk } from './moveLabelsForRbfOldMetadataThunk';

type MoveLabelsForRbfThunkParams = {
    newTxId: string;
    prevTxId: string;
    deviceStaticSessionId: StaticSessionId;
};

export const moveLabelsForRbfThunk =
    ({ newTxId, prevTxId, deviceStaticSessionId }: MoveLabelsForRbfThunkParams) =>
    async (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const toBeMovedOrDeletedList = findLabelsToBeMovedOrDeleted({
            prevTxId,
            walletTransactions: selectTransactions(getState()),
        });
        const suiteSyncEnabled = selectIsSuiteSyncEnabled(getState());
        if (suiteSyncEnabled) {
            return createMigrateSuiteSyncLabelsForRbfTransaction({
                dispatch,
                getState,
                updateOutputLabel: extra.services.suiteSync.labeling.updateOutputLabel,
            })({
                toBeMovedOrDeletedList,
                deviceStaticSessionId,
                newTxId,
            });
        }

        for (const toBeMovedOrDeleted of Object.entries(toBeMovedOrDeletedList)) {
            const [accountKey, data] = toBeMovedOrDeleted;

            await dispatch(
                moveLabelsForRbfOldMetadataThunk({ accountKey, data, newTxid: newTxId }),
            );
        }
    };
