import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

interface Row {
    title: string;
    value: string | ReactElement;
}

interface Props {
    rows: Row[];
}

const Wrapper = styled.div``;

const Item = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    padding-bottom: 5px;

    &:last-child {
        padding-bottom: 0;
    }
`;

const Title = styled.div``;

const Value = styled.div`
    padding-left: 5px;
`;

interface Props {
    transactionInfo: any;
}

const TransactionInfo = (props: Props) => (
    <Wrapper>
        <Item>
            <Title>Fee</Title>:<Value>fee value</Value>
        </Item>
    </Wrapper>
);

export default TransactionInfo;
