import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { type BuyTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type TradingBuyType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, Card, Column, StepList } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailHeader } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailHeader';
import { TradingDetailStepList } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStepList';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingBuyDetailPaymentFailed } from './TradingBuyDetailPaymentFailed';
import { TradingBuyDetailPaymentProcessingStep } from './TradingBuyDetailPaymentProcessingStep';
import { TradingBuyDetailPaymentSuccessful } from './TradingBuyDetailPaymentSuccessful';
import { TradingBuyDetailPaymentWaitingForUserStep } from './TradingBuyDetailPaymentWaitingForUserStep';
import { TradingBuyDetailSidebar } from './TradingBuyDetailSidebar';
import { getBuyDetailHeaderMessages } from './utils';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus?: BuyTradeStatus) => {
    switch (tradeStatus) {
        case 'SUBMITTED':
        case 'WAITING_FOR_USER':
            return 'waiting';
        case 'APPROVAL_PENDING':
            return 'processing';
        case 'SUCCESS':
            return 'success';
        case 'ERROR':
        case 'BLOCKED':
            return 'error';
        default:
            return undefined;
    }
};

export const TradingBuyDetailContent = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const accounts = useSelector(selectAccounts);
    const { trade, info, account } = useTradingDetailContext<TradingBuyType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status;
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

    const country = trade?.data?.country;

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.wantCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receiveCurrency,
        networkFee: composedTransaction?.composed?.fee,
    };

    const receiveAccount = accounts.find(account => account.key === trade?.receiveAccountKey);
    const waitingStepAccount = receiveAccount ?? account;

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: events.tradeStatusEvent.name,
            payload: {
                type: 'buy',
                status: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep, analytics]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(goto({ routeName: 'wallet-trading-buy' }));

        return null;
    }

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return <TradingBuyDetailPaymentSuccessful trade={trade.data} provider={provider} />;
            case 'error':
                return <TradingBuyDetailPaymentFailed trade={trade.data} provider={provider} />;
            default:
                return (
                    <>
                        <TradingDetailHeader
                            {...getBuyDetailHeaderMessages(tradeStatus)}
                            type={translationString('TR_BUY').toLowerCase()}
                        />
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                {waitingStepAccount && (
                                    <TradingBuyDetailPaymentWaitingForUserStep
                                        trade={trade.data}
                                        account={waitingStepAccount}
                                        providerName={provider?.brandName || provider?.companyName}
                                    />
                                )}
                                <TradingBuyDetailPaymentProcessingStep
                                    trade={trade.data}
                                    provider={provider}
                                />
                                <StepList.Item
                                    state="pending"
                                    title={<Translation id="TR_BUY_COMPLETE" />}
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
                    country={country}
                />
            </Column>
            <TradingBuyDetailSidebar
                receiveAccount={receiveAccount}
                quoteAmounts={quoteAmounts}
                paymentMethod={trade.data.paymentMethod}
                paymentMethodName={trade.data.paymentMethodName}
            />
        </Wrapper>
    );
};
