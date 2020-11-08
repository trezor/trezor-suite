import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import { Translation } from '@suite-components';

interface Props {
    transactionId: string;
    className?: string;
}

const Wrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    padding-right: 3px;
    white-space: nowrap;
`;

const Value = styled.div``;

const TransactionId = ({ transactionId, className }: Props) => {
    return (
        <Wrapper className={className}>
            <Label>
                <Translation id="TR_BUY_TRANS_ID" />
            </Label>
            <Value>{transactionId}</Value>
        </Wrapper>
    );
};

export default TransactionId;
