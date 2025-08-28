import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { SellTradeStatus } from 'invity-api';
import styled from 'styled-components';

import {
    type TradingSellType,
    selectTradingComposedTransactionInfo,
    selectTradingSellFormStep,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Card, Column } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailFeedback } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailFeedback';
import { TradingDetailSellPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentFailed';
import { TradingDetailSellPaymentPending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentPending';
import { TradingDetailSellPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentSuccessful';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

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
    const accounts = useSelector(selectAccounts);
    const { account, trade, info } = useTradingDetailContext<TradingSellType>();
    const dispatch = useDispatch();

    const tradeStatus = trade?.data?.status || 'PENDING';
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const formStep = useSelector(selectTradingSellFormStep);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{orderId}}', trade?.data?.orderId || '');

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
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: EventType.TradingStatus,
            payload: {
                type: 'sell',
                status: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-trading-sell', {
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
        <Wrapper>
            <Column gap={spacings.lg}>
                <Card>
                    {tradeStatusStep === 'success' && sendAccount && (
                        <TradingDetailSellPaymentSuccessful account={sendAccount} />
                    )}
                    {tradeStatusStep === 'error' && sendAccount && (
                        <TradingDetailSellPaymentFailed
                            account={sendAccount}
                            transactionId={trade.key}
                            supportUrl={supportUrl}
                        />
                    )}
                    {tradeStatusStep === 'pending' && (
                        <TradingDetailSellPaymentPending supportUrl={supportUrl} />
                    )}
                </Card>
                <TradingDetailFeedback
                    status={tradeStatus}
                    type={trade.tradeType}
                    provider={provider?.name}
                    id={trade.data.id}
                    quoteAmounts={quoteAmounts}
                />
            </Column>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    selectedAccount={sendAccount}
                    providers={info?.providerInfos}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    type="sell"
                    quoteAmounts={quoteAmounts}
                    formStep={formStep}
                />
            </Card>
        </Wrapper>
    );
};
