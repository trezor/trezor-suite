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

const TransactionIdRow = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Label = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    padding-right: 3px;
`;

const CancelButton = styled(Button)`
    margin-top: 15px;
`;

const Link = styled.a`
    margin-top: 50px;
`;

interface Props {
    transactionId: string;
    paymentGateUrl: string;
}

const PaymentFailed = ({ transactionId, paymentGateUrl }: Props) => {
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/coinmarket-error.svg')} />
            <Title>Payment Failed</Title>
            <Description>
                Unfortunatelly, your payment has failed. No funds were taken from your credit card.
            </Description>
            <TransactionIdRow>
                <Label>trans. id: </Label>
                {transactionId}
            </TransactionIdRow>
            <Link href={paymentGateUrl}>
                <Button>Start again</Button>
            </Link>
            <CancelButton isWhite variant="tertiary">
                Go to Dashboard
            </CancelButton>
        </Wrapper>
    );
};

export default PaymentFailed;
