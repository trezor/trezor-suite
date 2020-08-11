import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';

import Transaction from './Transaction';

const Wrapper = styled.div`
    padding: 60px 0 30px 0;
`;

const Content = styled.div``;

const data = [{}, {}, {}];

const PreviousTransactions = () => {
    return (
        <Wrapper>
            <H2>Previous transactions • {data.length}</H2>
            <Content>
                {data.map(transaction => (
                    <Transaction transaction={transaction} />
                ))}
            </Content>
        </Wrapper>
    );
};

export default PreviousTransactions;
