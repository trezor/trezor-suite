import React, { useEffect, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Card, variables } from '@trezor/components';
import { CoinmarketExchangeOfferInfo, CoinmarketExchangeTopPanel } from '@wallet-components';
import { useCoinmarketExchangeDetailContext } from '@wallet-hooks/useCoinmarketExchangeDetail';
import { ExchangeTradeFinalStatuses } from '@wallet-hooks/useCoinmarket';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';

import PaymentFailed from '../components/PaymentFailed';
import PaymentSuccessful from '../components/PaymentSuccessful';
import PaymentKYC from '../components/PaymentKYC';
import PaymentConverting from '../components/PaymentConverting';
import PaymentSending from '../components/PaymentSending';

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
        if (setLayout)
            setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketExchangeTopPanel />);
    }, [setLayout]);

    const { account, trade, exchangeInfo } = useCoinmarketExchangeDetailContext();
    const { goto } = useActions({ goto: routerActions.goto });

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        goto('wallet-coinmarket-exchange', {
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
        });
        return null;
    }

    const tradeStatus = trade?.data?.status || 'CONFIRMING';

    const showSending =
        !ExchangeTradeFinalStatuses.includes(tradeStatus) && tradeStatus !== 'CONVERTING';

    const exchange = trade?.data?.exchange;
    const provider =
        exchangeInfo && exchangeInfo.providerInfos && exchange
            ? exchangeInfo.providerInfos[exchange]
            : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{orderId}}', trade?.data?.orderId || '');

    return (
        <Wrapper>
            <StyledCard>
                {tradeStatus === 'SUCCESS' && <PaymentSuccessful account={account} />}
                {tradeStatus === 'KYC' && (
                    <PaymentKYC account={account} provider={provider} supportUrl={supportUrl} />
                )}
                {tradeStatus === 'ERROR' && (
                    <PaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'CONVERTING' && <PaymentConverting supportUrl={supportUrl} />}
                {showSending && <PaymentSending supportUrl={supportUrl} />}
            </StyledCard>
            <CoinmarketExchangeOfferInfo
                account={account}
                exchangeInfo={exchangeInfo}
                selectedQuote={trade.data}
                transactionId={trade.key}
            />
        </Wrapper>
    );
};

export default CoinmarketDetail;
