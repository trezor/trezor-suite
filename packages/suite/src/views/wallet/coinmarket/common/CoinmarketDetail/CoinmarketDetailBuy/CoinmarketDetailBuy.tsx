import styled from 'styled-components';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useCoinmarketDetailContext } from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import {
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketTradeBuyType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import {
    CoinmarketLeftWrapper,
    CoinmarketRightWrapper,
    CoinmarketWrapper,
} from 'src/views/wallet/coinmarket';
import { CoinmarketDetailBuyPaymentPaymentSuccessful } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuyPaymentSuccessful';
import { CoinmarketDetailBuyPaymentFailed } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuyPaymentFailed';
import { CoinmarketDetailBuyPaymentProcessing } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuyPaymentProcessing';
import { CoinmarketDetailBuyPaymentWaitingForUser } from 'src/views/wallet/coinmarket/common/CoinmarketDetail/CoinmarketDetailBuy/CoinmarketDetailBuyPaymentWaitingForUser';

const Wrapper = styled.div`
    ${CoinmarketWrapper}
`;

export const CoinmarketDetailBuy = () => {
    const { trade, info, account } = useCoinmarketDetailContext<CoinmarketTradeBuyType>();
    const dispatch = useDispatch();
    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-coinmarket-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    const tradeStatus = trade?.data?.status;
    const showError = tradeStatus === 'ERROR' || tradeStatus === 'BLOCKED';
    const showProcessing = tradeStatus === 'APPROVAL_PENDING';
    const showWaiting = tradeStatus === 'SUBMITTED' || tradeStatus === 'WAITING_FOR_USER';
    const showSuccess = tradeStatus === 'SUCCESS';

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{paymentId}}', trade?.data?.paymentId || '');

    const quoteAmounts: CoinmarketGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.wantCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receiveCurrency,
    };

    return (
        <Wrapper>
            <CoinmarketLeftWrapper>
                {showError && (
                    <CoinmarketDetailBuyPaymentFailed account={account} supportUrl={supportUrl} />
                )}
                {showProcessing && <CoinmarketDetailBuyPaymentProcessing />}
                {showWaiting && (
                    <CoinmarketDetailBuyPaymentWaitingForUser
                        trade={trade.data}
                        account={account}
                        providerName={provider?.brandName || provider?.companyName}
                    />
                )}
                {showSuccess && <CoinmarketDetailBuyPaymentPaymentSuccessful account={account} />}
            </CoinmarketLeftWrapper>
            <CoinmarketRightWrapper>
                <CoinmarketSelectedOfferInfo
                    account={account}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    quoteAmounts={quoteAmounts}
                    type="buy"
                />
            </CoinmarketRightWrapper>
        </Wrapper>
    );
};
