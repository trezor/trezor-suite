import styled from 'styled-components';

import { Card } from '@trezor/components';
import type { TradingBuyType } from '@suite-common/invity';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingDetailBuyPaymentPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentSuccessful';
import { TradingDetailBuyPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentFailed';
import { TradingDetailBuyPaymentProcessing } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentProcessing';
import { TradingDetailBuyPaymentWaitingForUser } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentWaitingForUser';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

export const TradingDetailBuy = () => {
    const { trade, info, account } = useTradingDetailContext<TradingBuyType>();
    const dispatch = useDispatch();
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

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.wantCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receiveCurrency,
    };

    return (
        <Wrapper data-testid="@trading/transaction/detail">
            <Card data-testid="@trading/transaction/detail/status-card">
                {showError && (
                    <TradingDetailBuyPaymentFailed account={account} supportUrl={supportUrl} />
                )}
                {showProcessing && <TradingDetailBuyPaymentProcessing />}
                {showWaiting && (
                    <TradingDetailBuyPaymentWaitingForUser
                        trade={trade.data}
                        account={account}
                        providerName={provider?.brandName || provider?.companyName}
                    />
                )}
                {showSuccess && <TradingDetailBuyPaymentPaymentSuccessful account={account} />}
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
