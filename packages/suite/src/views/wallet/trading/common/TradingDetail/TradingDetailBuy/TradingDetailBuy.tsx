import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { BuyTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { type TradingBuyType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, BulletList, Card, Column, H3, Paragraph } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { useAnalytics } from 'src/support/useAnalytics';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailBuyPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentFailed';
import { TradingDetailBuyPaymentProcessingStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentProcessingStep';
import { TradingDetailBuyPaymentPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentSuccessful';
import { TradingDetailBuyPaymentWaitingForUserStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentWaitingForUserStep';
import { TradingDetailBuySidebar } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuySidebar';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingDetailStepList } from '../TradingDetailStepList';

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

export const TradingDetailBuy = () => {
    const analytics = useAnalytics();
    const accounts = useSelector(selectAccounts);
    const { trade, info, account } = useTradingDetailContext<TradingBuyType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status;
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;

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
        dispatch(goto('wallet-trading-buy'));

        return null;
    }

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return (
                    <TradingDetailBuyPaymentPaymentSuccessful
                        trade={trade.data}
                        provider={provider}
                    />
                );
            case 'error':
                return <TradingDetailBuyPaymentFailed trade={trade.data} provider={provider} />;
            default:
                return (
                    <>
                        <H3>
                            <Translation id="TR_BUY_HEADER_TITLE" />
                        </H3>
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_TRADING_HEADER_DESCRIPTION"
                                values={{ type: translationString('TR_BUY').toLowerCase() }}
                            />
                        </Paragraph>
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                <TradingDetailBuyPaymentWaitingForUserStep
                                    trade={trade.data}
                                    account={account}
                                    providerName={provider?.brandName || provider?.companyName}
                                />
                                <TradingDetailBuyPaymentProcessingStep
                                    trade={trade.data}
                                    provider={provider}
                                />
                                <BulletList.Item
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
            <TradingDetailBuySidebar
                receiveAccount={receiveAccount}
                quoteAmounts={quoteAmounts}
                paymentMethod={trade.data.paymentMethod}
                paymentMethodName={trade.data.paymentMethodName}
            />
        </Wrapper>
    );
};
