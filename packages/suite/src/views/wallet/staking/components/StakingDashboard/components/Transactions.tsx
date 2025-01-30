import {
    selectAccountStakeTypeTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllTransactionsLoaded,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountKey = selectedAccount.account?.key ?? '';

    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, accountKey),
    );
    const areAllTransactionsLoaded = useSelector(state =>
        selectAreAllTransactionsLoaded(state, accountKey),
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
            allTransactions={allTransactions}
            account={account}
            transactions={stakeTxs}
            symbol={account.symbol}
            isLoading={transactionsIsLoading || !areAllTransactionsLoaded}
            customTotalItems={stakeTxs.length}
            isExportable={false}
        />
    );
};
