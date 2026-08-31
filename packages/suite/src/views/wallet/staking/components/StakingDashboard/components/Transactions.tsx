import { useSelector } from '@suite-common/redux-utils';
import {
    selectAccountStakeTypeTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllTransactionsLoaded,
} from '@suite-common/wallet-core';

import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountKey = selectedAccount.account?.key ?? null;

    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, accountKey)),
    );
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );
    const stakeTxs = useSelector(state => selectAccountStakeTypeTransactions(state, accountKey));

    if (selectedAccount.status !== 'loaded' || stakeTxs.length < 1) {
        return null;
    }

    const { account } = selectedAccount;

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            allTransactions={allTransactions}
            account={account}
            transactions={stakeTxs}
            symbol={account.symbol}
            isLoading={!areAllTransactionsLoaded}
            customTotalItems={stakeTxs.length}
            isExportable={false}
            isTxFilteringEnabled={false}
        />
    );
};
