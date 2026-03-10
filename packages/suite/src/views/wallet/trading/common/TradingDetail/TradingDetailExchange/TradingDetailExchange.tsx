import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { ExchangeTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import {
    type TradingExchangeType,
    selectTradingComposedTransactionInfo,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, BulletList, Card, Column, H3, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { useAnalytics } from 'src/support/useAnalytics';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailExchangePaymentConverting } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentConverting';
import { TradingDetailExchangePaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentFailed';
import { TradingDetailExchangePaymentKYC } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentKYC';
import { TradingDetailExchangePaymentSending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSending';
import { TradingDetailExchangePaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSuccessful';
import { TradingDetailExchangeSidebar } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchangeSidebar';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingDetailStepList } from '../TradingDetailStepList';

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

export const TradingDetailExchange = () => {
    const analytics = useAnalytics();
    const accounts = useSelector(selectAccounts);
    const { trade, info } = useTradingDetailContext<TradingExchangeType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{orderId}}', trade?.data?.orderId || '');

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        sendAmount: trade?.data?.sendStringAmount ?? '',
        sendCurrency: trade?.data?.send,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receive,
        networkFee: composedTransaction?.composed?.fee,
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
        dispatch(goto('wallet-trading-exchange'));

        return null;
    }

    const sendAccount = accounts.find(account => account.key === trade.sendAccountKey);
    const receiveAccount = accounts.find(account => account.key === trade.receiveAccountKey);

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return (
                    <TradingDetailExchangePaymentSuccessful
                        trade={trade.data}
                        account={sendAccount}
                        provider={provider}
                    />
                );
            case 'error':
                return (
                    <TradingDetailExchangePaymentFailed
                        trade={trade.data}
                        account={sendAccount}
                        provider={provider}
                    />
                );
            case 'kyc':
                return (
                    <TradingDetailExchangePaymentKYC
                        trade={trade.data}
                        account={sendAccount}
                        provider={provider}
                        supportUrl={supportUrl}
                    />
                );
            default:
                return (
                    <>
                        <H3>
                            <Translation id="TR_EXCHANGE_HEADER_TITLE" />
                        </H3>
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_TRADING_HEADER_DESCRIPTION"
                                values={{
                                    type: translationString('TR_TRADING_SWAP').toLowerCase(),
                                }}
                            />
                        </Paragraph>
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                <TradingDetailExchangePaymentSending
                                    trade={trade.data}
                                    account={sendAccount}
                                    composedTransaction={composedTransaction}
                                />
                                <TradingDetailExchangePaymentConverting
                                    trade={trade.data}
                                    provider={provider}
                                />
                                <BulletList.Item
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
            <TradingDetailExchangeSidebar
                sendAccount={sendAccount}
                receiveAccount={receiveAccount}
                trade={trade.data}
                providers={info?.providerInfos}
            />
        </Wrapper>
    );
};
