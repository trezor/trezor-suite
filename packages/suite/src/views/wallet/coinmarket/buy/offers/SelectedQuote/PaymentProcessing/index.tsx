import React from 'react';
import styled from 'styled-components';
import { variables, Loader } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 20px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const PaymentProcessing = () => {
    return (
        <Wrapper>
            <Loader />
            <Title>Processing your payment, please wait...</Title>
        </Wrapper>
    );
};

export default PaymentProcessing;
