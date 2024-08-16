import styled from 'styled-components';
import {
    BuyCryptoPaymentMethod,
    BuyTrade,
    CryptoSymbol,
    ExchangeTrade,
    SellCryptoPaymentMethod,
    SellFiatTrade,
} from 'invity-api';
import { Card } from '@trezor/components';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketGetCryptoQuoteAmountProps,
    CoinmarketGetProvidersInfoProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketInfoHeader } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoHeader';
import { CoinmarketInfoItem } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoSend';
import { CoinmarketInfoProvider } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoProvider';
import { CoinmarketInfoPaymentMethod } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoPaymentMethod';

const TransactionIdWrapper = styled.div`
    padding-left: 40px;
    max-width: 350px;
`;

interface CoinmarketSelectedOfferInfoProps {
    selectedQuote: BuyTrade | SellFiatTrade | ExchangeTrade;
    providers: CoinmarketGetProvidersInfoProps;
    quoteAmounts: CoinmarketGetCryptoQuoteAmountProps | null;
    type: CoinmarketTradeType;
    transactionId?: string;
    paymentMethod?: BuyCryptoPaymentMethod | SellCryptoPaymentMethod;
    paymentMethodName?: string;
}

export const CoinmarketSelectedOfferInfo = ({
    selectedQuote,
    transactionId,
    providers,
    quoteAmounts,
    type,
    paymentMethod,
    paymentMethodName,
}: CoinmarketSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const receiveCurrency = quoteAmounts?.receiveCurrency
        ? cryptoToCoinSymbol(quoteAmounts.receiveCurrency)
        : undefined;
    const sendCurrency =
        type === 'exchange' && quoteAmounts?.sendCurrency
            ? cryptoToCoinSymbol(quoteAmounts.sendCurrency as CryptoSymbol)
            : quoteAmounts?.sendCurrency;

    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto: true });

    return (
        <Card data-testid="@coinmarket/offer/info" width="60%">
            {type !== 'exchange' && (
                <CoinmarketInfoHeader receiveCurrency={quoteAmounts?.receiveCurrency} />
            )}
            <CoinmarketInfoItem
                type={type}
                itemType="send"
                label={amountLabels.sendLabel}
                currency={sendCurrency}
                amount={quoteAmounts?.sendAmount}
            />
            <CoinmarketInfoItem
                type={type}
                itemType="receive"
                label={amountLabels.receiveLabel}
                currency={receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
            />
            <CoinmarketInfoProvider providers={providers} exchange={exchange} />
            {paymentMethod && (
                <CoinmarketInfoPaymentMethod
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            )}
            {transactionId && (
                <TransactionIdWrapper>
                    <CoinmarketTransactionId transactionId={transactionId} />
                </TransactionIdWrapper>
            )}
        </Card>
    );
};
