import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';

import { TradingAmountLimitProps } from '../../types';

type GetAmountLimitsProps = {
    request: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    currency: string;
};

// loop through quotes and if all quotes are either with error below minimum or over maximum, return the limits
const getAmountLimits = ({
    request,
    quotes,
    currency,
}: GetAmountLimitsProps): TradingAmountLimitProps | undefined => {
    let minAmount: number | undefined;
    let maxAmount: number | undefined;

    for (const quote of quotes) {
        // if at least one quote succeeded do not return any message
        if (!quote.error) {
            return;
        }
        if (request.wantCrypto) {
            const amount = Number(quote.receiveStringAmount);
            if (amount && quote.minCrypto && amount < quote.minCrypto) {
                minAmount = Math.min(minAmount || 1e28, quote.minCrypto);
            }
            if (amount && quote.maxCrypto && amount > quote.maxCrypto) {
                maxAmount = Math.max(maxAmount || 0, quote.maxCrypto);
            }
        } else {
            const amount = Number(quote.fiatStringAmount);
            if (amount && quote.minFiat && amount < quote.minFiat) {
                minAmount = Math.min(minAmount || 1e28, quote.minFiat);
            }
            if (amount && quote.maxFiat && amount > quote.maxFiat) {
                maxAmount = Math.max(maxAmount || 0, quote.maxFiat);
            }
        }
    }

    if (minAmount) {
        if (!maxAmount) {
            return request.wantCrypto
                ? { currency, minCrypto: minAmount.toString() }
                : { currency: request.fiatCurrency, minFiat: minAmount.toString() };
        }
    } else if (maxAmount) {
        return request.wantCrypto
            ? { currency, maxCrypto: maxAmount.toString() }
            : { currency: request.fiatCurrency, maxFiat: maxAmount.toString() };
    }
};

export const buyUtils = {
    getAmountLimits,
};
