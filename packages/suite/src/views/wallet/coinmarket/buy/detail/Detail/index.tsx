import React, { useEffect, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Card, variables } from '@trezor/components';
import { CoinmarketBuyOfferInfo, CoinmarketBuyTopPanel } from '@wallet-components';
import { useCoinmarketBuyDetailContext } from '@wallet-hooks/useCoinmarketBuyDetail';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

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

const CoinmarketDetail = () => {
    const { setLayout } = useContext(LayoutContext);

    useEffect(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketBuyTopPanel />);
    }, [setLayout]);

    const { account, trade, buyInfo } = useCoinmarketBuyDetailContext();
    const { goto } = useActions({ goto: routerActions.goto });

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        goto('wallet-coinmarket-buy', {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        });
        return null;
    }

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
        </Wrapper>
    );
};

export default CoinmarketDetail;
