import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { SETTINGS } from '@suite-config';
import { colors, Loader } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { getAccountTransactions, isTestnet } from '@wallet-utils/accountUtils';
import { accountGraphDataFilterFn } from '@wallet-utils/graphUtils';
import NoTransactions from './components/NoTransactions';
import PricePanel from './components/PricePanel/Container';
import TokenList from './components/TokenList';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary';
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

    const accountGraphData = props.graph.data.filter(d => accountGraphDataFilterFn(d, account));
    const accountTransactions = getAccountTransactions(transactions.transactions, account);
    const { size = undefined, total = undefined } = account.page || {};

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        props.fetchTransactions(account, page, size);
    };

    return (
        <WalletLayout title="Transactions" account={props.selectedAccount}>
            <PricePanel />
            {transactions.isLoading && (
                <LoaderWrapper>
                    <Loader size={40} />
                    <LoaderText>
                        <Translation id="TR_LOADING_TRANSACTIONS" />
                    </LoaderText>
                </LoaderWrapper>
            )}
            {accountTransactions.length === 0 && !transactions.isLoading && (
                <NoTransactions
                    receive={() => props.goto('wallet-receive', undefined, true)}
                    buy={() => {}}
                />
            )}
            {accountTransactions.length > 0 && (
                <>
                    {account.networkType !== 'ripple' && (
                        <TransactionSummary
                            account={account}
                            graphData={accountGraphData}
                            updateGraphData={props.updateGraphData}
                        />
                    )}
                    {account.networkType === 'ethereum' && (
                        <TokenList
                            isTestnet={isTestnet(account.symbol)}
                            explorerUrl={network.explorer.account}
                            tokens={account.tokens}
                        />
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
                </>
            )}
        </WalletLayout>
    );
};
