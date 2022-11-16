import React from 'react';
import { WalletLayout, CoinjoinSummaryHeader } from '@wallet-components';
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

interface LayoutProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: React.ReactNode;
    showEmptyHeaderPlaceholder?: boolean;
}

const Layout = ({ selectedAccount, showEmptyHeaderPlaceholder = false, children }: LayoutProps) => {
    if (selectedAccount.status !== 'loaded') return null;

    return (
        <WalletLayout
            title="TR_NAV_TRANSACTIONS"
            account={selectedAccount}
            showEmptyHeaderPlaceholder={showEmptyHeaderPlaceholder}
        >
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
    const isCoinjoinAccount = account.accountType === 'coinjoin';

    if (accountTransactions.length > 0 || transactionsIsLoading) {
        return (
            <Layout selectedAccount={selectedAccount}>
                {account.networkType !== 'ripple' && account.accountType !== 'coinjoin' && (
                    <TransactionSummary account={account} />
                )}

                {isCoinjoinAccount && <CoinjoinSummary accountKey={account.key} />}

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
            <Layout
                selectedAccount={selectedAccount}
                showEmptyHeaderPlaceholder={!isCoinjoinAccount}
            >
                {isCoinjoinAccount ? (
                    <>
                        <CoinjoinSummaryHeader />
                        <CoinjoinAccountEmpty account={selectedAccount.account} />
                    </>
                ) : (
                    <AccountEmpty account={selectedAccount.account} />
                )}
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount} showEmptyHeaderPlaceholder={!isCoinjoinAccount}>
            {isCoinjoinAccount && <CoinjoinSummaryHeader />}
            <NoTransactions account={account} />
        </Layout>
    );
};

export default Transactions;
