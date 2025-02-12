import { BuyTrade, CryptoId, ExchangeTrade, SellFiatTrade } from 'invity-api';
import { v4 as uuidv4 } from 'uuid';

import {
    type Network,
    type NetworkSymbol,
    getCoingeckoId,
    getNetworkByCoingeckoId,
    getNetworkByTradeCryptoId,
} from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN, CRYPTO_PLATFORM_SEPARATOR } from './constants';
import { regional } from './regional';
import type {
    TradingParsedCryptoIdProps,
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingTradeBuySellMapProps,
    TradingTradeBuySellType,
    TradingTradeMapProps,
    TradingType,
} from './types';

export const parseCryptoId = (cryptoId: CryptoId): TradingParsedCryptoIdProps => {
    const parts = cryptoId.split(CRYPTO_PLATFORM_SEPARATOR);

    return { networkId: parts[0] as CryptoId, contractAddress: parts[1] };
};

export const cryptoIdToNetwork = (cryptoId: CryptoId): Network | undefined => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return contractAddress
        ? getNetworkByCoingeckoId(networkId)
        : getNetworkByTradeCryptoId(networkId);
};

export const cryptoIdToSymbol = (cryptoId: CryptoId): NetworkSymbol | undefined =>
    cryptoIdToNetwork(cryptoId)?.symbol;

export const toTokenCryptoId = (symbol: NetworkSymbol, contractAddress: string): CryptoId =>
    `${getCoingeckoId(symbol)}${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}` as CryptoId;

/** Convert testnet cryptoId to prod cryptoId (test-bitcoin -> bitcoin) */
export const testnetToProdCryptoId = (cryptoId: CryptoId): CryptoId => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return ((networkId.split('test-')?.[1] ?? networkId) +
        (contractAddress ? `${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}` : '')) as CryptoId;
};

export const isCryptoIdForNativeToken = (cryptoId: CryptoId) => {
    const { contractAddress } = parseCryptoId(cryptoId);

    return contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
};

export const getUnusedAddressFromAccount = (account: Account) => {
    switch (account.networkType) {
        case 'cardano':
        case 'bitcoin': {
            const firstUnused = account.addresses?.unused[0];
            if (firstUnused) {
                return { address: firstUnused.address, path: firstUnused.path };
            }

            return { address: undefined, path: undefined };
        }
        case 'ripple':
        case 'ethereum':
        case 'solana': {
            return {
                address: account.descriptor,
                path: account.path,
            };
        }
        // no default
    }
};

export const mapTestnetSymbol = (
    symbol: NetworkSymbol,
): Exclude<NetworkSymbol, 'test' | 'tsep' | 'thol' | 'txrp' | 'tada'> => {
    if (symbol === 'test') return 'btc';
    if (symbol === 'tsep') return 'eth';
    if (symbol === 'thol') return 'eth';
    if (symbol === 'txrp') return 'xrp';
    if (symbol === 'tada') return 'ada';

    return symbol;
};

export const getTagAndInfoNote = (quote: { infoNote?: string }) => {
    let tag = '';
    let infoNote = (quote?.infoNote || '').trim();
    if (infoNote.startsWith('#')) {
        const splitNote = infoNote?.split('#') || [];
        if (splitNote.length === 3) {
            // infoNote contains "#badge_text#info_note_text"
            [, tag, infoNote] = splitNote;
        } else if (splitNote.length === 2) {
            // infoNote contains "#badge_text"
            infoNote = '';
            tag = splitNote.pop() || '';
        }
    }

    return { tag, infoNote };
};

export const tradingGetSuccessQuotes = <T extends TradingType>(
    quotes: TradingTradeMapProps[T][] | undefined,
) => (quotes ? quotes.filter(quote => quote.error === undefined) : undefined);

export const getDefaultCountry = (country: string = regional.UNKNOWN_COUNTRY) => {
    const label = regional.countriesMap.get(country);

    if (!label)
        return {
            label: regional.countriesMap.get(regional.UNKNOWN_COUNTRY)!,
            value: regional.UNKNOWN_COUNTRY,
        };

    return {
        label,
        value: country,
    };
};

export const filterQuotesAccordingTags = <T extends TradingTradeBuySellType>(
    allQuotes: TradingTradeBuySellMapProps[T][],
) => allQuotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));

// fill orderId for all, paymentId for sell and buy, quoteId for exchange
export const addIdsToQuotes = <T extends TradingType>(
    allQuotes: TradingTradeMapProps[T][] | undefined,
    type: TradingType,
): TradingTradeMapProps[T][] => {
    if (!allQuotes) allQuotes = [];

    allQuotes.forEach(quote => {
        const sellBuyQuote = ['buy', 'sell'].includes(type)
            ? (quote as BuyTrade | SellFiatTrade)
            : null;

        if (sellBuyQuote && !sellBuyQuote.paymentId) {
            sellBuyQuote.paymentId = uuidv4();
        }

        if (type === 'exchange' && !quote.quoteId) {
            (quote as ExchangeTrade).quoteId = uuidv4();
        }

        quote.orderId = uuidv4();
    });

    return allQuotes;
};

export const getTradingPaymentMethods = <T extends TradingTradeBuySellType>(
    quotes: TradingTradeMapProps[T][],
) => {
    const newPaymentMethods: TradingPaymentMethodListProps[] = [];

    quotes.forEach(quote => {
        const { paymentMethod, paymentMethodName } = quote;

        const shouldAddToPaymentMethods =
            paymentMethod !== undefined &&
            newPaymentMethods.every(item => item.value !== paymentMethod);

        if (shouldAddToPaymentMethods) {
            newPaymentMethods.push({
                value: paymentMethod,
                label: paymentMethodName ?? paymentMethod,
            });
        }
    });

    return newPaymentMethods;
};

export const getTradingQuotesByPaymentMethod = <T extends TradingTradeBuySellType>(
    quotes: TradingTradeMapProps[T][] | undefined,
    currentPaymentMethod: TradingPaymentMethodProps,
) => {
    if (!quotes) return;

    return quotes.filter(
        quote => quote.paymentMethod === currentPaymentMethod && quote.error === undefined,
    );
};
