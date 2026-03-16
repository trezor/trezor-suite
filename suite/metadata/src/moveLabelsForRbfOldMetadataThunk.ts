import { type Dispatch } from '@reduxjs/toolkit';

import { type AccountLabels, type AccountOutputLabels } from '@suite-common/metadata-types';
import { createThunk } from '@suite-common/redux-utils';
import { type RbfLabelsToBeUpdated } from '@suite-common/suite-rbf-labels-migrations-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { typedObjectKeys } from '@trezor/utils';

import * as METADATA from './metadataConstants';
import * as metadataLabelingActions from './metadataLabelingActions';
import { selectLabelingDataForAccount } from './metadataReducer';

export type DeleteAllOutputLabelsParams = {
    labels: AccountLabels['outputLabels']['labels'];
    dispatch: Dispatch;
    accountKey: AccountKey;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
    txid: string;
};

export const deleteDanglingLabels = async ({
    labels,
    dispatch,
    accountKey,
    accountDescriptor,
    networkSymbol,
    txid,
}: DeleteAllOutputLabelsParams) => {
    for (const outputIndex of typedObjectKeys(labels)) {
        await dispatch(
            metadataLabelingActions.addMetadata({
                type: 'outputLabel',
                entityKey: accountKey,
                txid,
                outputIndex: `${outputIndex}`,
                defaultValue: '',
                value: '',
                accountDescriptor,
                networkSymbol,
            }),
        );
    }
};

type MoveLabelToNewTransactionParams = {
    accountOutputLabels: AccountOutputLabels;
    dispatch: Dispatch;
    accountKey: AccountKey;
    newTxid: string;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export const copyLabelToNewTransaction = async ({
    accountOutputLabels,
    dispatch,
    accountKey,
    accountDescriptor,
    networkSymbol,
    newTxid,
}: MoveLabelToNewTransactionParams) => {
    for (const outputIndex of typedObjectKeys(accountOutputLabels)) {
        const value = accountOutputLabels[outputIndex];

        await dispatch(
            metadataLabelingActions.addMetadata({
                type: 'outputLabel',
                entityKey: accountKey,
                txid: newTxid,
                outputIndex: `${outputIndex}`,
                defaultValue: '',
                value,
                accountDescriptor,
                networkSymbol,
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
    `${METADATA.MODULE_PREFIX}/applyMetadataLabelsThunk`,
    async ({ accountKey, data, newTxid }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        const accountMetadata = selectLabelingDataForAccount(getState(), accountKey);
        const accountOutputLabelsToBeMoved: AccountOutputLabels =
            accountMetadata?.outputLabels?.[data.toBeMoved.txid] ?? {};

        if (!account) {
            return;
        }

        await copyLabelToNewTransaction({
            accountKey,
            accountOutputLabels: accountOutputLabelsToBeMoved,
            newTxid,
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
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
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            };

            await deleteDanglingLabels(deleteParams);
        }
    },
);
