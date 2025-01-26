import styled from 'styled-components';

import { Card } from '@trezor/components';
import type { TradingSellType } from '@suite-common/invity';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingDetailSellPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentSuccessful';
import { TradingDetailSellPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentFailed';
import { TradingDetailSellPaymentPending } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSell/TradingDetailSellPaymentPending';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

export const TradingDetailSell = () => {
    const { account, trade, info } = useTradingDetailContext<TradingSellType>();
    const dispatch = useDispatch();

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

    const tradeStatus = trade?.data?.status || 'PENDING';
    const sellFiatTradeFinalStatuses = tradeFinalStatuses['sell'];
    const showPending = !sellFiatTradeFinalStatuses.includes(tradeStatus);

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
    };

    return (
        <Wrapper>
            <Card>
                {tradeStatus === 'SUCCESS' && (
                    <TradingDetailSellPaymentSuccessful account={account} />
                )}
                {sellFiatTradeFinalStatuses.includes(tradeStatus) && tradeStatus !== 'SUCCESS' && (
                    <TradingDetailSellPaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {showPending && <TradingDetailSellPaymentPending supportUrl={supportUrl} />}
            </Card>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    providers={info?.providerInfos}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    type="sell"
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </Wrapper>
    );
};
