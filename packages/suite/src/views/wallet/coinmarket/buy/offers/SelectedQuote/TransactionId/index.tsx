import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Label = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    padding-right: 3px;
`;

const Value = styled.div``;

interface Props {
    transactionId: string;
}

const TransactionId = ({ transactionId }: Props) => {
    return (
        <Wrapper>
            <Label>trans. id:</Label>
            <Value>{transactionId}</Value>
        </Wrapper>
    );
};

export default TransactionId;
