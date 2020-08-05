import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { Card, colors, variables } from '@trezor/components';

import VerifyAddress from './VerifyAddress';
import TransactionId from './TransactionId';
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
    margin-left: 30px;
    padding: 18px 0;
    height: 200px;
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    border-radius: 4px;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Right = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`;

const Row = styled.div`
    display: flex;
    margin: 0 24px;
`;

const Dark = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const RowWithBorder = styled(Row)`
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    margin-bottom: 10px;
    padding-bottom: 10px;
`;

interface Props {
    selectedQuote: BuyTrade | null;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
    if (!selectedQuote) return null;

    const { receiveStringAmount, receiveCurrency, exchange, paymentMethod } = selectedQuote;

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
                    <Right>
                        <Dark>xxxxx</Dark>
                    </Right>
                </Row>
                <RowWithBorder>
                    <Left>buy</Left>
                    <Right>
                        <Dark>{`${receiveStringAmount} ${receiveCurrency}`}</Dark>
                    </Right>
                </RowWithBorder>
                <Row>
                    <Left>provider</Left>
                    <Right>{exchange}</Right>
                </Row>
                <Row>
                    <Left>paid by</Left>
                    <Right>{paymentMethod}</Right>
                </Row>
            </Info>
            <TransactionId transactionId="dbd35574-aa74-49ba-b318-e3c16dbee1d7" />
        </Wrapper>
    );
};

export default SelectedOffer;
