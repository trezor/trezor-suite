import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { Card } from '@trezor/components';

import VerifyAddress from './VerifyAddress';
// import PaymentFailed from './PaymentFailed';
// import PaymentProcessing from './PaymentProcessing';
// import WaitingForPayment from './WaitingForPayment';
// import PaymentSuccessful from './PaymentSuccessful';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;
`;

const StyledCard = styled(Card)`
    flex: 1;
    justify-content: flex-start;
    padding: 0;
`;

const Info = styled.div`
    min-width: 350px;
    padding-left: 20px;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
`;

interface Props {
    selectedQuote: BuyTrade | null;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    if (!selectedQuote) return null;

    const {
        fiatStringAmount,
        fiatCurrency,
        receiveStringAmount,
        receiveCurrency,
        exchange,
        paymentMethod,
    } = selectedQuote;

    const activeView = 'verifyAddress';

    return (
        <Wrapper>
            <StyledCard>
                {activeView === 'verifyAddress' && <VerifyAddress />}
                {/* {activeView === 'waitingForPayment' && (
                    <WaitingForPayment transactionId="dbd35574-aa74-49ba-b318-e3c16dbee1d7" />
                )}
                {activeView === 'paymentFailed' && (
                    <PaymentFailed transactionId="dbd35574-aa74-49ba-b318-e3c16dbee1d7" />
                )}
                {activeView === 'paymentProcessing' && <PaymentProcessing />}
                {activeView === 'paymentsuccessful' && <PaymentSuccessful />} */}
            </StyledCard>
            <Info>
                <Row>
                    <Left>spend</Left>
                    <Right>{`${fiatStringAmount} ${fiatCurrency}`}</Right>
                </Row>
                <Row>
                    <Left>buy</Left>
                    <Right>{`${receiveStringAmount} ${receiveCurrency}`}</Right>
                </Row>
                <Row>
                    <Left>provider</Left>
                    <Right>{exchange}</Right>
                </Row>
                <Row>
                    <Left>paid by</Left>
                    <Right>{paymentMethod}</Right>
                </Row>
            </Info>
        </Wrapper>
    );
};

export default SelectedOffer;
