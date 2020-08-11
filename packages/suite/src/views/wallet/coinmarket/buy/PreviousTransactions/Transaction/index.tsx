import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    margin-bottom: 20px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    min-height: 81px;
    border-radius: 4px;

    &:hover {
        background: ${colors.WHITE};
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
        cursor: pointer;
    }
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    padding: 17px 24px;
`;

const Transaction = () => {
    return (
        <Wrapper>
            <Column>1</Column>
            <Column>2</Column>
            <Column>3</Column>
        </Wrapper>
    );
};

export default Transaction;
