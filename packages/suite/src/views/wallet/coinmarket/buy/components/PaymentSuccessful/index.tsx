import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Button, variables, colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 20px 20px;
    flex-direction: column;
`;

const Image = styled.img``;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px 0;
    max-width: 310px;
    text-align: center;
`;

const PaymentSuccessful = () => {
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/coinmarket-success.svg')} />
            <Title>Paid Successfully</Title>
            <Description>
                Wait for transaction to be confirmed and executed. You can see it in your account as
                unconfirmed for now.
            </Description>
            <Button>Back to Account</Button>
        </Wrapper>
    );
};

export default PaymentSuccessful;
