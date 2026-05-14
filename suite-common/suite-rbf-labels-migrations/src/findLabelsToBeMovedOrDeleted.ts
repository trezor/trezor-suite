import { type RbfLabelsToBeUpdated } from '@suite-common/suite-rbf-labels-migrations-types';
import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { findChainedTransactions, findTransactions } from '@suite-common/wallet-utils';

type FindLabelsToBeMovedOrDeletedThunkParams = {
    prevTxId: string;
    walletTransactions: Record<AccountKey, WalletAccountTransaction[]>;
};

export const findLabelsToBeMovedOrDeleted = ({
    prevTxId,
    walletTransactions,
}: FindLabelsToBeMovedOrDeletedThunkParams) => {
    const accountTransactions = findTransactions(prevTxId, walletTransactions);

    return accountTransactions.reduce<RbfLabelsToBeUpdated>((result, accountTransaction) => {
        const chainedTransactionsToDrop = findChainedTransactions(
            accountTransaction.tx.descriptor,
            accountTransaction.tx.txid,
            walletTransactions,
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
    }, {});
};
