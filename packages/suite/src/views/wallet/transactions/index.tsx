import React, { useEffect, useState } from 'react';
import { SETTINGS } from '@suite-config';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions, isTestnet } from '@wallet-utils/accountUtils';
import NoTransactions from './components/NoTransactions';
import AccountEmpty from './components/AccountEmpty';
import PricePanel from './components/PricePanel/Container';
import TokenList from './components/TokenList';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary/Container';
import { Props } from './Container';

interface ContentProps {
    selectedAccount: Props['selectedAccount'];
    children?: React.ReactNode;
    showSummary?: boolean;
    showTokens?: boolean;
}

const Content = ({ selectedAccount, showSummary, children }: ContentProps) => {
    if (selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

    return (
        <WalletLayout title="Transactions" account={selectedAccount}>
            <PricePanel />
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

export default (props: Props) => {
    const { selectedAccount, transactions } = props;
    const [selectedPage, setSelectedPage] = useState(1);

    const descriptor = selectedAccount.account?.descriptor;
    const symbol = selectedAccount.account?.symbol;
    useEffect(() => {
        // reset page on account change
        setSelectedPage(1);
    }, [descriptor, symbol]);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Transactions" account={props.selectedAccount} />;
    }

    const { account, network } = selectedAccount;

    const accountTransactions = getAccountTransactions(transactions.transactions, account);
    const { size = undefined, total = undefined } = account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(account, page, size);
    };

    if (accountTransactions.length > 0 || transactions.isLoading) {
        return (
            <Content selectedAccount={selectedAccount} showSummary>
                <TransactionList
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    totalPages={total}
                    onPageSelected={onPageSelected}
                    perPage={SETTINGS.TXS_PER_PAGE}
                    symbol={account.symbol}
                    isLoading={transactions.isLoading}
                />
            </Content>
        );
    }

    if (account.empty) {
        return (
            <Content selectedAccount={selectedAccount}>
                <AccountEmpty
                    receive={() => props.goto('wallet-receive', undefined, true)}
                    buy={() => {}}
                />
            </Content>
        );
    }

    return (
        <Content selectedAccount={selectedAccount}>
            <NoTransactions account={account} />
        </Content>
    );
};
