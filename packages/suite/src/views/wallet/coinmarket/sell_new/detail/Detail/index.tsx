import styled from 'styled-components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import PaymentPending from '../components/PaymentPending';
import PaymentSuccessful from '../components/PaymentSuccessful';
import PaymentFailed from '../components/PaymentFailed';
import { useCoinmarketDetailContext } from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { tradeFinalStatuses } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import {
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketTradeSellType,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketLeftWrapper,
    CoinmarketRightWrapper,
    CoinmarketWrapper,
} from 'src/views/wallet/coinmarket';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

const CoinmarketDetail = () => {
    const { account, trade, info } = useCoinmarketDetailContext<CoinmarketTradeSellType>();
    const dispatch = useDispatch();

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-coinmarket-sell', {
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

    const quoteAmounts: CoinmarketGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.amountInCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.cryptoStringAmount ?? '',
        receiveCurrency: trade?.data?.cryptoCurrency,
    };

    return (
        <Wrapper>
            <CoinmarketLeftWrapper>
                {tradeStatus === 'SUCCESS' && <PaymentSuccessful account={account} />}
                {sellFiatTradeFinalStatuses.includes(tradeStatus) && tradeStatus !== 'SUCCESS' && (
                    <PaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {showPending && <PaymentPending supportUrl={supportUrl} />}
            </CoinmarketLeftWrapper>
            <CoinmarketRightWrapper>
                <CoinmarketSelectedOfferInfo
                    account={account}
                    providers={info?.providerInfos}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    type="sell"
                    quoteAmounts={quoteAmounts}
                />
            </CoinmarketRightWrapper>
        </Wrapper>
    );
};

export default CoinmarketDetail;
