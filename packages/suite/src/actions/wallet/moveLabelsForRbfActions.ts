import { selectLabelingDataForAccount } from '../../reducers/suite/metadataReducer';
import { findChainedTransactions, findTransactions } from '@suite-common/wallet-utils';
import { Dispatch, GetState } from 'src/types/suite';
import * as metadataLabelingActions from 'src/actions/suite/metadataLabelingActions';
import { AccountLabels, AccountOutputLabels } from '@suite-common/metadata-types';
import {
    AccountKey,
    RbfLabelsToBeUpdated,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';

type DeleteAllOutputLabelsParams = {
    labels: AccountLabels['outputLabels']['labels'];
    dispatch: Dispatch;
    accountKey: AccountKey;
    txid: string;
};

const deleteDanglingLabels = async ({
    labels,
    dispatch,
    accountKey,
    txid,
}: DeleteAllOutputLabelsParams) => {
    for (const outputIndex of Object.keys(labels)) {
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
    for (const outputIndex of Object.keys(accountOutputLabels)) {
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

type FindLabelsToBeMovedOrDeletedParams = {
    prevTxid: string;
};

export const findLabelsToBeMovedOrDeleted =
    ({ prevTxid }: FindLabelsToBeMovedOrDeletedParams) =>
    (_dispatch: Dispatch, getState: GetState): RbfLabelsToBeUpdated => {
        const accountTransactions = findTransactions(
            prevTxid,
            getState().wallet.transactions.transactions,
        );

        return accountTransactions.reduce((result, accountTransaction) => {
            const chainedTransactionsToDrop = findChainedTransactions(
                accountTransaction.tx.descriptor,
                accountTransaction.tx.txid,
                getState().wallet.transactions.transactions,
            );

            const allAccountsTransactionsIncludingChained: WalletAccountTransaction[] = [
                accountTransaction.tx,
                ...(chainedTransactionsToDrop?.own ?? []),
                // Intentionally using `chainedTransactionsToDrop?.others`, they will be found when we query another account in the loop
            ];

            result[accountTransaction.key] = {
                toBeDeleted: allAccountsTransactionsIncludingChained,
                toBeMoved: accountTransaction.tx,
            };

            return result;
        }, {} as RbfLabelsToBeUpdated);
    };

type MoveLabelsForRbfParams = {
    newTxid: string;
    toBeMovedOrDeletedList: RbfLabelsToBeUpdated;
};

export const moveLabelsForRbfAction =
    ({ toBeMovedOrDeletedList, newTxid }: MoveLabelsForRbfParams) =>
    async (dispatch: Dispatch, getState: GetState) => {
        for (const toBeMovedOrDeleted of Object.entries(toBeMovedOrDeletedList)) {
            const [accountKey, data] = toBeMovedOrDeleted;

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
        }
    };
