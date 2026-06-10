import type { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { isBuyTrade, isExchangeTrade, isSellFiatTrade } from '@suite-common/trading';

const getQuoteType = (quote: BuyTrade | ExchangeTrade | SellFiatTrade) => {
    if (isBuyTrade(quote)) {
        return 'buy';
    }
    if (isExchangeTrade(quote)) {
        return 'exchange';
    }
    if (isSellFiatTrade(quote)) {
        return 'sell';
    }

    return 'unknown';
};

export class QuoteError extends Error {
    public readonly quoteData: {
        tradeType: 'buy' | 'exchange' | 'sell' | 'unknown';
        exchange: string | undefined;
        send: string | undefined;
        receive: string | undefined;
        receiveCurrency: string | undefined;
        cryptoStringAmount: string | undefined;
        receiveStringAmount: string | undefined;
        sendStringAmount: string | undefined;
        fiatStringAmount: string | undefined;
        cryptoCurrency: string | undefined;
        fiatCurrency: string | undefined;
        isDex: boolean | undefined;
    };

    constructor(message: string, quote: ExchangeTrade | BuyTrade | SellFiatTrade) {
        super(message);

        const {
            exchange,
            send,
            receive,
            receiveCurrency,
            cryptoStringAmount,
            receiveStringAmount,
            sendStringAmount,
            fiatStringAmount,
            cryptoCurrency,
            fiatCurrency,
            isDex,
        } = quote as ExchangeTrade & BuyTrade & SellFiatTrade;
        this.quoteData = {
            tradeType: getQuoteType(quote),
            exchange,
            send,
            receive,
            receiveCurrency,
            cryptoStringAmount,
            receiveStringAmount,
            sendStringAmount,
            fiatStringAmount,
            cryptoCurrency,
            fiatCurrency,
            isDex,
        };
    }
}
