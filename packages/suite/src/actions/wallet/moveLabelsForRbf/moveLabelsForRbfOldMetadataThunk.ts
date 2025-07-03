import { AccountLabels, AccountOutputLabels } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import { AccountKey } from '@suite-common/wallet-types';
import { typedObjectKeys } from '@trezor/utils';

import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { Dispatch } from 'src/types/suite';

import { selectLabelingDataForAccount } from '../../../reducers/suite/metadataReducer';
import { RbfLabelsToBeUpdated } from '../../../types/wallet/sendForm';
import { MODULE_PREFIX } from '../send/sendThunksConsts';

type DeleteAllOutputLabelsParams = {
    labels: AccountLabels['outputLabels']['labels'];
    dispatch: Dispatch;
    accountKey: AccountKey;
    txid: string;
};

export const deleteDanglingLabels = async ({
    labels,
    dispatch,
    accountKey,
    txid,
}: DeleteAllOutputLabelsParams) => {
    for (const outputIndex of typedObjectKeys(labels)) {
        await dispatch(
            metadataLabelingActions.addMetadata({
                type: 'outputLabel',
                entityKey: accountKey,
                txid,
                outputIndex: Number(outputIndex),
                defaultValue: '',
                value: '',
            }),
        );
    }
};

type MoveLabelToNewTransactionParams = {
    accountOutputLabels: AccountOutputLabels;
    dispatch: Dispatch;
    accountKey: AccountKey;
    newTxid: string;
};

export const copyLabelToNewTransaction = async ({
    accountOutputLabels,
    dispatch,
    accountKey,
    newTxid,
}: MoveLabelToNewTransactionParams) => {
    for (const outputIndex of typedObjectKeys(accountOutputLabels)) {
        const value = accountOutputLabels[outputIndex];

        await dispatch(
            metadataLabelingActions.addMetadata({
                type: 'outputLabel',
                entityKey: accountKey,
                txid: newTxid,
                outputIndex: Number(outputIndex),
                defaultValue: '',
                value,
            }),
        );
    }
};

export type MoveLabelsForRbfOldMetadataThunkParams = {
    accountKey: AccountKey;
    data: RbfLabelsToBeUpdated[keyof RbfLabelsToBeUpdated];
    newTxid: string;
};

export const moveLabelsForRbfOldMetadataThunk = createThunk<
    void,
    MoveLabelsForRbfOldMetadataThunkParams,
    void
>(
    `${MODULE_PREFIX}/applyMetadataLabelsThunk`,
    async ({ accountKey, data, newTxid }, { dispatch, getState }) => {
        const accountMetadata = selectLabelingDataForAccount(getState(), accountKey);
        const accountOutputLabelsToBeMoved: AccountOutputLabels =
            accountMetadata?.outputLabels?.[data.toBeMoved.txid] ?? {};

        await copyLabelToNewTransaction({
            accountKey,
            accountOutputLabels: accountOutputLabelsToBeMoved,
            newTxid,
            dispatch,
        });

        for (const transactionToDrop of data.toBeDeleted) {
            const accountOutputLabelsToBeDeleted: AccountOutputLabels =
                accountMetadata?.outputLabels?.[transactionToDrop.txid] ?? {};

            const deleteParams: DeleteAllOutputLabelsParams = {
                accountKey,
                dispatch,
                labels: accountOutputLabelsToBeDeleted,
                txid: transactionToDrop.txid,
            };

            await deleteDanglingLabels(deleteParams);
        }
    },
);
