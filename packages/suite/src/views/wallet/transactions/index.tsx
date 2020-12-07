import React from 'react';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions, isTestnet } from '@wallet-utils/accountUtils';
import NoTransactions from './components/NoTransactions';
import AccountEmpty from './components/AccountEmpty';
import TokenList from './components/TokenList';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary/Container';
import { Props } from './Container';

interface ContentProps {
    selectedAccount: Props['selectedAccount'];
    children?: React.ReactNode;
    showSummary?: boolean;
}

const Content = ({ selectedAccount, showSummary, children }: ContentProps) => {
    if (selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

    return (
        <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
            {showSummary && account.networkType !== 'ripple' && (
                <TransactionSummary account={account} />
            )}
            {account.networkType === 'ethereum' && (
                <TokenList
                    isTestnet={isTestnet(account.symbol)}
                    explorerUrl={network.explorer.account}
                    tokens={account.tokens}
                />
            )}
            {children}
        </WalletLayout>
    );
};

const Transactions = (props: Props) => {
    const { selectedAccount, transactions } = props;

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRANSACTIONS" account={props.selectedAccount} />;
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
