import {
    BuyTrade,
    BuyTradeFinalStatus,
    CryptoId,
    ExchangeProviderInfo,
    ExchangeTrade,
    ExchangeTradeFinalStatus,
    SellFiatTrade,
    SellProviderInfo,
    SellTradeFinalStatus,
} from 'invity-api';
import { v4 as uuidv4 } from 'uuid';

import {
    type Network,
    type NetworkSymbol,
    getCoingeckoId,
    getNetwork,
    getNetworkByCoingeckoId,
    getNetworkByTradeCryptoId,
    networksCollection,
} from '@suite-common/wallet-config';
import type { Account, AccountKey, FormStateTrading } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { TokenInfo } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    CONTRACT_ADDRESS_FOR_NATIVE_TOKEN,
    CRYPTO_PLATFORM_SEPARATOR,
    TOKEN_SELECT_SELECTABLE_NETWORKS,
} from './constants';
import { regional } from './regional';
import {
    TradingCountryCode,
    TradingExchangeType,
    TradingParsedCryptoIdProps,
    TradingPaymentMethodListProps,
    TradingPaymentMethodProps,
    TradingProviderInfo,
    TradingSellType,
    TradingTradeBuySellMapProps,
    TradingTradeBuySellType,
    TradingTradeMapProps,
    TradingTradeStatusType,
    TradingTradeType,
    TradingType,
} from './types';

type NetworkAndContractAddress = {
    network: Network | undefined;
    contractAddress: string | undefined;
};

type TradingGetFormStateSellProps = {
    activeSection: TradingSellType;
    trade: SellFiatTrade;
};

type TradingGetFormStateExchangeProps = {
    activeSection: TradingExchangeType;
    trade: ExchangeTrade;
};

type TradingGetFormStateProps = {
    providers: Record<string, ExchangeProviderInfo | SellProviderInfo> | undefined;
    isSlip24Active?: boolean;
    sendAccountKey: AccountKey | undefined;
    receiveAccountKey?: AccountKey | undefined;
} & (TradingGetFormStateSellProps | TradingGetFormStateExchangeProps);

export const tradeFinalStatuses: Record<TradingType, TradingTradeStatusType[]> = {
    buy: ['SUCCESS', 'ERROR', 'BLOCKED'] satisfies BuyTradeFinalStatus[],
    sell: ['SUCCESS', 'ERROR', 'BLOCKED', 'CANCELLED', 'REFUNDED'] satisfies SellTradeFinalStatus[],
    exchange: ['SUCCESS', 'ERROR', 'KYC'] satisfies ExchangeTradeFinalStatus[],
};

export const isFinalStatus = (
    tradingType: TradingType,
    tradeStatus: TradingTradeStatusType | undefined,
) => (tradeStatus ? tradeFinalStatuses[tradingType].includes(tradeStatus) : false);

export const isBuyTrade = (quote: TradingTradeType): quote is BuyTrade =>
    'fiatStringAmount' in quote && 'receiveStringAmount' in quote;

export const isSellFiatTrade = (quote: TradingTradeType): quote is SellFiatTrade =>
    'cryptoStringAmount' in quote && 'fiatStringAmount' in quote;

export const isExchangeTrade = (quote: TradingTradeType): quote is ExchangeTrade =>
    'sendStringAmount' in quote && 'receiveStringAmount' in quote;

export const isExchangeProvider = (provider: TradingProviderInfo) =>
    provider && 'kycPolicyType' in provider;

export const parseCryptoId = (cryptoId: CryptoId): TradingParsedCryptoIdProps => {
    const parts = cryptoId.split(CRYPTO_PLATFORM_SEPARATOR);

    // TODO: This casting doesn't make any sense. Return new type called `NetworkId` instead of `CryptoId`
    return { networkId: parts[0] as CryptoId, contractAddress: parts[1] };
};

export function composeCryptoId(coingeckoId: string, contractAddress?: string | null): CryptoId {
    return (
        contractAddress
            ? `${coingeckoId}${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}`
            : coingeckoId
    ) as CryptoId;
}

/**
 * Get the crypto id for an account or token of non-testnet network
 */
export function getCryptoId(
    networkSymbol: NetworkSymbol,
    tokenContract?: TokenInfo['contract'],
): CryptoId {
    const network = getNetwork(networkSymbol);

    if (tokenContract) {
        return composeCryptoId(
            network.coingeckoId!,
            getContractAddressForNetworkSymbol(networkSymbol, tokenContract),
        );
    }

    return network.tradeCryptoId as CryptoId;
}

export const isCryptoIdForNativeToken = (cryptoId: CryptoId) => {
    const { contractAddress } = parseCryptoId(cryptoId);

    return contractAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;
};

export const cryptoIdToNetworkAndContractAddress = (
    cryptoId: CryptoId | undefined,
): NetworkAndContractAddress => {
    if (!cryptoId) {
        return { network: undefined, contractAddress: undefined };
    }

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const network = contractAddress
        ? getNetworkByCoingeckoId(networkId)
        : getNetworkByTradeCryptoId(networkId);

    return { network, contractAddress };
};

export const cryptoIdToNetwork = (cryptoId: CryptoId | undefined): Network | undefined =>
    cryptoIdToNetworkAndContractAddress(cryptoId)?.network;

export const cryptoIdToSymbol = (cryptoId: CryptoId | undefined): NetworkSymbol | undefined =>
    cryptoIdToNetwork(cryptoId)?.symbol;

export const cryptoIdToNetworkSymbolAndContractAddress = (cryptoId: CryptoId | undefined) => {
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);
    if (!network || !cryptoId) {
        return { symbol: undefined, contractAddress: undefined };
    }
    const { symbol } = network;

    if (isCryptoIdForNativeToken(cryptoId)) {
        return { symbol, contractAddress: undefined };
    }

    return { symbol, contractAddress };
};

export const toTokenCryptoId = (symbol: NetworkSymbol, contractAddress: string): CryptoId =>
    `${getCoingeckoId(symbol)}${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}` as CryptoId;

/** Convert testnet cryptoId to prod cryptoId (test-bitcoin -> bitcoin) */
export const testnetToProdCryptoId = (cryptoId: CryptoId): CryptoId => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return ((networkId.split('test-')?.[1] ?? networkId) +
        (contractAddress ? `${CRYPTO_PLATFORM_SEPARATOR}${contractAddress}` : '')) as CryptoId;
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
        case 'solana':
        case 'tron':
        case 'stellar': {
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
): Exclude<NetworkSymbol, 'test' | 'tsep' | 'thod' | 'txrp' | 'txlm'> => {
    if (symbol === 'test') return 'btc';
    if (symbol === 'tsep') return 'eth';
    if (symbol === 'thod') return 'eth';
    if (symbol === 'txrp') return 'xrp';
    if (symbol === 'txlm') return 'xlm';

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

export const tradingGetSuccessQuotes = <T extends TradingType>(quotes: TradingTradeMapProps[T][]) =>
    quotes.filter(quote => quote.error === undefined);

export const getDefaultCountry = (country: TradingCountryCode = regional.UNKNOWN_COUNTRY) =>
    regional.getCountryOptionWithWorldwideFallback(country);

export const filterQuotesAccordingTags = <T extends TradingTradeBuySellType>(
    quotes: TradingTradeBuySellMapProps[T][],
) => quotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));

// fill orderId for all, paymentId for sell and buy, quoteId for exchange
export const addIdsToQuotes = <T extends TradingType>(
    quotes: TradingTradeMapProps[T][] | undefined,
    type: TradingType,
): TradingTradeMapProps[T][] => {
    if (!quotes) quotes = [];

    quotes.forEach(quote => {
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

    return quotes;
};

export const getNetworkDecimalsWithFallback = (
    symbol: NetworkSymbol | undefined,
    fallback = getNetwork('btc').decimals,
): number => (symbol ? (getNetwork(symbol).decimals ?? fallback) : fallback);

export const getTradingPaymentMethods = (
    quotes: BuyTrade[] | SellFiatTrade[],
): TradingPaymentMethodListProps[] => {
    const uniqueMethods = new Map<string, TradingPaymentMethodListProps>();

    quotes.forEach(quote => {
        if (!quote.paymentMethod) return;
        const amount = isBuyTrade(quote) ? quote.receiveStringAmount : quote.fiatStringAmount;
        uniqueMethods.set(quote.paymentMethod, {
            value: quote.paymentMethod,
            label: quote.paymentMethodName ?? quote.paymentMethod,
            receiveAmount: amount,
            symbol: isBuyTrade(quote)
                ? cryptoIdToSymbol(quote.receiveCurrency)
                : (quote as SellFiatTrade).fiatCurrency,
        });
    });

    const sortedMethods = Array.from(uniqueMethods.values()).sort((a, b) => {
        const aAmount = new BigNumber(a.receiveAmount || '0');
        const bAmount = new BigNumber(b.receiveAmount || '0');

        return bAmount.minus(aAmount).toNumber();
    });

    return sortedMethods;
};

export const getTradingQuotesByPaymentMethod = <T extends TradingTradeBuySellType>(
    quotes: TradingTradeMapProps[T][],
    currentPaymentMethod: TradingPaymentMethodProps,
): TradingTradeMapProps[T][] =>
    quotes.filter(
        quote => quote.paymentMethod === currentPaymentMethod && quote.error === undefined,
    );

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

export const getTradingFormState = ({
    activeSection,
    trade,
    providers,
    isSlip24Active = false,
    sendAccountKey,
    receiveAccountKey,
}: TradingGetFormStateProps): FormStateTrading => {
    const provider = trade?.exchange ? providers?.[trade.exchange] : undefined;

    // Support for SLIP-24
    switch (activeSection) {
        case 'sell': {
            const defaultState = {
                activeSection,
                isSlip24Active,
            };

            if (
                !trade.fiatStringAmount ||
                !trade.fiatCurrency ||
                !trade.cryptoCurrency ||
                !trade.cryptoStringAmount ||
                !provider?.companyName ||
                !isSlip24Active
            ) {
                return defaultState;
            }

            const networkData = cryptoIdToNetworkAndContractAddress(trade.cryptoCurrency);

            if (!networkData || !networkData.network) {
                return defaultState;
            }

            return {
                activeSection,
                recipientName: provider.companyName,
                isSlip24Active: isSlip24Active && !!receiveAccountKey,
                send: {
                    cryptoId: trade.cryptoCurrency,
                    accountKey: sendAccountKey,
                    symbol: networkData.network.symbol,
                    contractAddress: networkData.contractAddress,
                    amount: trade.cryptoStringAmount,
                },
                receive: {
                    amount: trade.fiatStringAmount,
                    fiatCurrency: trade.fiatCurrency,
                },
            };
        }
        case 'exchange': {
            const defaultState = {
                activeSection,
                isSlip24Active,
            };

            if (
                !trade.receive ||
                !trade.receiveStringAmount ||
                !trade.send ||
                !trade.sendStringAmount ||
                !provider?.companyName
            ) {
                return defaultState;
            }

            const receiveNetworkData = cryptoIdToNetworkAndContractAddress(trade.receive);
            const sendNetworkData = cryptoIdToNetworkAndContractAddress(trade.send);

            if (!receiveNetworkData?.network || !sendNetworkData?.network) {
                return defaultState;
            }

            return {
                activeSection,
                recipientName: provider.companyName,
                isSlip24Active: isSlip24Active && !!receiveAccountKey,
                send: {
                    cryptoId: trade.send,
                    accountKey: sendAccountKey,
                    symbol: sendNetworkData.network.symbol,
                    contractAddress: sendNetworkData.contractAddress,
                    amount: trade.sendStringAmount,
                },
                receive: {
                    cryptoId: trade.receive,
                    accountKey: receiveAccountKey,
                    symbol: receiveNetworkData.network.symbol,
                    contractAddress: receiveNetworkData.contractAddress,
                    amount: trade.receiveStringAmount,
                },
            };
        }
        /* istanbul ignore next */
        default:
            return exhaustive(activeSection);
    }
};

export const getTokenSelectableNetworks = (
    isDebugMode = false,
    allNetworks = networksCollection,
): NetworkSymbol[] =>
    allNetworks
        .filter(
            n =>
                (!n.isDebugOnlyNetwork || isDebugMode) &&
                TOKEN_SELECT_SELECTABLE_NETWORKS.includes(n.symbol),
        )
        .map(n => n.symbol);

export const getTradingPrefilledFromAccountData = (
    { symbol, key }: Account,
    cryptoId?: CryptoId | undefined,
) => {
    const defaultCryptoId = getNetwork(symbol).tradeCryptoId as CryptoId;

    return {
        cryptoId: cryptoId ?? defaultCryptoId,
        key,
    };
};
