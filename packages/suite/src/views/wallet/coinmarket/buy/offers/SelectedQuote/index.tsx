import React from 'react';
import styled from 'styled-components';
import { BuyTrade } from '@suite/services/invityAPI/buyTypes';
import { Card } from '@trezor/components';

import VerifyAddress from './VerifyAddress';
import OfferInfo from './OfferInfo';
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

interface Props {
    selectedQuote?: BuyTrade;
}

const SelectedOffer = ({ selectedQuote }: Props) => {
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
            <OfferInfo selectedQuote={selectedQuote} />
        </Wrapper>
    );
};

export default SelectedOffer;
