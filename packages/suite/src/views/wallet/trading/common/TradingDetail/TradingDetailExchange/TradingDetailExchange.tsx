import styled from 'styled-components';

import type { TradingExchangeType } from '@suite-common/invity';
import { Card } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailExchangePaymentConverting } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentConverting';
import { TradingDetailExchangePaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentFailed';
import { TradingDetailExchangePaymentKYC } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentKYC';
import { TradingDetailExchangePaymentSending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSending';
import { TradingDetailExchangePaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchangePaymentSuccessful';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

export const TradingDetailExchange = () => {
    const { account, trade, info } = useTradingDetailContext<TradingExchangeType>();
    const dispatch = useDispatch();

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-trading-exchange', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const exchangeTradeFinalStatuses = tradeFinalStatuses['exchange'];
    const showSending =
        !exchangeTradeFinalStatuses.includes(tradeStatus) && tradeStatus !== 'CONVERTING';

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
    };

    return (
        <Wrapper>
            <Card>
                {tradeStatus === 'SUCCESS' && (
                    <TradingDetailExchangePaymentSuccessful account={account} />
                )}
                {tradeStatus === 'KYC' && (
                    <TradingDetailExchangePaymentKYC
                        account={account}
                        provider={provider}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'ERROR' && (
                    <TradingDetailExchangePaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'CONVERTING' && (
                    <TradingDetailExchangePaymentConverting supportUrl={supportUrl} />
                )}
                {showSending && <TradingDetailExchangePaymentSending supportUrl={supportUrl} />}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    type="exchange"
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </Wrapper>
    );
};
