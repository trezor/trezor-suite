import React from 'react';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions } from '@suite-common/wallet-utils';
import { useSelector } from '@suite-hooks';
import { AppState } from '@suite-types';
import { CoinjoinSummary } from '@wallet-components/CoinjoinSummary';
import { selectIsLoadingTransactions } from '@suite-common/wallet-core';

import { NoTransactions } from './components/NoTransactions';
import { AccountEmpty } from './components/AccountEmpty';
import { CoinjoinAccountEmpty } from './components/CoinjoinAccountEmpty';
import { TransactionList } from './components/TransactionList';
import { TransactionSummary } from './components/TransactionSummary';
import { CoinjoinAccountDiscoveryProgress } from '@wallet-components/WalletLayout/components/CoinjoinAccountDiscoveryProgress';

interface LayoutProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: React.ReactNode;
    showEmptyHeaderPlaceholder?: boolean;
}

const Layout = ({ selectedAccount, showEmptyHeaderPlaceholder = false, children }: LayoutProps) => (
    <WalletLayout
        title="TR_NAV_TRANSACTIONS"
        account={selectedAccount}
        showEmptyHeaderPlaceholder={showEmptyHeaderPlaceholder}
    >
        {children}
    </WalletLayout>
);

const Transactions = () => {
    const transactionsIsLoading = useSelector(selectIsLoadingTransactions);
    const { selectedAccount, transactions } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        transactions: state.wallet.transactions,
    }));

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const accountTransactions = getAccountTransactions(account.key, transactions.transactions);

    if (account.backendType === 'coinjoin') {
        const isLoading = account.status === 'out-of-sync' && !!account.syncing;
        const isEmpty = !accountTransactions.length;
        return (
            <Layout selectedAccount={selectedAccount}>
                {isLoading && <CoinjoinAccountDiscoveryProgress />}
                {!isEmpty && (
                    <>
                        <CoinjoinSummary accountKey={account.key} />
                        <TransactionList
                            account={account}
                            transactions={accountTransactions}
                            symbol={account.symbol}
                            isLoading={transactionsIsLoading}
                        />
                    </>
                )}
                {isEmpty && !isLoading && (
                    <CoinjoinAccountEmpty account={selectedAccount.account} />
                )}
            </Layout>
        );
    }

    if (accountTransactions.length > 0 || transactionsIsLoading) {
        return (
            <Layout selectedAccount={selectedAccount}>
                {account.networkType !== 'ripple' && <TransactionSummary account={account} />}

                <TransactionList
                    account={account}
                    transactions={accountTransactions}
                    symbol={account.symbol}
                    isLoading={transactionsIsLoading}
                />
            </Layout>
        );
    }

    if (account.empty) {
        return (
            <Layout selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
                <AccountEmpty account={selectedAccount.account} />
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount} showEmptyHeaderPlaceholder>
            <NoTransactions account={account} />
        </Layout>
    );
};

export default Transactions;
