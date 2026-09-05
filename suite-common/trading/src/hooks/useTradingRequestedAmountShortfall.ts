import { useSelector } from 'react-redux';

import {
    type BuyTrade,
    type CryptoId,
    type ExchangeTrade,
    type ExchangeTradeQuoteRequest,
    type SellFiatTrade,
} from 'invity-api';

import { BigNumber } from '@trezor/utils';

import {
    selectTradingBuyQuotesRequest,
    selectTradingExchangeQuotesRequest,
    selectTradingSellQuotesRequest,
} from '../selectors/tradingSelectors';
import type { TradingTradeType } from '../types';
import { isBuyTrade, isExchangeTrade, isSellFiatTrade } from '../utils';

type UseTradingRequestedAmountShortfallProps = {
    quote: TradingTradeType | undefined;
};

export type TradingRequestedAmountShortfallResult = {
    shortfallRatio: number;
    fiatShortfall?: number;
    cryptoShortfall?: {
        amount: string;
        cryptoId: CryptoId;
    };
};

type RequestedAndQuoteAmounts = {
    requestedAmount: string;
    quoteAmount: string;
    cryptoId?: CryptoId;
};

const parsePositiveNumber = (value: string | undefined): number | null => {
    if (!value) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const getBuyRequestedAndQuoteAmounts = (
    quote: BuyTrade,
    quotesRequest: ReturnType<typeof selectTradingBuyQuotesRequest>,
): RequestedAndQuoteAmounts | null => {
    if (!quotesRequest) {
        return null;
    }

    if (quotesRequest.wantCrypto) {
        if (
            !quotesRequest.cryptoStringAmount ||
            !quote.receiveStringAmount ||
            !quote.receiveCurrency
        ) {
            return null;
        }

        return {
            requestedAmount: quotesRequest.cryptoStringAmount,
            quoteAmount: quote.receiveStringAmount,
            cryptoId: quote.receiveCurrency,
        };
    }

    if (!quotesRequest.fiatStringAmount || !quote.fiatStringAmount) {
        return null;
    }

    return {
        requestedAmount: quotesRequest.fiatStringAmount,
        quoteAmount: quote.fiatStringAmount,
    };
};

const getSellRequestedAndQuoteAmounts = (
    quote: SellFiatTrade,
    quotesRequest: ReturnType<typeof selectTradingSellQuotesRequest>,
): RequestedAndQuoteAmounts | null => {
    if (!quotesRequest) {
        return null;
    }

    if (quotesRequest.amountInCrypto) {
        if (
            !quotesRequest.cryptoStringAmount ||
            !quote.cryptoStringAmount ||
            !quote.cryptoCurrency
        ) {
            return null;
        }

        return {
            requestedAmount: quotesRequest.cryptoStringAmount,
            quoteAmount: quote.cryptoStringAmount,
            cryptoId: quote.cryptoCurrency,
        };
    }

    if (!quotesRequest.fiatStringAmount || !quote.fiatStringAmount) {
        return null;
    }

    return {
        requestedAmount: quotesRequest.fiatStringAmount,
        quoteAmount: quote.fiatStringAmount,
    };
};

const getExchangeRequestedAndQuoteAmounts = (
    quote: ExchangeTrade,
    quotesRequest: ExchangeTradeQuoteRequest | undefined,
): RequestedAndQuoteAmounts | null => {
    if (!quotesRequest) {
        return null;
    }

    if (!quotesRequest.sendStringAmount || !quote.sendStringAmount || !quote.send) {
        return null;
    }

    return {
        requestedAmount: quotesRequest.sendStringAmount,
        quoteAmount: quote.sendStringAmount,
        cryptoId: quote.send,
    };
};
type GetRequestedAndQuoteAmountsParams = {
    quote: TradingTradeType;
    buyQuotesRequest: ReturnType<typeof selectTradingBuyQuotesRequest>;
    sellQuotesRequest: ReturnType<typeof selectTradingSellQuotesRequest>;
    exchangeQuotesRequest: ReturnType<typeof selectTradingExchangeQuotesRequest>;
};

const getRequestedAndQuoteAmounts = ({
    quote,
    buyQuotesRequest,
    sellQuotesRequest,
    exchangeQuotesRequest,
}: GetRequestedAndQuoteAmountsParams) => {
    if (isBuyTrade(quote)) {
        return getBuyRequestedAndQuoteAmounts(quote, buyQuotesRequest);
    }

    if (isSellFiatTrade(quote)) {
        return getSellRequestedAndQuoteAmounts(quote, sellQuotesRequest);
    }

    if (isExchangeTrade(quote)) {
        return getExchangeRequestedAndQuoteAmounts(quote, exchangeQuotesRequest);
    }

    return null;
};

export const useTradingRequestedAmountShortfall = ({
    quote,
}: UseTradingRequestedAmountShortfallProps): TradingRequestedAmountShortfallResult | null => {
    const buyQuotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const sellQuotesRequest = useSelector(selectTradingSellQuotesRequest);
    const exchangeQuotesRequest = useSelector(selectTradingExchangeQuotesRequest);

    const requestedAndQuoteAmounts = quote
        ? getRequestedAndQuoteAmounts({
              quote,
              buyQuotesRequest,
              sellQuotesRequest,
              exchangeQuotesRequest,
          })
        : null;

    const requestedAmountNumber = parsePositiveNumber(requestedAndQuoteAmounts?.requestedAmount);
    const quoteAmountNumber = parsePositiveNumber(requestedAndQuoteAmounts?.quoteAmount);

    if (
        requestedAmountNumber === null ||
        quoteAmountNumber === null ||
        quoteAmountNumber >= requestedAmountNumber
    ) {
        return null;
    }

    const shortfallRatio = (requestedAmountNumber - quoteAmountNumber) / requestedAmountNumber;

    if (requestedAndQuoteAmounts?.cryptoId) {
        return {
            shortfallRatio,
            cryptoShortfall: {
                amount: new BigNumber(requestedAndQuoteAmounts.requestedAmount)
                    .minus(requestedAndQuoteAmounts.quoteAmount)
                    .toString(),
                cryptoId: requestedAndQuoteAmounts.cryptoId,
            },
        };
    }

    return {
        shortfallRatio,
        fiatShortfall: requestedAmountNumber - quoteAmountNumber,
    };
};
