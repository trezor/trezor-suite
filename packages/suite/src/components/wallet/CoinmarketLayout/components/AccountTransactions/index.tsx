import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { H2, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

import BuyTransaction from './components/BuyTransaction';
import ExchangeTransaction from './components/ExchangeTransaction';

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
    const { selectedAccount, allTransactions, buyProviders, exchangeProviders } = useSelector(
        state => ({
            selectedAccount: state.wallet.selectedAccount,
            allTransactions: state.wallet.coinmarket.trades,
            buyProviders: state.wallet.coinmarket.buy.buyInfo?.providerInfos,
            exchangeProviders: state.wallet.coinmarket.exchange.exchangeInfo?.providerInfos,
        }),
    );

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
                                {buyTransactions.length} <Translation id="TR_COINMARKET_BUYS" /> •{' '}
                                {exchangeTransactions.length}{' '}
                                <Translation id="TR_COINMARKET_EXCHANGES" />
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

                            return null;
                        })}
                    </Content>
                </>
            )}
        </Wrapper>
    );
};

export default AccountTransactions;
