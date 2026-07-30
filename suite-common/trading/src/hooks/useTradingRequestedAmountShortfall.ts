import { type BuyTrade, type CryptoId, type SellFiatTrade } from 'invity-api';

import { BigNumber } from '@trezor/utils';

import {
    selectTradingBuyQuotesRequest,
    selectTradingSellQuotesRequest,
} from '../selectors/tradingSelectors';
import type { TradingTradeType } from '../types';
import { isBuyTrade, isSellFiatTrade } from '../utils';
import { useSelector } from './useSelector';

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

const getRequestedAndQuoteAmounts = ({
    quote,
    buyQuotesRequest,
    sellQuotesRequest,
}: {
    quote: TradingTradeType;
    buyQuotesRequest: ReturnType<typeof selectTradingBuyQuotesRequest>;
    sellQuotesRequest: ReturnType<typeof selectTradingSellQuotesRequest>;
}) => {
    if (isBuyTrade(quote)) {
        return getBuyRequestedAndQuoteAmounts(quote, buyQuotesRequest);
    }

    if (isSellFiatTrade(quote)) {
        return getSellRequestedAndQuoteAmounts(quote, sellQuotesRequest);
    }

    return null;
};

export const useTradingRequestedAmountShortfall = ({
    quote,
}: UseTradingRequestedAmountShortfallProps): TradingRequestedAmountShortfallResult | null => {
    const buyQuotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const sellQuotesRequest = useSelector(selectTradingSellQuotesRequest);

    const requestedAndQuoteAmounts = quote
        ? getRequestedAndQuoteAmounts({
              quote,
              buyQuotesRequest,
              sellQuotesRequest,
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
