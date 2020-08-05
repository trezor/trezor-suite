import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Button, variables, colors } from '@trezor/components';
import TransactionId from '../TransactionId';

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
    max-width: 200px;
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

const WaitingForPayment = ({ transactionId, paymentGateUrl }: Props) => {
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/coinmarket-waiting.svg')} />
            <Title>Waiting for Payment...</Title>
            <Description>
                Please click the link bellow to finish the payment through provider.
            </Description>
            <TransactionId transactionId={transactionId} />
            <Link href={paymentGateUrl}>
                <Button>Go to Payment Gate</Button>
            </Link>
            <CancelButton isWhite variant="tertiary">
                Cancel transaction
            </CancelButton>
        </Wrapper>
    );
};

export default WaitingForPayment;
