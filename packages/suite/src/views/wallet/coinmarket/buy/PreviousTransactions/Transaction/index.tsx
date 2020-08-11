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
`;

const Column = styled.div`
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
