import { type BuyTrade, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import {
    type TradingTradeType,
    type TradingType,
    selectTradingBuyQuotesRequest,
    selectTradingComposedTransactionInfo,
    selectTradingSellQuotesRequest,
} from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

export const useTradingQuoteAmounts = (
    quote: TradingTradeType | undefined,
    type: TradingType,
): TradingGetCryptoQuoteAmountProps | null => {
    const buyQuotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const sellQuotesRequest = useSelector(selectTradingSellQuotesRequest);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    if (!quote) {
        return null;
    }

    const networkFee = composedTransactionInfo?.composed?.fee;

    switch (type) {
        case 'buy': {
            if (!buyQuotesRequest) {
                return null;
            }

            const buyQuote = quote as BuyTrade;

            return {
                amountInCrypto: buyQuotesRequest.wantCrypto,
                sendAmount: buyQuote.fiatStringAmount ?? '',
                sendCurrency: buyQuote.fiatCurrency,
                receiveAmount: buyQuote.receiveStringAmount ?? '',
                receiveCurrency: buyQuote.receiveCurrency,
            };
        }

        case 'sell': {
            if (!sellQuotesRequest) {
                return null;
            }

            const sellQuote = quote as SellFiatTrade;

            return {
                amountInCrypto: sellQuotesRequest.amountInCrypto,
                sendAmount: sellQuote.fiatStringAmount ?? '',
                sendCurrency: sellQuote.fiatCurrency,
                receiveAmount: sellQuote.cryptoStringAmount ?? '',
                receiveCurrency: sellQuote.cryptoCurrency,
                networkFee,
            };
        }

        case 'exchange': {
            const exchangeQuote = quote as ExchangeTrade;

            return {
                amountInCrypto: false,
                sendAmount: exchangeQuote.sendStringAmount ?? '',
                sendCurrency: exchangeQuote.send,
                receiveAmount: exchangeQuote.receiveStringAmount ?? '',
                receiveCurrency: exchangeQuote.receive,
                networkFee,
            };
        }

        default:
            return exhaustive(type);
    }
};
