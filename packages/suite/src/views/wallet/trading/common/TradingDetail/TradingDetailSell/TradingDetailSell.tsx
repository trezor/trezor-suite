import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { SellTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { type TradingSellType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, Card, Column, H3, Paragraph } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { useAnalytics } from 'src/support/useAnalytics';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailSellPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentFailed';
import { TradingDetailSellPaymentSending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentSending';
import { TradingDetailSellPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentSuccessful';
import { TradingDetailSellSidebar } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSellSidebar';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingDetailStepList } from '../TradingDetailStepList';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus: SellTradeStatus) => {
    switch (tradeStatus) {
        case 'SUCCESS':
            return 'success';
        default: {
            return tradeFinalStatuses['sell'].includes(tradeStatus) ? 'error' : 'pending';
        }
    }
};

export const TradingDetailSell = () => {
    const analytics = useAnalytics();
    const accounts = useSelector(selectAccounts);
    const { trade, info } = useTradingDetailContext<TradingSellType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'PENDING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;

    const country = trade?.data?.country;

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.amountInCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.cryptoStringAmount ?? '',
        receiveCurrency: trade?.data?.cryptoCurrency,
        networkFee: composedTransaction?.composed?.fee,
    };

    const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus) {
            return;
        }

        analytics.report({
            type: events.tradeStatusEvent.name,
            payload: {
                type: 'sell',
                status: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep, analytics]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(goto({ routeName: 'wallet-trading-sell' }));

        return null;
    }

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'error':
                return (
                    <TradingDetailSellPaymentFailed
                        account={sendAccount!}
                        provider={provider}
                        trade={trade.data}
                    />
                );
            default:
                return (
                    <>
                        <H3>
                            <Translation id="TR_SELL_HEADER_TITLE" />
                        </H3>
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_TRADING_HEADER_DESCRIPTION"
                                values={{
                                    type: translationString('TR_TRADING_SELL').toLowerCase(),
                                }}
                            />
                        </Paragraph>
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                <TradingDetailSellPaymentSending
                                    trade={trade.data}
                                    account={sendAccount}
                                    composedTransaction={composedTransaction}
                                />
                                <TradingDetailSellPaymentSuccessful
                                    trade={trade.data}
                                    provider={provider}
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
            <TradingDetailSellSidebar
                sendAccount={sendAccount}
                quoteAmounts={quoteAmounts}
                paymentMethod={trade.data.paymentMethod}
                paymentMethodName={trade.data.paymentMethodName}
            />
        </Wrapper>
    );
};
