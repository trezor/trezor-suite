import React from 'react';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import { useSelector } from '@suite-hooks';
import { AppState } from '@suite-types';

import NoTransactions from './components/NoTransactions';
import AccountEmpty from './components/AccountEmpty';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary';

interface ContentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: React.ReactNode;
    showSummary?: boolean;
}

const Content = ({ selectedAccount, showSummary, children }: ContentProps) => {
    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;

    return (
        <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
            {showSummary && account.networkType !== 'ripple' && (
                <TransactionSummary account={account} />
            )}
            {children}
        </WalletLayout>
    );
};

const Transactions = () => {
    const { selectedAccount, transactions } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        transactions: state.wallet.transactions,
    }));

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const accountTransactions = getAccountTransactions(transactions.transactions, account);

    if (accountTransactions.length > 0 || transactions.isLoading) {
        return (
            <Content selectedAccount={selectedAccount} showSummary>
                <TransactionList
                    account={account}
                    transactions={accountTransactions}
                    symbol={account.symbol}
                    isLoading={transactions.isLoading}
                />
            </Content>
        );
    }

    if (account.empty) {
        return (
            <Content selectedAccount={selectedAccount}>
                <AccountEmpty account={selectedAccount.account} />
            </Content>
        );
    }

    return (
        <Content selectedAccount={selectedAccount}>
            <NoTransactions account={account} />
        </Content>
    );
};

export default Transactions;
