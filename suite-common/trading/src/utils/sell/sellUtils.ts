import { SellFiatTrade, SellFiatTradeQuoteRequest, SellTradeStatus } from 'invity-api';

import { TradingAmountLimitProps } from '../../types';

type GetAmountLimitsProps = {
    request: SellFiatTradeQuoteRequest;
    quotes: SellFiatTrade[];
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
        if (request.amountInCrypto) {
            const amount = Number(quote.cryptoStringAmount);

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
            return request.amountInCrypto
                ? { currency, minCrypto: minAmount.toString() }
                : { currency: request.fiatCurrency, minFiat: minAmount.toString() };
        }
    } else if (maxAmount) {
        return request.amountInCrypto
            ? { currency, maxCrypto: maxAmount.toString() }
            : { currency: request.fiatCurrency, maxFiat: maxAmount.toString() };
    }
};

const formatIban = (iban: string) =>
    iban
        .replace(/ /g, '')
        .replace(/(.{4})/g, '$1 ')
        .trimEnd();

const getStatusMessage = (status: SellTradeStatus) => {
    switch (status) {
        case 'BLOCKED':
        case 'CANCELLED':
        case 'REFUNDED':
        case 'ERROR':
            return 'TR_SELL_STATUS_ERROR';
        case 'SUCCESS':
            return 'TR_SELL_STATUS_SUCCESS';
        case 'LOGIN_REQUEST':
        case 'SITE_ACTION_REQUEST':
        case 'SUBMITTED':
        default:
            return 'TR_SELL_STATUS_PENDING';
    }
};

export const sellUtils = {
    getAmountLimits,
    formatIban,
    getStatusMessage,
};
