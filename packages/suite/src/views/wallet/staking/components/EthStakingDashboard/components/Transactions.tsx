import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';
import { useSelector } from 'src/hooks/suite';
import {
    selectAccountStakeTypeTransactions,
    selectAreAllTransactionsLoaded,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountKey = selectedAccount.account?.key ?? '';

    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, accountKey),
    );
    const areAllTransactionsLoaded = useSelector(state =>
        selectAreAllTransactionsLoaded(state, accountKey),
    );

    const stakeTxs = useSelector(state => selectAccountStakeTypeTransactions(state, accountKey));

    if (selectedAccount.status !== 'loaded' || stakeTxs.length < 1) {
        return null;
    }

    const { account } = selectedAccount;

    return (
        <TransactionList
            account={account}
            transactions={stakeTxs}
            symbol={account.symbol}
            isLoading={transactionsIsLoading || !areAllTransactionsLoaded}
            customTotalItems={stakeTxs.length}
            isExportable={false}
        />
    );
};
