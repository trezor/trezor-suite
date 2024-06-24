import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';
import { useSelector } from 'src/hooks/suite';
import {
    selectAccountStakeTypeTransactions,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, selectedAccount.account?.key || null),
    );
    const stakeTxs = useSelector(state =>
        selectAccountStakeTypeTransactions(state, selectedAccount.account?.key || ''),
    );

    if (selectedAccount.status !== 'loaded' || stakeTxs.length < 1) {
        return null;
    }

    const { account } = selectedAccount;

    return (
        <TransactionList
            account={account}
            transactions={stakeTxs}
            symbol={account.symbol}
            isLoading={transactionsIsLoading}
            customTotalItems={stakeTxs.length}
            isExportable={false}
        />
    );
};
