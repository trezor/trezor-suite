import styled from 'styled-components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useCoinmarketDetailContext } from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import {
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketTradeExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import {
    CoinmarketLeftWrapper,
    CoinmarketRightWrapper,
    CoinmarketWrapper,
} from 'src/views/wallet/coinmarket';
import { CoinmarketDetailExchangePaymentSuccessful } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchangePaymentSuccessful';
import { CoinmarketDetailExchangePaymentKYC } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchangePaymentKYC';
import { CoinmarketDetailExchangePaymentFailed } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchangePaymentFailed';
import { CoinmarketDetailExchangePaymentConverting } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchangePaymentConverting';
import { CoinmarketDetailExchangePaymentSending } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailExchange/CoinmarketDetailExchangePaymentSending';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

export const CoinmarketDetailExchange = () => {
    const { account, trade, info } = useCoinmarketDetailContext<CoinmarketTradeExchangeType>();
    const dispatch = useDispatch();

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-coinmarket-exchange', {
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

    const quoteAmounts: CoinmarketGetCryptoQuoteAmountProps = {
        sendAmount: trade?.data?.sendStringAmount ?? '',
        sendCurrency: trade?.data?.send,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receive,
    };

    return (
        <Wrapper>
            <CoinmarketLeftWrapper>
                {tradeStatus === 'SUCCESS' && (
                    <CoinmarketDetailExchangePaymentSuccessful account={account} />
                )}
                {tradeStatus === 'KYC' && (
                    <CoinmarketDetailExchangePaymentKYC
                        account={account}
                        provider={provider}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'ERROR' && (
                    <CoinmarketDetailExchangePaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'CONVERTING' && (
                    <CoinmarketDetailExchangePaymentConverting supportUrl={supportUrl} />
                )}
                {showSending && <CoinmarketDetailExchangePaymentSending supportUrl={supportUrl} />}
            </CoinmarketLeftWrapper>
            <CoinmarketRightWrapper>
                <CoinmarketSelectedOfferInfo
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    type="exchange"
                    quoteAmounts={quoteAmounts}
                />
            </CoinmarketRightWrapper>
        </Wrapper>
    );
};
