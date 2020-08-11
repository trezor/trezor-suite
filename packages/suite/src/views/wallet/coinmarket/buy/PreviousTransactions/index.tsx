import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { useSelector } from '@suite-hooks';

import Transaction from './Transaction';

const Wrapper = styled.div`
    padding: 60px 0 0 0;
`;

const Content = styled.div``;
const Header = styled.div`
    display: flex;
    align-items: center;
    min-height: 50px;
`;

const PreviousTransactions = () => {
    const previousTransactions = useSelector(state => state.wallet.coinmarket.buy.trades);

    return (
        <Wrapper>
            <Header>
                <H2>Previous transactions • {previousTransactions.length}</H2>
            </Header>
            <Content>
                {previousTransactions.map(transaction => (
                    <Transaction transaction={transaction.trade} />
                ))}
            </Content>
        </Wrapper>
    );
};

export default PreviousTransactions;
