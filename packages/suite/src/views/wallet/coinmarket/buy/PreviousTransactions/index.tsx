import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';

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

const data = [{}, {}, {}];

const PreviousTransactions = () => {
    return (
        <Wrapper>
            <Header>
                <H2>Previous transactions • {data.length}</H2>
            </Header>
            <Content>
                {data.map(() => (
                    <Transaction />
                ))}
            </Content>
        </Wrapper>
    );
};

export default PreviousTransactions;
