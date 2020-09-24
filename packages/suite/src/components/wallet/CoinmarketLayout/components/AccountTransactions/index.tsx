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

const StyledH2 = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountTransactions = () => {
    const allTransactions = useSelector(state => state.wallet.coinmarket.trades);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const providers = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.providerInfos);

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

    return (
        <Wrapper>
            <Header>
                <StyledH2>
                    <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" /> •{' '}
                    {sortedAccountTransactions.length}
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
                                providers={providers}
                            />
                        );
                    }

                    if (trade.tradeType === 'exchange') {
                        return (
                            <ExchangeTransaction
                                key={`${trade.tradeType}-${trade.key}`}
                                trade={trade}
                                providers={providers}
                            />
                        );
                    }

                    return null;
                })}
            </Content>
        </Wrapper>
    );
};

export default AccountTransactions;
