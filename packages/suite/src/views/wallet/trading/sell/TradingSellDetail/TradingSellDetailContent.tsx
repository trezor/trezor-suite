import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { usePrevious } from 'react-use';

import { type SellTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useTranslation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type TradingSellType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, Card, Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { AfterTradeExperiment } from 'src/views/wallet/trading/common/TradingDetail/AfterTradeExperiment';
import { TradingDetailHeader } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailHeader';
import { TradingDetailStepList } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStepList';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingSellDetailPaymentFailed } from './TradingSellDetailPaymentFailed';
import { TradingSellDetailPaymentSending } from './TradingSellDetailPaymentSending';
import { TradingSellDetailPaymentSuccessful } from './TradingSellDetailPaymentSuccessful';
import { TradingSellDetailSidebar } from './TradingSellDetailSidebar';
import { getSellDetailHeaderMessages } from './utils';

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

export const TradingSellDetailContent = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const accounts = useSelector(selectAccounts);
    const { trade, info } = useTradingDetailContext<TradingSellType>();
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'PENDING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

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
                    <TradingSellDetailPaymentFailed
                        account={sendAccount!}
                        provider={provider}
                        trade={trade.data}
                    />
                );
            default:
                return (
                    <>
                        <TradingDetailHeader
                            {...getSellDetailHeaderMessages(tradeStatus)}
                            type={translationString('TR_TRADING_SELL').toLowerCase()}
                        />
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                <TradingSellDetailPaymentSending
                                    trade={trade.data}
                                    account={sendAccount}
                                    composedTransaction={composedTransaction}
                                />
                                <TradingSellDetailPaymentSuccessful
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
            <TradingSellDetailSidebar
                sendAccount={sendAccount}
                quoteAmounts={quoteAmounts}
                paymentMethod={trade.data.paymentMethod}
                paymentMethodName={trade.data.paymentMethodName}
            />
        </Wrapper>
    );
};
