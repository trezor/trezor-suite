import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { BuyTradeStatus } from 'invity-api';
import styled from 'styled-components';

import type { TradingBuyType } from '@suite-common/trading';
import { Card } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailBuyPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentFailed';
import { TradingDetailBuyPaymentProcessing } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentProcessing';
import { TradingDetailBuyPaymentPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentSuccessful';
import { TradingDetailBuyPaymentWaitingForUser } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentWaitingForUser';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus?: BuyTradeStatus) => {
    switch (tradeStatus) {
        case 'SUBMITTED':
        case 'WAITING_FOR_USER':
            return 'status-waiting';
        case 'APPROVAL_PENDING':
            return 'status-processing';
        case 'SUCCESS':
            return 'status-success';
        case 'ERROR':
        case 'BLOCKED':
            return 'status-error';
        default:
            return undefined;
    }
};

export const TradingDetailBuy = () => {
    const { trade, info, account } = useTradingDetailContext<TradingBuyType>();
    const dispatch = useDispatch();

    const tradeStatus = trade?.data?.status;
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{paymentId}}', trade?.data?.paymentId || '');

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.wantCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receiveCurrency,
    };

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: EventType.TradingBuy,
            payload: {
                action: 'continue',
                step: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-trading-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    return (
        <Wrapper data-testid="@trading/transaction/detail">
            <Card data-testid="@trading/transaction/detail/status-card">
                {tradeStatusStep === 'status-error' && (
                    <TradingDetailBuyPaymentFailed account={account} supportUrl={supportUrl} />
                )}
                {tradeStatusStep === 'status-processing' && <TradingDetailBuyPaymentProcessing />}
                {tradeStatusStep === 'status-waiting' && (
                    <TradingDetailBuyPaymentWaitingForUser
                        trade={trade.data}
                        account={account}
                        providerName={provider?.brandName || provider?.companyName}
                    />
                )}
                {tradeStatusStep === 'status-success' && (
                    <TradingDetailBuyPaymentPaymentSuccessful account={account} />
                )}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    quoteAmounts={quoteAmounts}
                    type="buy"
                />
            </Card>
        </Wrapper>
    );
};
