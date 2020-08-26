import React, { useMemo, useContext } from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import useSWR from 'swr';
import invityAPI from '@suite/services/invityAPI';
import { CoinmarketTopPanel } from '@wallet-components';
import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';

import PaymentFailed from './components/PaymentFailed';
import PaymentProcessing from './components/PaymentProcessing';
import WaitingForPayment from './components/WaitingForPayment';
import PaymentSuccessful from './components/PaymentSuccessful';

const Wrapper = styled.div`
    padding: 16px 32px 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }
`;

const Detail = () => {
    const transactionId = useSelector(state => state.wallet.coinmarket.buy.transactionId);
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const { setLayout } = useContext(LayoutContext);
    const trade = trades.find(
        trade => trade.tradeType === 'buy' && trade.data.paymentId === transactionId,
    );

    console.log('trade', trade);

    invityAPI.createInvityAPIKey('111111');

    // @ts-ignore TODO
    const fetcher = () => invityAPI.watchBuyTrade(trade.data, 0);
    const { data, error } = useSWR(`watch/buy/trade`, fetcher);

    useMemo(() => {
        if (setLayout) setLayout('Trezor Suite | Coinmarket', undefined, <CoinmarketTopPanel />);
    }, [setLayout]);

    console.log('data', data);
    console.log('error', error);

    if (!trade || trade?.tradeType !== 'buy') return null;

    return (
        <Wrapper>
            {trade.data.status === 'ERROR' ||
                (trade.data.status === 'BLOCKED' && (
                    <PaymentFailed transactionId={trade.data.paymentId} paymentGateUrl="someurl" />
                ))}
            {trade.data.status === 'SUBMITTED' && <PaymentProcessing />}
            {trade.data.status === 'APPROVAL_PENDING' && (
                <WaitingForPayment transactionId={trade.data.paymentId} paymentGateUrl="someurl" />
            )}
            {trade.data.status === 'SUCCESS' && <PaymentSuccessful />}
        </Wrapper>
    );
};

export default Detail;
