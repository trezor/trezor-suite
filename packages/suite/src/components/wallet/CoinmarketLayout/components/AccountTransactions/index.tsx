import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { H2, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

import BuyTransaction from './components/BuyTransaction';
import SellTransaction from './components/SellTransaction';
import ExchangeTransaction from './components/ExchangeTransaction';
import SpendTransaction from './components/SpendTransaction';

const Wrapper = styled.div`
    padding: 64px 0 0 0;
`;

const Content = styled.div``;
const Header = styled.div`
    display: flex;
    align-items: center;
    padding-bottom: 32px;
`;

const NoTransactions = styled.div`
    display: flex;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledH2 = styled(H2)`
    display: flex;
    flex-direction: column;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TransactionCount = styled.div`
    margin-top: 6px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const AccountTransactions = () => {
    const {
        selectedAccount,
        allTransactions,
        buyProviders,
        exchangeProviders,
        sellProviders,
    } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        allTransactions: state.wallet.coinmarket.trades,
        buyProviders: state.wallet.coinmarket.buy.buyInfo?.providerInfos,
        exchangeProviders: state.wallet.coinmarket.exchange.exchangeInfo?.providerInfos,
        sellProviders: state.wallet.coinmarket.sell.sellInfo?.providerInfos,
    }));

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;
    const sortedAccountTransactions = [...allTransactions]
        .filter(t => t.account.descriptor === account.descriptor)
        .sort((a, b) => {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;
            return 0;
        });

    const buyTransactions = sortedAccountTransactions.filter(tx => tx.tradeType === 'buy');
    const exchangeTransactions = sortedAccountTransactions.filter(
        tx => tx.tradeType === 'exchange',
    );
    const spendTransactions = sortedAccountTransactions.filter(tx => tx.tradeType === 'spend');
    const sellTransactions = sortedAccountTransactions.filter(tx => tx.tradeType === 'sell');

    return (
        <Wrapper>
            {sortedAccountTransactions.length === 0 && (
                <NoTransactions>
                    <Translation id="TR_BUY_NOT_TRANSACTIONS" />
                </NoTransactions>
            )}
            {sortedAccountTransactions.length > 0 && (
                <>
                    <Header>
                        <StyledH2>
                            <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" />
                            <TransactionCount>
                                {buyTransactions.length} <Translation id="TR_TRADE_BUYS" /> •{' '}
                                {sellTransactions.length} <Translation id="TR_TRADE_SELLS" /> •{' '}
                                {exchangeTransactions.length}{' '}
                                <Translation id="TR_TRADE_EXCHANGES" /> • {spendTransactions.length}{' '}
                                <Translation id="TR_TRADE_SPENDS" />
                            </TransactionCount>
                        </StyledH2>
                    </Header>
                    <Content>
                        {sortedAccountTransactions.map(trade => {
                            if (trade.tradeType === 'buy') {
                                return (
                                    <BuyTransaction
                                        account={account}
                                        key={`${trade.tradeType}-${trade.key}`}
                                        trade={trade}
                                        providers={buyProviders}
                                    />
                                );
                            }
                            if (trade.tradeType === 'sell') {
                                return (
                                    <SellTransaction
                                        account={account}
                                        key={`${trade.tradeType}-${trade.key}`}
                                        trade={trade}
                                        providers={sellProviders}
                                    />
                                );
                            }
                            if (trade.tradeType === 'exchange') {
                                return (
                                    <ExchangeTransaction
                                        account={account}
                                        key={`${trade.tradeType}-${trade.key}`}
                                        trade={trade}
                                        providers={exchangeProviders}
                                    />
                                );
                            }
                            if (trade.tradeType === 'spend') {
                                return (
                                    <SpendTransaction
                                        key={`${trade.tradeType}-${trade.key}`}
                                        trade={trade}
                                        providers={sellProviders}
                                    />
                                );
                            }

                            return null;
                        })}
                    </Content>
                </>
            )}
        </Wrapper>
    );
};

export default AccountTransactions;
