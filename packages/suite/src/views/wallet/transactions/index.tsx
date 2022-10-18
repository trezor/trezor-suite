import React from 'react';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions } from '@suite-common/wallet-utils';
import { useSelector } from '@suite-hooks';
import { AppState } from '@suite-types';
import { CoinjoinSummary } from '@wallet-components/CoinjoinSummary';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';

import { NoTransactions } from './components/NoTransactions';
import { AccountEmpty } from './components/AccountEmpty';
import { TransactionList } from './components/TransactionList';
import { TransactionSummary } from './components/TransactionSummary';

interface ContentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: React.ReactNode;
    showEmptyHeaderPlaceholder?: boolean;
    showSummary?: boolean;
}

const Content = ({
    selectedAccount,
    showSummary,
    showEmptyHeaderPlaceholder = false,
    children,
}: ContentProps) => {
    if (selectedAccount.status !== 'loaded') return null;

    const { account } = selectedAccount;

    return (
        <WalletLayout
            title="TR_NAV_TRANSACTIONS"
            account={selectedAccount}
            showEmptyHeaderPlaceholder={showEmptyHeaderPlaceholder}
        >
            {showSummary &&
                account.networkType !== 'ripple' &&
                account.accountType !== 'coinjoin' && <TransactionSummary account={account} />}
            {showSummary && account.accountType === 'coinjoin' && (
                <CoinjoinSummary account={account} />
            )}

            {children}
        </WalletLayout>
    );
};

const Transactions = () => {
    const transactionsIsLoading = useSelector(selectIsLoadingTransactions);
    const { selectedAccount, transactions } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        transactions: state.wallet.transactions,
    }));

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const accountTransactions = getAccountTransactions(account.key, transactions.transactions);

    if (accountTransactions.length > 0 || transactionsIsLoading) {
        return (
            <Content selectedAccount={selectedAccount} showSummary>
                <TransactionList
                    account={account}
                    transactions={accountTransactions}
                    symbol={account.symbol}
                    isLoading={transactionsIsLoading}
                />
            </Content>
        );
    }

    if (account.empty) {
        return (
            <Content selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
                <AccountEmpty account={selectedAccount.account} />
            </Content>
        );
    }

    return (
        <Content selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
            <NoTransactions account={account} />
        </Content>
    );
};

export default Transactions;
