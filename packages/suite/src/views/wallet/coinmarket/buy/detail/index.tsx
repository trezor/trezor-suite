import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { CoinmarketTopPanel, CoinmarketBuyOfferInfo } from '@wallet-components';
import { variables, Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';

import PaymentFailed from './components/PaymentFailed';
import PaymentProcessing from './components/PaymentProcessing';
import WaitingForPayment from './components/WaitingForPayment';
import PaymentSuccessful from './components/PaymentSuccessful';

const CoinmarketDetail = () => {
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const transactionId = useSelector(state => state.wallet.coinmarket.buy.transactionId);
    const { setLayout } = useContext(LayoutContext);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const trade = trades.find(trade => trade.tradeType === 'buy' && trade.key === transactionId);

    if (!trade || trade?.tradeType !== 'buy') {
        return null;
    }

    const showError = trade.data.status === 'ERROR' || trade.data.status === 'BLOCKED';
    const showProcessing = trade.data.status === 'SUBMITTED';
    const showWaiting = trade.data.status === 'APPROVAL_PENDING';
    const showSuccess = trade.data.status === 'SUCCESS';

    return (
        <Wrapper>
            <StyledCard>
                {showError && <PaymentFailed transactionId={trade.key} paymentGateUrl="someurl" />}
                {showProcessing && <PaymentProcessing />}
                {showWaiting && (
                    <WaitingForPayment transactionId={trade.key} paymentGateUrl="someurl" />
                )}
                {showSuccess && <PaymentSuccessful />}
            </StyledCard>
            <CoinmarketBuyOfferInfo selectedQuote={trade.data} transactionId={trade.key} />
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

export default CoinmarketDetail;
