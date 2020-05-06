import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTokenList } from '@wallet-hooks/useTokenList';
import { Translation, DataProviderContext } from '@suite-components';
import { SETTINGS } from '@suite-config';
import { colors, Loader } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions, isTestnet } from '@wallet-utils/accountUtils';
import NoTransactions from './components/NoTransactions';
import AccountEmpty from './components/AccountEmpty';
import PricePanel from './components/PricePanel/Container';
import TokenList from './components/TokenList';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary/Container';
import { Props } from './Container';

const LoaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
`;
const LoaderText = styled.div`
    color: ${colors.BLACK0};
    text-align: center;
`;

interface ContentProps {
    selectedAccount: Props['selectedAccount'];
    children: React.ReactNode;
}

const Content = ({ selectedAccount, children }: ContentProps) => (
    <WalletLayout title="Transactions" account={selectedAccount}>
        <PricePanel />
        {children}
    </WalletLayout>
);

interface DataProviderContext {
    supportedTokenIcons: string[] | null;
}

export const DataProviderContext = React.createContext<DataProviderContext>({
    supportedTokenIcons: null,
});

export default (props: Props) => {
    const { selectedAccount, transactions } = props;
    const [selectedPage, setSelectedPage] = useState(1);
    const tokenList = useTokenList();

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

    if (transactions.isLoading) {
        return (
            <Content selectedAccount={selectedAccount}>
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>
                        <Translation id="TR_LOADING_TRANSACTIONS" />
                    </LoaderText>
                </LoaderWrapper>
            </Content>
        );
    }

    if (accountTransactions.length > 0) {
        return (
            <Content selectedAccount={selectedAccount}>
                {account.networkType !== 'ripple' && <TransactionSummary account={account} />}
                {account.networkType === 'ethereum' && (
                    <DataProviderContext.Provider value={{ supportedTokenIcons: tokenList }}>
                        <TokenList
                            isTestnet={isTestnet(account.symbol)}
                            explorerUrl={network.explorer.account}
                            tokens={account.tokens}
                        />
                    </DataProviderContext.Provider>
                )}
                <TransactionList
                    explorerUrl={network.explorer.tx}
                    transactions={accountTransactions}
                    currentPage={selectedPage}
                    totalPages={total}
                    onPageSelected={onPageSelected}
                    perPage={SETTINGS.TXS_PER_PAGE}
                    symbol={account.symbol}
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
