import { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import { CryptoAmountLimits } from 'src/types/wallet/coinmarketCommonTypes';
import { CryptoId, ExchangeTrade, ExchangeTradeStatus } from 'invity-api';
import { RateType } from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_DEFAULT_CRYPTO_SECONDARY_CURRENCY,
    FORM_RATE_FIXED,
    FORM_RATE_FLOATING,
} from 'src/constants/wallet/coinmarket/form';

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

export const fixedRateCexQuotes = (
    quotes: ExchangeTrade[],
    exchangeInfo: ExchangeInfo | undefined,
) =>
    quotes.filter(
        q =>
            exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

export const floatRateCexQuotes = (
    quotes: ExchangeTrade[],
    exchangeInfo: ExchangeInfo | undefined,
) =>
    quotes.filter(
        q =>
            !exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

export const getCexQuotesByRateType = (
    rateType: RateType,
    quotes: ExchangeTrade[] | undefined,
    exchangeInfo: ExchangeInfo | undefined,
) => {
    if (!quotes) return undefined;
    if (rateType === FORM_RATE_FIXED) return fixedRateCexQuotes(quotes, exchangeInfo);
    if (rateType === FORM_RATE_FLOATING) return floatRateCexQuotes(quotes, exchangeInfo);
    else return quotes;
};

export const getSuccessQuotesOrdered = (quotes: ExchangeTrade[]): ExchangeTrade[] =>
    quotes.filter(q => !isQuoteError(q));

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

export const coinmarketGetExchangeReceiveCryptoId = (
    sendCryptoId: CryptoId | undefined,
    receiveCryptoId?: CryptoId | undefined,
): CryptoId => {
    const getReceivedDefaultCryptoId = (cryptoId: CryptoId | undefined) => {
        if (cryptoId === FORM_DEFAULT_CRYPTO_CURRENCY)
            return FORM_DEFAULT_CRYPTO_SECONDARY_CURRENCY as CryptoId;

        return FORM_DEFAULT_CRYPTO_CURRENCY as CryptoId;
    };

    if (sendCryptoId === receiveCryptoId) return getReceivedDefaultCryptoId(receiveCryptoId);
    if (receiveCryptoId) return receiveCryptoId;

    return getReceivedDefaultCryptoId(sendCryptoId);
};
