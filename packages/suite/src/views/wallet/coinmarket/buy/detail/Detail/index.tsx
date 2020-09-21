import React, { useContext, useMemo } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Card, variables } from '@trezor/components';
import { CoinmarketBuyOfferInfo, CoinmarketTopPanel } from '@wallet-components';
import { useCoinmarketBuyDetailContext } from '@wallet-hooks/useCoinmarketBuyDetail';

import PaymentFailed from '../components/PaymentFailed';
import PaymentProcessing from '../components/PaymentProcessing';
import PaymentSuccessful from '../components/PaymentSuccessful';
import WaitingForPayment from '../components/WaitingForPayment';

const CoinmarketDetail = () => {
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const { account, trade } = useCoinmarketBuyDetailContext();
    const tradeStatus = trade?.data?.status;
    const showError = tradeStatus === 'ERROR' || tradeStatus === 'BLOCKED';
    const showProcessing = tradeStatus === 'SUBMITTED';
    const showWaiting = tradeStatus === 'APPROVAL_PENDING';
    const showSuccess = tradeStatus === 'SUCCESS';

    return (
        <Wrapper>
            {!trade && <NoTradeError>No trade found</NoTradeError>}
            {trade && (
                <>
                    <StyledCard>
                        {showError && (
                            <PaymentFailed transactionId={trade.key} paymentGateUrl="someurl" />
                        )}
                        {showProcessing && <PaymentProcessing />}
                        {showWaiting && (
                            <WaitingForPayment transactionId={trade.key} paymentGateUrl="someurl" />
                        )}
                        {showSuccess && <PaymentSuccessful />}
                    </StyledCard>
                    <CoinmarketBuyOfferInfo
                        account={account}
                        selectedQuote={trade.data}
                        transactionId={trade.key}
                    />
                </>
            )}
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

const NoTradeError = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

export default CoinmarketDetail;
