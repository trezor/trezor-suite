import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { CryptoAmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { ExchangeTrade, ExchangeTradeStatus } from 'invity-api';

// loop through quotes and if all quotes are either with error below minimum or over maximum, return error message
export const getAmountLimits = (quotes: ExchangeTrade[]): CryptoAmountLimits | undefined => {
    let min: number | undefined;
    let max: number | undefined;
    let currency = '';

    for (const quote of quotes) {
        let noError = true;
        const amount = Number(quote.sendStringAmount);
        if (quote.min && amount < quote.min) {
            min = Math.min(min || 1e28, quote.min);
            noError = false;
        }
        if (quote.max && quote.max !== 'NONE' && amount > quote.max) {
            max = Math.max(max || 0, quote.max);
            noError = false;
        }
        // if at least one quote succeeded do not return any message
        if (!quote.error && noError) {
            return;
        }
        if (!currency && quote.send) {
            currency = quote.send;
        }
    }
    if (min || max) {
        return { currency, minCrypto: min, maxCrypto: max };
    }
};

export const isQuoteError = (quote: ExchangeTrade): boolean => {
    if (
        quote.error ||
        !quote.receive ||
        !quote.receiveStringAmount ||
        !quote.sendStringAmount ||
        !quote.send
    ) {
        return true;
    }
    if (quote.min && Number(quote.sendStringAmount) < quote.min) {
        return true;
    }
    if (quote.max && quote.max !== 'NONE' && Number(quote.sendStringAmount) > quote.max) {
        return true;
    }

    return false;
};

export const fixedRateQuotes = (quotes: ExchangeTrade[], exchangeInfo: ExchangeInfo | undefined) =>
    quotes.filter(
        q =>
            exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

export const floatRateQuotes = (quotes: ExchangeTrade[], exchangeInfo: ExchangeInfo | undefined) =>
    quotes.filter(
        q =>
            !exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

export const getSuccessQuotesOrdered = (
    quotes: ExchangeTrade[],
    exchangeInfo: ExchangeInfo | undefined,
): ExchangeTrade[] => {
    const fixed = fixedRateQuotes(quotes, exchangeInfo);
    const float = floatRateQuotes(quotes, exchangeInfo);
    const dex = quotes.filter(q => q.isDex && !isQuoteError(q)) || [];

    return [...dex, ...fixed, ...float];
};

export const getStatusMessage = (status: ExchangeTradeStatus) => {
    switch (status) {
        case 'ERROR':
            return 'TR_EXCHANGE_STATUS_ERROR';
        case 'SUCCESS':
            return 'TR_EXCHANGE_STATUS_SUCCESS';
        case 'KYC':
            return 'TR_EXCHANGE_STATUS_KYC';
        case 'CONVERTING':
            return 'TR_EXCHANGE_STATUS_CONVERTING';
        default:
            return 'TR_EXCHANGE_STATUS_CONFIRMING';
    }
};
