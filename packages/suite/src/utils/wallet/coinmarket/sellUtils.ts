import { v4 as uuidv4 } from 'uuid';
import { Account } from '@wallet-types';
import { AmountLimits } from '@wallet-types/coinmarketSellForm';
import { SellFiatTrade, SellFiatTradeQuoteRequest, SellTradeStatus } from 'invity-api';
import { getLocationOrigin, isDesktop } from '@suite-utils/env';
import { ComposedTransactionInfo } from '@wallet-reducers/coinmarketReducer';

// loop through quotes and if all quotes are either with error below minimum or over maximum, return the limits
export function getAmountLimits(
    request: SellFiatTradeQuoteRequest,
    quotes: SellFiatTrade[],
): AmountLimits | undefined {
    let minAmount: number | undefined;
    let maxAmount: number | undefined;
    quotes.forEach(quote => {
        // if at least one quote succeeded do not return any message
        if (!quote.error) {
            return;
        }
        if (request.amountInCrypto) {
            const amount = Number(quote.cryptoStringAmount);
            if (quote.minCrypto && amount < quote.minCrypto) {
                minAmount = Math.min(minAmount || 1e28, quote.minCrypto);
            }
            if (quote.maxCrypto && amount > quote.maxCrypto) {
                maxAmount = Math.max(maxAmount || 0, quote.maxCrypto);
            }
        } else {
            const amount = Number(quote.fiatStringAmount);
            if (quote.minFiat && amount < quote.minFiat) {
                minAmount = Math.min(minAmount || 1e28, quote.minFiat);
            }
            if (quote.maxFiat && amount > quote.maxFiat) {
                maxAmount = Math.max(maxAmount || 0, quote.maxFiat);
            }
        }
    });
    if (minAmount) {
        if (!maxAmount) {
            return request.amountInCrypto
                ? { currency: request.cryptoCurrency, minCrypto: minAmount }
                : { currency: request.fiatCurrency, minFiat: minAmount };
        }
    } else if (maxAmount) {
        return request.amountInCrypto
            ? { currency: request.cryptoCurrency, maxCrypto: maxAmount }
            : { currency: request.fiatCurrency, maxFiat: maxAmount };
    }
}

// split the quotes to base and alternative and assign order and payment ids
export function processQuotes(allQuotes: SellFiatTrade[]): [SellFiatTrade[], SellFiatTrade[]] {
    if (!allQuotes) allQuotes = [];
    allQuotes.forEach(q => {
        q.orderId = uuidv4();
        q.paymentId = uuidv4();
    });
    const quotes = allQuotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));
    const alternativeQuotes = allQuotes.filter(
        q => q.tags && q.tags.includes('alternativeCurrency') && !q.error,
    );
    return [quotes, alternativeQuotes];
}

export const createQuoteLink = async (
    request: SellFiatTradeQuoteRequest,
    account: Account,
    composedInfo: ComposedTransactionInfo,
) => {
    const assetPrefix = process.env.assetPrefix || '';
    const locationOrigin = getLocationOrigin();
    let hash: string;

    if (request.amountInCrypto) {
        hash = `qc/${request.country}/${request.fiatCurrency}/${request.cryptoStringAmount}/${request.cryptoCurrency}`;
    } else {
        hash = `qf/${request.country}/${request.fiatCurrency}/${request.fiatStringAmount}/${request.cryptoCurrency}`;
    }
    if (composedInfo.selectedFee && composedInfo.selectedFee !== 'normal') {
        hash += `/${composedInfo.selectedFee}`;
        if (composedInfo.selectedFee === 'custom') {
            hash += `/${composedInfo.composed?.feePerByte}`;
            if (composedInfo.composed?.feeLimit) {
                hash += `/${composedInfo.composed?.feeLimit}`;
            }
        }
    }

    const params = `sell-offers/${account.symbol}/${account.accountType}/${account.index}/${hash}`;

    if (isDesktop()) {
        const url = await window.desktopApi?.getHttpReceiverAddress('/sell-redirect');
        return `${url}?p=${encodeURIComponent(`/coinmarket-redirect/${params}`)}`;
    }

    return `${locationOrigin}${assetPrefix}/coinmarket-redirect#${params}`;
};

export const formatIban = (iban: string) =>
    iban
        .replace(/ /g, '')
        .replace(/(.{4})/g, '$1 ')
        .trimEnd();

export const getStatusMessage = (status: SellTradeStatus) => {
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
