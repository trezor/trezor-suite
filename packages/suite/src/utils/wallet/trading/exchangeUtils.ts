import {
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    ExchangeTradeStatus,
} from 'invity-api';

import { getLocationOrigin, isDesktop } from '@trezor/env-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ExchangeInfo } from 'src/actions/wallet/tradingExchangeActions';
import {
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_DEFAULT_CRYPTO_SECONDARY_CURRENCY,
    FORM_RATE_FIXED,
    FORM_RATE_FLOATING,
} from 'src/constants/wallet/trading/form';
import { ComposedTransactionInfo } from 'src/reducers/wallet/tradingReducer';
import { RateType } from 'src/types/trading/tradingForm';
import { Account } from 'src/types/wallet';

export const createQuoteLink = async (
    request: ExchangeTradeQuoteRequest,
    account: Account,
    composedInfo: ComposedTransactionInfo,
    orderId: string,
) => {
    const assetPrefix = process.env.ASSET_PREFIX || '';
    const locationOrigin = getLocationOrigin();
    let hash = `${request.send}/${request.receive}/${request.sendStringAmount}/${orderId}`;

    if (composedInfo.selectedFee && composedInfo.selectedFee !== 'normal') {
        hash += `/${composedInfo.selectedFee}`;
        if (composedInfo.selectedFee === 'custom') {
            hash += `/${composedInfo.composed?.feePerByte}`;
            hash += `/${composedInfo.composed?.maxFeePerGas}`;
            hash += `/${composedInfo.composed?.maxPriorityFeePerGas}`;
            if (composedInfo.composed?.feeLimit) {
                hash += `/${composedInfo.composed?.feeLimit}`;
            }
        }
    }

    const params = `exchange-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await desktopApi.getHttpReceiverAddress('/exchange-redirect');

        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
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

export const tradingGetExchangeReceiveCryptoId = (
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
