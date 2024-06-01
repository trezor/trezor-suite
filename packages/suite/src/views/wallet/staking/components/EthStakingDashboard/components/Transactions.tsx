import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';
import { useSelector } from 'src/hooks/suite';
import { selectAccountTransactions, selectIsLoadingTransactions } from '@suite-common/wallet-core';
import { isStakeTypeTx } from '@suite-common/suite-utils';

export const Transactions = () => {
    const transactionsIsLoading = useSelector(selectIsLoadingTransactions);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountTxs = useSelector(state =>
        selectAccountTransactions(state, selectedAccount.account?.key || ''),
    );

    if (selectedAccount.status !== 'loaded' || accountTxs.length < 1) {
        return null;
    }

    const { account } = selectedAccount;

    return (
        <TransactionList
            account={account}
            transactions={accountTxs}
            transactionFilter={tx => isStakeTypeTx(tx.ethereumSpecific?.parsedData?.methodId)}
            isLoading={transactionsIsLoading}
            isExportable={false}
        />
    );
};
