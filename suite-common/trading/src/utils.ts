import { BuyTrade, CryptoId, ExchangeTrade, SellFiatTrade } from 'invity-api';
import { v4 as uuidv4 } from 'uuid';

import {
    type Network,
    type NetworkSymbol,
    getCoingeckoId,
    getNetwork,
    getNetworkByCoingeckoId,
    getNetworkByTradeCryptoId,
} from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN, CRYPTO_PLATFORM_SEPARATOR } from './constants';
import { regional } from './regional';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingParsedCryptoIdProps,
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingTradeBuySellMapProps,
    TradingTradeBuySellType,
    TradingTradeMapProps,
    TradingType,
} from './types';

type NetworkAndContractAddress = {
    network: Network | undefined;
    contractAddress: string | undefined;
};

export const parseCryptoId = (cryptoId: CryptoId): TradingParsedCryptoIdProps => {
    const parts = cryptoId.split(CRYPTO_PLATFORM_SEPARATOR);

    return { networkId: parts[0] as CryptoId, contractAddress: parts[1] };
};

export const cryptoIdToNetworkAndContractAddress = (
    cryptoId: CryptoId,
): NetworkAndContractAddress => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const network = contractAddress
        ? getNetworkByCoingeckoId(networkId)
        : getNetworkByTradeCryptoId(networkId);

    return { network, contractAddress };
};

export const cryptoIdToNetwork = (cryptoId: CryptoId): Network | undefined =>
    cryptoIdToNetworkAndContractAddress(cryptoId)?.network;

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

interface TradingGetDecimalsProps {
    sendCryptoSelect?: TradingAccountOptionsGroupOptionProps;
    network?: Network | null;
}

export const getTradingNetworkDecimals = ({
    sendCryptoSelect,
    network,
}: TradingGetDecimalsProps) => {
    const defaultDecimals = getNetwork('btc').decimals;

    if (sendCryptoSelect) {
        return sendCryptoSelect.decimals;
    }

    return network?.decimals ?? defaultDecimals;
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
): TradingTradeMapProps[T][] | undefined => {
    // TODO: trading - delete after trading will be refactored
    if (!quotes) return undefined;

    return quotes.filter(
        quote => quote.paymentMethod === currentPaymentMethod && quote.error === undefined,
    );
};

export const getBestRatedQuote = <T extends TradingType>(
    quotes: TradingTradeMapProps[T][] | undefined,
    type: T,
): TradingTradeMapProps[T] | undefined => {
    const quotesFiltered = quotes?.filter(item => item.rate && item.rate !== 0);

    if (!quotesFiltered || quotesFiltered.length === 0) {
        return undefined;
    }

    const bestRatedQuotes = quotesFiltered.sort((a, b) => {
        const aRate = new BigNumber(a.rate ?? 0);
        const bRate = new BigNumber(b.rate ?? 0);

        // ascending to rate for buy - lower rate more crypto client receives
        if (type === 'buy') {
            return aRate.minus(bRate).toNumber();
        }

        // descending to rate for sell/exchange - higher rate more crypto/fiat client receives
        return bRate.minus(aRate).toNumber();
    });

    return bestRatedQuotes[0];
};
