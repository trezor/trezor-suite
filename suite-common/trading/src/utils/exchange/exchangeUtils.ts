import { CryptoId, ExchangeTrade, ExchangeTradeStatus } from 'invity-api';

import {
    CONTRACT_ADDRESS_FOR_NATIVE_TOKEN,
    TRADING_DEFAULT_CRYPTO_CURRENCY,
    TRADING_DEFAULT_CRYPTO_SECONDARY_CURRENCY,
    TRADING_EXCHANGE_RATE_FIXED,
} from '../../constants';
import { ExchangeInfo } from '../../reducers/exchangeReducer';
import { TradingExchangeAmountLimitProps, TradingExchangeRateType } from '../../types';
import { cryptoIdToNetwork, parseCryptoId } from '../../utils';

type GetAmountLimitsProps = {
    quotes: ExchangeTrade[];
    currency: string;
};

export const isSendingEvmNativeToken = (cryptoId?: CryptoId) => {
    if (!cryptoId) {
        return false;
    }

    const isEvmNetwork = cryptoIdToNetwork(cryptoId)?.networkType === 'ethereum';
    const { contractAddress } = parseCryptoId(cryptoId);

    return (
        isEvmNetwork && (!contractAddress || contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN)
    );
};

// loop through quotes and if all quotes are either with error below minimum or over maximum, return error message
const getAmountLimits = ({
    quotes,
    currency,
}: GetAmountLimitsProps): TradingExchangeAmountLimitProps | undefined => {
    let min: number | undefined;
    let max: number | undefined;

    for (const quote of quotes) {
        let noError = true;
        const amount = Number(quote.sendStringAmount);
        if (amount && quote.min && amount < quote.min) {
            min = Math.min(min || 1e28, quote.min);
            noError = false;
        }
        if (amount && quote.max && quote.max !== 'NONE' && amount > quote.max) {
            max = Math.max(max || 0, quote.max);
            noError = false;
        }
        // if at least one quote succeeded do not return any message
        if (!quote.error && noError) {
            return;
        }
    }

    if (min || max) {
        return { currency, minCrypto: min?.toString(), maxCrypto: max?.toString() };
    }
};

const isQuoteError = (quote: ExchangeTrade): boolean => {
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

const fixedRateCexQuotes = (quotes: ExchangeTrade[], exchangeInfo: ExchangeInfo | undefined) =>
    quotes.filter(
        q =>
            exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate &&
            !q.isDex &&
            !isQuoteError(q),
    );

const floatRateCexQuotes = (quotes: ExchangeTrade[], exchangeInfo: ExchangeInfo | undefined) =>
    quotes.filter(q => {
        const provider = exchangeInfo?.providerInfos[q.exchange || ''];

        return provider && !provider.isFixedRate && !q.isDex && !isQuoteError(q);
    });

const getCexQuotesByRateType = (
    rateType: TradingExchangeRateType,
    quotes: ExchangeTrade[],
    exchangeInfo: ExchangeInfo | undefined,
) => {
    if (rateType === TRADING_EXCHANGE_RATE_FIXED) return fixedRateCexQuotes(quotes, exchangeInfo);

    return floatRateCexQuotes(quotes, exchangeInfo);
};

const getSuccessQuotesOrdered = (quotes: ExchangeTrade[]): ExchangeTrade[] =>
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

export const tradingGetExchangeReceiveCryptoId = (
    sendCryptoId: CryptoId | undefined,
    receiveCryptoId?: CryptoId | undefined,
): CryptoId => {
    const getReceivedDefaultCryptoId = (cryptoId: CryptoId | undefined) => {
        if (cryptoId === TRADING_DEFAULT_CRYPTO_CURRENCY)
            return TRADING_DEFAULT_CRYPTO_SECONDARY_CURRENCY;

        return TRADING_DEFAULT_CRYPTO_CURRENCY;
    };

    if (sendCryptoId === receiveCryptoId) return getReceivedDefaultCryptoId(receiveCryptoId);
    if (receiveCryptoId) return receiveCryptoId;

    return getReceivedDefaultCryptoId(sendCryptoId);
};

export const exchangeUtils = {
    getAmountLimits,
    isQuoteError,
    fixedRateCexQuotes,
    floatRateCexQuotes,
    getCexQuotesByRateType,
    getSuccessQuotesOrdered,
    getStatusMessage,
    tradingGetExchangeReceiveCryptoId,
};
