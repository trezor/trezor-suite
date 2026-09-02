import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { type ExchangeTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingExchangeType,
    selectTradingComposedTransactionInfo,
    selectTradingDisplayComposedFee,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, Card, Column, StepList } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailHeader } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailHeader';
import { TradingDetailStepList } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStepList';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingExchangeDetailPaymentConverting } from './TradingExchangeDetailPaymentConverting';
import { TradingExchangeDetailPaymentFailed } from './TradingExchangeDetailPaymentFailed';
import { TradingExchangeDetailPaymentKYC } from './TradingExchangeDetailPaymentKYC';
import { TradingExchangeDetailPaymentSending } from './TradingExchangeDetailPaymentSending';
import { TradingExchangeDetailPaymentSuccessful } from './TradingExchangeDetailPaymentSuccessful';
import { TradingExchangeDetailSidebar } from './TradingExchangeDetailSidebar';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus: ExchangeTradeStatus) => {
    switch (tradeStatus) {
        case 'CONVERTING':
            return 'converting';
        case 'KYC':
            return 'kyc';
        case 'ERROR':
            return 'error';
        case 'SUCCESS':
            return 'success';
        default: {
            if (!tradeFinalStatuses['exchange'].includes(tradeStatus)) {
                return 'sending';
            }

            return undefined;
        }
    }
};

export const TradingExchangeDetailContent = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const accounts = useSelector(selectAccounts);
    const { trade, info } = useTradingDetailContext<TradingExchangeType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

    const networkFee = useSelector(state => selectTradingDisplayComposedFee(state, trade?.data));

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        sendAmount: trade?.data?.sendStringAmount ?? '',
        sendCurrency: trade?.data?.send,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receive,
        networkFee,
    };

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: events.tradeStatusEvent.name,
            payload: {
                type: 'exchange',
                status: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep, analytics]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));

        return null;
    }

    const sendAccount = accounts.find(account => account.key === trade.sendAccountKey);
    const receiveAccount = accounts.find(account => account.key === trade.receiveAccountKey);

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return (
                    <TradingExchangeDetailPaymentSuccessful
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                    />
                );
            case 'error':
                return (
                    <TradingExchangeDetailPaymentFailed
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                    />
                );
            case 'kyc':
                return (
                    <TradingExchangeDetailPaymentKYC
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                        supportUrl={provider?.supportUrl}
                    />
                );
            default:
                return (
                    <>
                        <TradingDetailHeader
                            title="TR_TRADING_HEADER_PROCESSING_TITLE"
                            description="TR_TRADING_HEADER_PROCESSING_DESCRIPTION"
                            type={translationString('TR_TRADING_SWAP').toLowerCase()}
                        />
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                {!trade.data.isDex && (
                                    <TradingExchangeDetailPaymentSending
                                        trade={trade.data}
                                        account={sendAccount}
                                        receiveAccountKey={trade.receiveAccountKey}
                                        composedTransaction={composedTransaction}
                                    />
                                )}
                                <TradingExchangeDetailPaymentConverting
                                    trade={trade.data}
                                    provider={provider}
                                    account={trade.data.isDex ? sendAccount : undefined}
                                    receiveAccountKey={trade.receiveAccountKey}
                                    isDex={trade.data.isDex}
                                />
                                <StepList.Item
                                    state="pending"
                                    title={<Translation id="TR_EXCHANGE_COMPLETE" />}
                                />
                            </TradingDetailStepList>
                        </Box>
                    </>
                );
        }
    };

    return (
        <Wrapper data-testid="@trading/transaction/detail">
            <Column gap={20}>
                <Card paddingType="large" data-testid="@trading/transaction/detail/status-card">
                    {getContent()}
                </Card>
                <AfterTradeExperiment
                    status={tradeStatus}
                    type={trade.tradeType}
                    provider={provider?.name}
                    id={trade.data.id}
                    quoteAmounts={quoteAmounts}
                />
            </Column>
            <TradingExchangeDetailSidebar
                sendAccount={sendAccount}
                receiveAccount={receiveAccount}
                trade={trade.data}
                providers={info?.providerInfos}
            />
        </Wrapper>
    );
};
