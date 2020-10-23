import React, { useEffect, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext, Translation } from '@suite-components';
import { Card, variables } from '@trezor/components';
import { CoinmarketBuyOfferInfo, CoinmarketTopPanel } from '@wallet-components';
import { useCoinmarketBuyDetailContext } from '@wallet-hooks/useCoinmarketBuyDetail';

import PaymentFailed from '../components/PaymentFailed';
import PaymentProcessing from '../components/PaymentProcessing';
import PaymentSuccessful from '../components/PaymentSuccessful';
import WaitingForPayment from '../components/WaitingForPayment';

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

const CoinmarketDetail = () => {
    const { setLayout } = useContext(LayoutContext);

    useEffect(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    const { account, trade, buyInfo } = useCoinmarketBuyDetailContext();
    const tradeStatus = trade?.data?.status;
    const showError = tradeStatus === 'ERROR' || tradeStatus === 'BLOCKED';
    const showProcessing = tradeStatus === 'APPROVAL_PENDING';
    const showWaiting = tradeStatus === 'SUBMITTED';
    const showSuccess = tradeStatus === 'SUCCESS';

    const exchange = trade?.data?.exchange;
    const provider =
        buyInfo && buyInfo.providerInfos && exchange ? buyInfo.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{paymentId}}', trade?.data?.paymentId || '');

    return (
        <Wrapper>
            {!trade && (
                <NoTradeError>
                    <Translation id="TR_COINMARKET_TRADE_NOT_FOUND" />
                </NoTradeError>
            )}
            {trade && (
                <>
                    <StyledCard>
                        {showError && (
                            <PaymentFailed
                                account={account}
                                transactionId={trade.key}
                                supportUrl={supportUrl}
                            />
                        )}
                        {showProcessing && <PaymentProcessing />}
                        {showWaiting && (
                            <WaitingForPayment
                                trade={trade.data}
                                transactionId={trade.key}
                                account={account}
                            />
                        )}
                        {showSuccess && <PaymentSuccessful account={account} />}
                    </StyledCard>
                    <CoinmarketBuyOfferInfo
                        account={account}
                        selectedQuote={trade.data}
                        transactionId={trade.key}
                        providers={buyInfo?.providerInfos}
                    />
                </>
            )}
        </Wrapper>
    );
};

export default CoinmarketDetail;
