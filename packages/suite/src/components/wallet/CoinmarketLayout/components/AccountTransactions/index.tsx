import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { Translation } from '@suite-components';

import BuyTransaction from './components/BuyTransaction';
import ExchangeTransaction from './components/ExchangeTransaction';

const Wrapper = styled.div`
    padding: 60px 0 0 0;
`;

const Content = styled.div``;
const Header = styled.div`
    display: flex;
    align-items: center;
    min-height: 50px;
`;

const AccountTransactions = () => {
    const accountTransactions = useSelector(state => state.wallet.coinmarket.trades);

    return (
        <Wrapper>
            <Header>
                <H2>
                    <Translation id="TR_BUY_ACCOUNT_TRANSACTIONS" /> • {accountTransactions.length}
                </H2>
            </Header>
            <Content>
                {accountTransactions.map(trade => {
                    if (trade.tradeType === 'buy') {
                        return <BuyTransaction trade={trade} />;
                    }

                    if (trade.tradeType === 'exchange') {
                        return <ExchangeTransaction trade={trade} />;
                    }

                    return null;
                })}
            </Content>
        </Wrapper>
    );
};

export default AccountTransactions;
