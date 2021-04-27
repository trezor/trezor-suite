import React from 'react';
import styled from 'styled-components';
import { variables, Loader, Button, Link } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledLink = styled(Link)`
    margin-top: 50px;
`;

interface Props {
    supportUrl?: string;
}

const PaymentConverting = ({ supportUrl }: Props) => (
    <Wrapper>
        <Loader />
        <Title>
            <Translation id="TR_EXCHANGE_DETAIL_CONVERTING_TITLE" />
        </Title>
        {supportUrl && (
            <StyledLink href={supportUrl} target="_blank">
                <Button variant="tertiary">
                    <Translation id="TR_EXCHANGE_DETAIL_CONVERTING_SUPPORT" />
                </Button>
            </StyledLink>
        )}
    </Wrapper>
);

export default PaymentConverting;
