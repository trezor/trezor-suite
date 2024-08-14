import styled from 'styled-components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import PaymentFailed from '../components/PaymentFailed';
import PaymentSuccessful from '../components/PaymentSuccessful';
import PaymentKYC from '../components/PaymentKYC';
import PaymentConverting from '../components/PaymentConverting';
import PaymentSending from '../components/PaymentSending';
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

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

const CoinmarketDetail = () => {
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
                {tradeStatus === 'SUCCESS' && <PaymentSuccessful account={account} />}
                {tradeStatus === 'KYC' && (
                    <PaymentKYC account={account} provider={provider} supportUrl={supportUrl} />
                )}
                {tradeStatus === 'ERROR' && (
                    <PaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {tradeStatus === 'CONVERTING' && <PaymentConverting supportUrl={supportUrl} />}
                {showSending && <PaymentSending supportUrl={supportUrl} />}
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

export default CoinmarketDetail;
