import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { H2, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

import BuyTransaction from './components/BuyTransaction';
import ExchangeTransaction from './components/ExchangeTransaction';

const AccountTransactions = () => {
    const accountTransactions = useSelector(state => state.wallet.coinmarket.trades);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const providers = useSelector(state => state.wallet.coinmarket.buy.buyInfo?.providerInfos);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;

    return (
        <Wrapper>
            <Header>
                <StyledH2>
                    <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" /> • {accountTransactions.length}
                </StyledH2>
            </Header>
            <Content>
                {accountTransactions.map(trade => {
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

export default AccountTransactions;
