import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    fetchAllTransactionsForAccountThunk,
    selectAccountStakeTypeTransactions,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';
import { useEffect } from 'react';

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accountKey = selectedAccount.account?.key || null;

    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, selectedAccount.account?.key || null),
    );
    const stakeTxs = useSelector(state =>
        selectAccountStakeTypeTransactions(state, selectedAccount.account?.key || ''),
    );

    const dispatch = useDispatch();

    useEffect(() => {
        if (accountKey) {
            dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey,
                    noLoading: true,
                }),
            );
        }
    }, [selectedAccount, accountKey, dispatch]);

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
