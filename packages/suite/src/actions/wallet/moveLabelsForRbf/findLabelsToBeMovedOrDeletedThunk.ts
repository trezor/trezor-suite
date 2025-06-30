import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { findChainedTransactions, findTransactions } from '@suite-common/wallet-utils';

import { Dispatch, GetState } from '../../../types/suite';
import { RbfLabelsToBeUpdated } from '../../../types/wallet/sendForm';

type FindLabelsToBeMovedOrDeletedThunkParams = {
    prevTxid: string;
};

export const findLabelsToBeMovedOrDeletedThunk =
    ({ prevTxid }: FindLabelsToBeMovedOrDeletedThunkParams) =>
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
