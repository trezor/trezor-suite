import {
    type BuyCryptoPaymentMethod,
    type BuyTrade,
    type Coins,
    type CryptoId,
    type ExchangeTrade,
    type FiatCurrencyCode,
    type Platforms,
    type SellCryptoPaymentMethod,
    type SellFiatTrade,
} from 'invity-api';

import {
    type DeviceRootState,
    selectDeviceFirmwareVersion,
    selectDeviceUnavailableCapabilities,
} from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/networks';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    type NetworkSymbolExtended,
    getNetwork,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccounts,
    selectDeviceAccounts,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type SelectedAccountStatus,
} from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';
import { unique, versionUtils } from '@trezor/utils';

import {
    TRADING_SLIP24_MIN_FIRMWARE_VERSION,
    TRADING_SLIP24_SUPPORTED_NETWORK_TYPES,
} from '../constants';
import {
    EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES,
    type GroupedTradingExchangeQuotes,
    groupTradingExchangeQuotesProjection,
} from './utils/groupTradingExchangeQuotesProjection';
import { bestQuotePerPaymentMethodProjection } from './utils/quotePerPaymentMethodProjection';
import { type BuyInfo, type TradingBuyState } from '../reducers/buyReducer';
import { type ExchangeInfo, type TradingExchangeState } from '../reducers/exchangeReducer';
import { type SellInfo, type TradingSellState } from '../reducers/sellReducer';
import type { TradingRootState, TradingState } from '../reducers/tradingCommonReducer';
import {
    type SelectedTradingAsset,
    type TradingBuyPaymentMethodProps,
    type TradingFiatCurrenciesProps,
    type TradingPaymentMethodListProps,
    type TradingPaymentMethodProps,
    type TradingSellPaymentMethodProps,
    type TradingTransaction,
    type TradingTransactionExchange,
    type TradingTransactionSell,
    type TradingType,
} from '../types';
import {
    cryptoIdToNetwork,
    cryptoIdToNetworkSymbolAndContractAddress,
    getTradingQuotesByPaymentMethod,
    isBuyTrade,
    isExchangeProvider,
    testnetToProdCryptoId,
} from '../utils';
import { getDisplayNetworkFee } from '../utils/exchange/exchangeUtils';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';
import { isAccountEligibleForTrade } from '../utils/tradingAccountUtils';

export { EMPTY_GROUPED_TRADING_EXCHANGE_QUOTES, type GroupedTradingExchangeQuotes };

type SelectedAccountRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
    };
};

export type TradingRootStateWithDeviceAndAccounts = TradingRootState &
    DeviceRootState &
    AccountsRootState &
    SelectedAccountRootState;

export type TradingFormAccountRootState = TradingRootStateWithDeviceAndAccounts &
    TokenDefinitionsRootState;

export type TradingBuyInfoSelector = Omit<
    BuyInfo,
    'supportedCryptoCurrencies' | 'supportedFiatCurrencies' | 'buyInfo'
> & {
    buyInfo: Omit<BuyInfo['buyInfo'], 'defaultAmountsOfFiatCurrencies'> & {
        defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps;
    };
    supportedCryptoCurrencies: Set<CryptoId>;
    supportedFiatCurrencies: Set<FiatCurrencyCode>;
};

export type TradingBuyStateSelector = Omit<TradingBuyState, 'buyInfo'> & {
    buyInfo?: TradingBuyInfoSelector;
};

export type TradingExchangeInfoSelector = Omit<ExchangeInfo, 'buyCryptoIds' | 'sellCryptoIds'> & {
    buyCryptoIds: Set<CryptoId>;
    sellCryptoIds: Set<CryptoId>;
};

export type TradingExchangeStateSelector = Omit<TradingExchangeState, 'exchangeInfo'> & {
    exchangeInfo?: TradingExchangeInfoSelector;
};

export type TradingSellInfoSelector = Omit<
    SellInfo,
    'supportedCryptoCurrencies' | 'supportedFiatCurrencies'
> & {
    supportedCryptoCurrencies: Set<CryptoId>;
    supportedFiatCurrencies: Set<FiatCurrencyCode>;
};

export type TradingSellStateSelector = Omit<TradingSellState, 'sellInfo'> & {
    sell?: TradingSellInfoSelector;
};

export type TradingStateSelector = Omit<TradingState, 'buy' | 'exchange' | 'sell'> & {
    buy: TradingBuyStateSelector;
    exchange: TradingExchangeStateSelector;
    sell: TradingSellStateSelector;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();
const createMemoizedSelectorWithDeviceAndAccounts =
    createWeakMapSelector.withTypes<TradingRootStateWithDeviceAndAccounts>();
const createMemoizedFormAccountSelector =
    createWeakMapSelector.withTypes<TradingFormAccountRootState>();

export const bestBuyQuotePerPaymentMethodProjection = (quotes: BuyTrade[]) =>
    bestQuotePerPaymentMethodProjection<BuyCryptoPaymentMethod, BuyTrade>(
        quotes,
        (aRate, bRate) => aRate - bRate,
    );

export const bestSellQuotePerPaymentMethodProjection = (quotes: SellFiatTrade[]) =>
    bestQuotePerPaymentMethodProjection<SellCryptoPaymentMethod, SellFiatTrade>(
        quotes,
        (aRate, bRate) => bRate - aRate,
    );

export const selectTradingLoadingAndTimestamp = createMemoizedSelector(
    [
        (state: TradingRootState) => state.wallet.trading.isLoading,
        (state: TradingRootState) => state.wallet.trading.lastLoadedTimestamp,
    ],
    (isLoading, lastLoadedTimestamp) => ({
        isLoading,
        lastLoadedTimestamp,
    }),
);

export const selectTradingBuyLoadingTimestampAndStatus = createMemoizedSelector(
    [
        selectTradingLoadingAndTimestamp,
        (state: TradingRootState) => state.wallet.trading.info,
        (state: TradingRootState) => state.wallet.trading.buy.buyInfo,
    ],
    (loadingAndTimestamp, info, buyInfo) => ({
        isLoading: loadingAndTimestamp.isLoading,
        lastLoadedTimestamp: loadingAndTimestamp.lastLoadedTimestamp,
        isFullyLoaded:
            !!(info?.coins && info?.platforms && buyInfo) && buyInfo.buyInfo?.providers.length > 0,
    }),
);

export const selectTradingInfo = (state: TradingRootState) => state.wallet?.trading?.info;

export const selectTradingCoins = (state: TradingRootState): Coins | undefined =>
    state.wallet.trading.info.coins;

export const selectTradingBuyInfo = createMemoizedSelector(
    [state => state.wallet.trading.buy.buyInfo],
    (buyInfo): TradingBuyInfoSelector | undefined => {
        if (!buyInfo) return;

        const defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps = new Map();

        if (buyInfo.buyInfo.defaultAmountsOfFiatCurrencies) {
            Object.entries(buyInfo.buyInfo.defaultAmountsOfFiatCurrencies).forEach(
                ([key, value]) => {
                    defaultAmountsOfFiatCurrencies.set(key as FiatCurrencyCode, value.toString());
                },
            );
        }

        return {
            ...buyInfo,
            buyInfo: {
                ...buyInfo.buyInfo,
                defaultAmountsOfFiatCurrencies,
            },
            supportedCryptoCurrencies: new Set(buyInfo.supportedCryptoCurrencies),
            supportedFiatCurrencies: new Set(buyInfo.supportedFiatCurrencies),
        };
    },
);

export const selectTradingExchangeInfo = createMemoizedSelector(
    [state => state.wallet.trading.exchange.exchangeInfo],
    (exchangeInfo): TradingExchangeInfoSelector | undefined => {
        if (!exchangeInfo) return;

        return {
            ...exchangeInfo,
            buyCryptoIds: new Set(exchangeInfo.buyCryptoIds),
            sellCryptoIds: new Set(exchangeInfo.sellCryptoIds),
        };
    },
);

export const selectTradingSellInfo = createMemoizedSelector(
    [state => state.wallet.trading.sell.sellInfo],
    (sellInfo): TradingSellInfoSelector | undefined => {
        if (!sellInfo) return;

        return {
            ...sellInfo,
            supportedFiatCurrencies: new Set(
                sellInfo.supportedFiatCurrencies as FiatCurrencyCode[],
            ),
            supportedCryptoCurrencies: new Set(sellInfo.supportedCryptoCurrencies),
        };
    },
);

export const selectTradingBuy = createMemoizedSelector(
    [state => state.wallet.trading.buy, selectTradingBuyInfo],
    (buy, buyInfo) => ({
        ...buy,
        buyInfo,
    }),
);

export const selectTradingExchange = createMemoizedSelector(
    [state => state.wallet.trading.exchange, selectTradingExchangeInfo],
    (exchange, exchangeInfo) => ({
        ...exchange,
        exchangeInfo,
    }),
);

export const selectTradingSell = createMemoizedSelector(
    [state => state.wallet.trading.sell, selectTradingSellInfo],
    (sell, sellInfo) => ({
        ...sell,
        sellInfo,
    }),
);

export const selectTrading = createMemoizedSelector(
    [state => state.wallet.trading, selectTradingBuy, selectTradingExchange],
    (trading, buy, exchange): TradingStateSelector => ({
        ...trading,
        buy,
        exchange,
    }),
);

export const selectTradingExchangeLoadingTimestampAndStatus = createMemoizedSelector(
    [
        selectTradingLoadingAndTimestamp,
        (state: TradingRootState) => state.wallet.trading.info,
        selectTradingExchangeInfo,
    ],
    (loadingAndTimestamp, info, exchangeInfo) => ({
        isLoading: loadingAndTimestamp.isLoading,
        lastLoadedTimestamp: loadingAndTimestamp.lastLoadedTimestamp,
        isFullyLoaded:
            !!(info?.coins && info?.platforms && exchangeInfo) &&
            Object.keys(exchangeInfo.providerInfos).length > 0,
    }),
);

export const selectTradingSellLoadingTimestampAndStatus = createMemoizedSelector(
    [
        selectTradingLoadingAndTimestamp,
        (state: TradingRootState) => state.wallet.trading.info,
        selectTradingSellInfo,
    ],
    (loadingAndTimestamp, info, sellInfo) => ({
        isLoading: loadingAndTimestamp.isLoading,
        lastLoadedTimestamp: loadingAndTimestamp.lastLoadedTimestamp,
        isFullyLoaded:
            !!(info?.coins && info?.platforms && sellInfo) &&
            Object.keys(sellInfo.providerInfos).length > 0,
    }),
);

export const selectTradingBuyProviders = (state: TradingRootState) =>
    selectTradingBuyInfo(state)?.providerInfos;

export const selectTradingExchangeProviders = (state: TradingRootState) =>
    selectTradingExchangeInfo(state)?.providerInfos;

export const selectTradingSellProviders = (state: TradingRootState) =>
    selectTradingSellInfo(state)?.providerInfos;

export const selectTradingProviderByNameAndTradeType = (
    state: TradingRootState,
    name: string | undefined,
    type: TradingType,
) => {
    if (!name) {
        return undefined;
    }

    switch (type) {
        case 'buy':
            return selectTradingBuyProviders(state)?.[name];
        case 'exchange':
            return selectTradingExchangeProviders(state)?.[name];
        case 'sell':
            return selectTradingSellProviders(state)?.[name];

        default:
            return exhaustive(type);
    }
};

export const selectTradingProviderKycPolicy = (
    state: TradingRootState,
    name: string | undefined,
    type: TradingType,
) => {
    const provider = selectTradingProviderByNameAndTradeType(state, name, type);

    // Only ExchangeProviderInfo has kycPolicyType property
    if (provider && isExchangeProvider(provider)) {
        return provider.kycPolicyType;
    }

    return undefined;
};

export const selectTradingProviderCompanyName = (
    state: TradingRootState,
    name: string | undefined,
    type: TradingType,
) => selectTradingProviderByNameAndTradeType(state, name, type)?.companyName ?? name;

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.buy.quotesRequest;

export const selectTradingBuyIsFromRedirect = (state: TradingRootState) =>
    state.wallet.trading.buy.isFromRedirect;

export const selectTradingExchangeQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.exchange.quotesRequest;

export const selectTradingExchangeIsFromRedirect = (state: TradingRootState) =>
    state.wallet.trading.exchange.isFromRedirect;

export const selectTradingExchangeQuotes = (state: TradingRootState) =>
    state.wallet.trading.exchange.quotes;

export const selectTradingSellQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.sell.quotesRequest;

export const selectTradingSellIsFromRedirect = (state: TradingRootState) =>
    state.wallet.trading.sell.isFromRedirect;

export const selectTradingBuySelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.buy.selectedQuote;

export const selectTradingExchangeSelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.exchange.selectedQuote;

export const selectTradingExchangeSelectedQuoteSwapSlippage = (state: TradingRootState) =>
    state.wallet.trading.exchange.selectedQuote?.swapSlippage;

export const selectTradingExchangeSelectedQuoteIsDex = (state: TradingRootState) =>
    state.wallet.trading.exchange.selectedQuote?.isDex;

export const selectTradingSellSelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.sell.selectedQuote;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.trading.trades);

export const selectTradedAccountKeys = createMemoizedSelector([selectTradingTrades], trades =>
    unique(
        trades
            .flatMap(trade => [
                'selectedAccountKey' in trade ? trade.selectedAccountKey : undefined,
                'receiveAccountKey' in trade ? trade.receiveAccountKey : undefined,
                'sendAccountKey' in trade ? trade.sendAccountKey : undefined,
            ])
            .filter((key): key is AccountKey => !!key),
    ),
);

export const selectTradingTradesForSelectedDevice = createMemoizedSelectorWithDeviceAndAccounts(
    [selectAccounts, state => state.wallet.selectedAccount, selectTradingTrades],
    (accounts, selectedAccount, trades): TradingTransaction[] =>
        trades.filter(tx => {
            const txDeviceId = accounts.find(account => {
                const transactionAccountKey =
                    'selectedAccountKey' in tx ? tx.selectedAccountKey : tx.sendAccountKey;

                return transactionAccountKey === account.key;
            })?.deviceState;

            return txDeviceId === selectedAccount.account?.deviceState;
        }),
);

export const selectDeviceTradingTrades: (
    state: TradingRootStateWithDeviceAndAccounts,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [state => selectDeviceAccounts(state), selectTradingTrades],
    (accounts, trades) => {
        const accountKeys = new Set(accounts.map(({ key }) => key));

        return returnStableArrayIfEmpty(
            trades.filter(trade => {
                const tradeKey =
                    'selectedAccountKey' in trade ? trade.selectedAccountKey : trade.sendAccountKey;

                return tradeKey && accountKeys.has(tradeKey);
            }),
        );
    },
);

export const selectDeviceTradingTradesOrderedByDate: (
    state: TradingRootStateWithDeviceAndAccounts,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [selectDeviceTradingTrades],
    trades => trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);

export const selectDeviceHasTradingTrades = (state: TradingRootStateWithDeviceAndAccounts) =>
    selectDeviceTradingTrades(state).length > 0;

export const selectTradingTradeByOrderId = (state: TradingRootState, orderId: string | undefined) =>
    selectTradingTrades(state).find(t => orderId && t.data.orderId === orderId);

export const selectTradingCoinInfoByCryptoId = createMemoizedSelector(
    [selectTradingCoins, (_: TradingRootState, cryptoId: CryptoId | undefined) => cryptoId],
    (coins, cryptoId) => {
        if (!cryptoId) {
            return undefined;
        }

        return getTradingCoinInfoByCryptoId(coins ?? {}, cryptoId);
    },
);

export const selectTradingCoinSymbolByCryptoId = createMemoizedSelector(
    [selectTradingCoins, (_: TradingRootState, cryptoId: CryptoId | undefined) => cryptoId],
    (coins, cryptoId) => {
        if (cryptoId === undefined) {
            return undefined;
        }

        return getTradingCoinSymbolByCryptoId(coins ?? {}, cryptoId);
    },
);

export const selectTradingPlatformByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId | undefined,
) => {
    if (!cryptoId) {
        return undefined;
    }
    const { platforms = {} } = state.wallet.trading.info;

    return getTradingPlatformsInfoByCryptoId(platforms, cryptoId);
};

export const selectTradingNativeCoinSymbolByCryptoId: (
    state: TradingRootState,
    cryptoId: CryptoId,
) => string | undefined = createMemoizedSelector(
    [
        selectTradingCoins,
        ({ wallet }: TradingRootState) => wallet.trading.info.platforms,
        (_: TradingRootState, cryptoId: CryptoId) => cryptoId,
    ],
    (coins, platforms, cryptoId) =>
        getTradingNativeCoinSymbolByCryptoId(platforms ?? {}, coins ?? {}, cryptoId),
);

export const selectTradingSymbolAndContractAddressByCryptoId: (
    state: TradingRootState,
    cryptoId: CryptoId,
) => {
    coinSymbol: NetworkSymbolExtended | undefined;
    contractAddress: string | undefined;
} = createMemoizedSelector(
    [selectTradingCoins, (_: TradingRootState, cryptoId: CryptoId): CryptoId => cryptoId],
    getTradingSymbolAndContractAddressByCryptoId,
);

const getFilteredCryptoIds = (
    supportedCryptoIds: CryptoId[],
    coins: Coins | undefined,
    platforms: Platforms | undefined,
    supportedCoins: readonly NetworkSymbol[],
) => {
    if (!coins || !platforms) {
        return [];
    }

    const uniqueSupportedCryptoIds = unique(supportedCryptoIds);
    const supportedAddressValidatorSymbols = new Set(supportedCoins);

    return uniqueSupportedCryptoIds
        .filter(cryptoId => !!coins[cryptoId])
        .filter(cryptoId => cryptoIdToNetwork(cryptoId))
        .filter(cryptoId => {
            const prodCryptoId = testnetToProdCryptoId(cryptoId);
            const nativeCoinSymbol =
                cryptoIdToNetwork(prodCryptoId)?.symbol ??
                getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

            return (
                nativeCoinSymbol !== undefined &&
                isNetworkSymbol(nativeCoinSymbol) &&
                supportedAddressValidatorSymbols.has(nativeCoinSymbol)
            );
        });
};

export const selectTradingBuySupportedCryptoIds = createMemoizedSelector(
    [
        selectTradingCoins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.trading.buy.buyInfo?.supportedCryptoCurrencies,
            ),
        (_: TradingRootState, supportedCoins: readonly NetworkSymbol[]) => supportedCoins,
    ],
    (coins, platforms, supportedCryptoIds, supportedCoins) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms, supportedCoins),
);

export const selectTradingSellSupportedCryptoIds = createMemoizedSelector(
    [
        selectTradingCoins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.trading.sell.sellInfo?.supportedCryptoCurrencies,
            ),
        (_: TradingRootState, supportedCoins: readonly NetworkSymbol[]) => supportedCoins,
    ],
    (coins, platforms, supportedCryptoIds, supportedCoins) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms, supportedCoins),
);

const createExchangeCryptoIdsSelector = (key: 'buyCryptoIds' | 'sellCryptoIds') =>
    createMemoizedSelector(
        [
            selectTradingCoins,
            ({ wallet }) => wallet.trading.info.platforms,
            ({ wallet }) =>
                returnStableArrayIfEmpty<CryptoId>(wallet.trading.exchange.exchangeInfo?.[key]),
            (_: TradingRootState, supportedCoins: readonly NetworkSymbol[]) => supportedCoins,
        ],
        (coins, platforms, cryptoIds, supportedCoins) =>
            getFilteredCryptoIds(cryptoIds, coins, platforms, supportedCoins),
    );

export const selectTradingExchangeSellCryptoIds = createExchangeCryptoIdsSelector('sellCryptoIds');
export const selectTradingExchangeBuyCryptoIds = createExchangeCryptoIdsSelector('buyCryptoIds');

export const selectTradingSellSellCryptoIds = createMemoizedSelector(
    [
        selectTradingCoins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) => wallet.trading.sell.sellInfo?.supportedCryptoCurrencies,
        (_: TradingRootState, supportedCoins: readonly NetworkSymbol[]) => supportedCoins,
    ],
    (coins, platforms, supportedCryptoIds, supportedCoins) =>
        getFilteredCryptoIds(
            returnStableArrayIfEmpty<CryptoId>(supportedCryptoIds),
            coins,
            platforms,
            supportedCoins,
        ),
);

export const selectTradingBuyIsLoading = (state: TradingRootState) =>
    state.wallet.trading.buy.isLoading;

export const selectTradingBuyAmountLimits = (state: TradingRootState) =>
    state.wallet.trading.buy.amountLimits;

export const selectTradingBuyQuotes = (state: TradingRootState) => state.wallet.trading.buy.quotes;

export const selectTradingBuyQuotesByPaymentMethod = createMemoizedSelector(
    [
        selectTradingBuyQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) =>
        returnStableArrayIfEmpty(
            paymentMethod ? getTradingQuotesByPaymentMethod<'buy'>(quotes, paymentMethod) : [],
        ),
);

export const selectTradingBuyQuoteByOrderId = (
    state: TradingRootState,
    orderId: string | undefined,
) => (orderId ? state.wallet.trading.buy.quotes.find(q => q.orderId === orderId) : undefined);

export const selectTradingExchangeIsLoading = (state: TradingRootState) =>
    state.wallet.trading.exchange.isLoading;

export const selectTradingExchangeAmountLimits = (state: TradingRootState) =>
    state.wallet.trading.exchange.amountLimits;

export const selectGroupedTradingExchangeQuotes = createMemoizedSelector(
    [selectTradingExchangeQuotes, selectTradingExchangeProviders],
    groupTradingExchangeQuotesProjection,
);

export const selectTradingExchangeDexQuotes = createMemoizedSelector(
    [selectGroupedTradingExchangeQuotes],
    groupedQuotes => groupedQuotes.dex,
);

export const selectTradingExchangeCexQuotes = createMemoizedSelector(
    [selectTradingExchangeQuotes],
    quotes => returnStableArrayIfEmpty(quotes.filter(quote => !quote.isDex)),
);

export const selectTradingExchangeDexQuoteApprovalPrefetchLoading = (state: TradingRootState) =>
    !!state.wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId;

export const selectTradingExchangeDexQuoteApprovalPrefetchLoadingByQuoteId = (
    state: TradingRootState,
    quoteId: string | undefined,
) => !!quoteId && state.wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId === quoteId;

export const selectTradingExchangeDexQuoteApprovalPrefetchLoadingQuoteId = (
    state: TradingRootState,
) => state.wallet.trading.exchange.dexQuoteApprovalPrefetchLoadingQuoteId;

export const selectTradingSellIsLoading = (state: TradingRootState) =>
    state.wallet.trading.sell.isLoading;

export const selectTradingSellAmountLimits = (state: TradingRootState) =>
    state.wallet.trading.sell.amountLimits;

export const selectTradingSellQuotes = (state: TradingRootState) =>
    state.wallet.trading.sell.quotes;

export const selectTradingQuotesByType = (
    state: TradingRootState,
    type: TradingType,
): BuyTrade[] | SellFiatTrade[] | ExchangeTrade[] => {
    switch (type) {
        case 'buy':
            return selectTradingBuyQuotes(state);
        case 'sell':
            return selectTradingSellQuotes(state);
        case 'exchange':
            return selectTradingExchangeQuotes(state);
        default:
            return exhaustive(type);
    }
};

export const selectTradingSellQuotesByPaymentMethod = createMemoizedSelector(
    [
        selectTradingSellQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) =>
        returnStableArrayIfEmpty(
            paymentMethod ? getTradingQuotesByPaymentMethod<'sell'>(quotes, paymentMethod) : [],
        ),
);

export const selectTradingExchangeFormStep = (state: TradingRootState) =>
    state.wallet.trading.exchange.formStep;

export const selectTradingSellFormStep = (state: TradingRootState) =>
    state.wallet.trading.sell.formStep;

export const selectTradingComposedTransactionInfo = (state: TradingRootState) =>
    state.wallet.trading.composedTransactionInfo;

export const selectTradingDisplayComposedFee = (
    state: TradingRootState,
    quote: ExchangeTrade | undefined,
): string | undefined =>
    getDisplayNetworkFee(quote, state.wallet.trading.composedTransactionInfo.composed?.fee);

export const selectIsTradingNetworkFeeMissing = (
    state: TradingRootState,
    quote?: ExchangeTrade,
): boolean => {
    const fee = selectTradingDisplayComposedFee(state, quote);

    return fee === undefined || fee === '';
};

export const selectTradingAccountAccordingActiveSection: (
    state: TradingRootStateWithDeviceAndAccounts,
    activeSection: TradingType,
    selectedAccount: SelectedAccountStatus,
) => Account | undefined = createMemoizedSelectorWithDeviceAndAccounts(
    [
        selectTradingExchange,
        selectTradingSell,
        selectTradingBuy,
        ({ wallet }) => wallet.accounts,
        (_: TradingRootState, activeSection: TradingType) => activeSection,
        (_: TradingRootState, __: TradingType, selectedAccount: SelectedAccountStatus) =>
            selectedAccount,
    ],
    (tradingExchange, tradingSell, tradingBuy, accounts, activeSection, selectedAccount) => {
        const tradingSectionMap = {
            buy: tradingBuy.tradingAccountKey,
            sell: tradingSell.tradingAccountKey,
            exchange: tradingExchange.tradingAccountKey,
        };

        const tradingAccountKey = tradingSectionMap[activeSection];

        const account = tradingAccountKey
            ? accounts.find(acc => acc.key === tradingAccountKey)
            : null;

        return account ?? selectedAccount.account; // TODO: trading - delete selectedAccount and set tradingAccountKey on desktop
    },
);

export const selectValidTradingBuyQuotes = createMemoizedSelector(
    [selectTradingBuyQuotes],
    quotes => {
        if (!quotes) return [];

        return quotes.filter(item => item.rate && item.rate !== 0);
    },
);

export const selectValidTradingSellQuotes = createMemoizedSelector(
    [selectTradingSellQuotes],
    quotes => {
        if (!quotes) return [];

        return quotes.filter(item => item.rate && item.rate !== 0);
    },
);

export const selectTradingBuyQuotesPerPaymentMethod = createMemoizedSelector(
    [selectValidTradingBuyQuotes],
    bestBuyQuotePerPaymentMethodProjection,
);

export const selectTradingSellQuotesPerPaymentMethod = createMemoizedSelector(
    [selectValidTradingSellQuotes],
    bestSellQuotePerPaymentMethodProjection,
);

export const selectTradingBuyPaymentMethods = createMemoizedSelector(
    [selectTradingBuyQuotesPerPaymentMethod],
    quotes =>
        quotes.map(quote => ({
            value: quote.paymentMethod as TradingBuyPaymentMethodProps,
            label: quote.paymentMethodName ?? '',
        })),
);

export const selectTradingSellPaymentMethods = createMemoizedSelector(
    [selectTradingSellQuotesPerPaymentMethod],
    quotes =>
        quotes.map(quote => ({
            value: quote.paymentMethod as TradingSellPaymentMethodProps,
            label: quote.paymentMethodName ?? '',
        })),
);

export const selectTradingQuotesPerPaymentMethodByType = createMemoizedSelector(
    [
        selectTradingBuyQuotesPerPaymentMethod,
        selectTradingSellQuotesPerPaymentMethod,
        (_: TradingRootState, type: TradingType) => type,
    ],
    (buyQuotes, sellQuotes, type): BuyTrade[] | SellFiatTrade[] => {
        switch (type) {
            case 'buy':
                return buyQuotes;
            case 'sell':
                return sellQuotes;
            case 'exchange':
                return [];
            default:
                return exhaustive(type);
        }
    },
);

export const selectTradingPaymentMethodsByType = createMemoizedSelector(
    [
        selectTradingBuyPaymentMethods,
        selectTradingSellPaymentMethods,
        (_: TradingRootState, type: TradingType) => type,
    ],
    (buyPaymentMethods, sellPaymentMethods, type): TradingPaymentMethodListProps[] => {
        switch (type) {
            case 'buy':
                return buyPaymentMethods;
            case 'sell':
                return sellPaymentMethods;
            case 'exchange':
                return [];
            default:
                return exhaustive(type);
        }
    },
);

export const selectTradingSelectedPaymentMethodByType = createMemoizedSelector(
    [
        selectTradingPaymentMethodsByType,
        (
            _: TradingRootState,
            __: TradingType,
            paymentMethod: TradingPaymentMethodProps | undefined,
        ) => paymentMethod,
    ],
    (paymentMethods, paymentMethod): TradingPaymentMethodListProps | undefined =>
        paymentMethods.find(option => option.value === paymentMethod) ?? paymentMethods[0],
);

export const selectTradingBuyAccountKey = (state: TradingRootState) =>
    state.wallet.trading.buy.tradingAccountKey;
export const selectTradingBuyReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.trading.buy.receiveAccountKey;
export const selectTradingBuyReceiveAddress = (state: TradingRootState) =>
    state.wallet.trading.buy.receiveAddress;

export const selectTradingExchangeAccountKey = (state: TradingRootState) =>
    state.wallet.trading.exchange.tradingAccountKey;

export const selectTradingExchangeReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.trading.exchange.receiveAccountKey;
export const selectTradingExchangeReceiveAddress = (state: TradingRootState) =>
    state.wallet.trading.exchange.receiveAddress;

export const selectTradingSellAccountKey = (state: TradingRootState) =>
    state.wallet.trading.sell.tradingAccountKey;

export const selectTradingAccountKeyByTradeType = createMemoizedSelector(
    [
        selectTradingExchangeAccountKey,
        selectTradingSellAccountKey,
        selectTradingBuyAccountKey,
        (_: TradingRootState, tradeType: TradingType) => tradeType,
    ],
    (exchangeAccountKey, sellAccountKey, buyAccountKey, tradeType) => {
        switch (tradeType) {
            case 'exchange':
                return exchangeAccountKey;
            case 'sell':
                return sellAccountKey;
            case 'buy':
                return buyAccountKey;
            default:
                exhaustive(tradeType, 'Unexpected trade type');
        }
    },
);

export const selectTradingModalAccountKey = (state: TradingRootState) =>
    state.wallet.trading.modalAccountKey;

export const selectTradingPrefilledFromAccount = (state: TradingRootState) =>
    state.wallet.trading.prefilledFromAccount;

export const selectTradingActiveSection = (state: TradingRootState) =>
    state.wallet.trading.activeSection;

export const selectTradingSupportedSymbols = createMemoizedSelector(
    [
        (state: TradingRootState, _type: TradingType, supportedCoins: readonly NetworkSymbol[]) =>
            selectTradingBuySupportedCryptoIds(state, supportedCoins),
        (state: TradingRootState, _type: TradingType, supportedCoins: readonly NetworkSymbol[]) =>
            selectTradingExchangeSellCryptoIds(state, supportedCoins),
        (state: TradingRootState, _type: TradingType, supportedCoins: readonly NetworkSymbol[]) =>
            selectTradingSellSupportedCryptoIds(state, supportedCoins),
        (_: TradingRootState, type: TradingType) => type,
    ],
    (buyCryptoIds, exchangeCryptoIds, sellCryptoIds, type) => {
        switch (type) {
            case 'buy':
                return buyCryptoIds;
            case 'exchange':
                return exchangeCryptoIds;
            case 'sell':
                return sellCryptoIds;
            default:
                exhaustive(type, 'Unexpected trade type');
        }
    },
);

export const selectTradingExchangeTransactionId = (state: TradingRootState) =>
    state.wallet.trading.exchange.transactionId;

export const selectTradingSellTransactionId = (state: TradingRootState) =>
    state.wallet.trading.sell.transactionId;

export const selectTradingSellActiveTrade = (
    state: TradingRootState,
): TradingTransactionSell | undefined => {
    const transactionId = selectTradingSellTransactionId(state);

    return selectTradingTrades(state).find(
        (trade): trade is TradingTransactionSell =>
            trade.tradeType === 'sell' && trade.key === transactionId,
    );
};

export const selectTradingExchangeActiveTrade = (
    state: TradingRootState,
): TradingTransactionExchange | undefined => {
    const transactionId = selectTradingExchangeTransactionId(state);

    return selectTradingTrades(state).find(
        (trade): trade is TradingTransactionExchange =>
            trade.tradeType === 'exchange' &&
            !!transactionId &&
            trade.data.orderId === transactionId,
    );
};

const selectPreferredTradingAccount = (
    state: TradingFormAccountRootState,
    tradingType: TradingType,
) => {
    const accountKey = selectTradingAccountKeyByTradeType(state, tradingType);
    const prefilled = selectTradingPrefilledFromAccount(state);

    return selectAccountByKey(state, accountKey ?? prefilled.key);
};

/*
 * Selects the most suitable account for trading forms.
 *
 * Eligibility (per isAccountEligibleForTrade):
 * - buy: any account is eligible.
 * - native cryptoId (or none): positive native balance OR any non-hidden token with balance.
 * - specific token cryptoId (prefilled): that token must have a positive balance.
 *
 * Selection priority:
 * 1) Preferred account (selected trading account key OR prefilled.key) if eligible.
 * 2) First account with the same symbol as the preferred account that is eligible.
 * 3) First eligible visible account (default preselect once discovery is done).
 * 4) Otherwise undefined — no eligible account exists, the form renders empty.
 */
export const selectTradingFormAccount = createMemoizedFormAccountSelector(
    [
        selectVisibleDeviceAccounts,
        selectTokenDefinitions,
        selectTradingPrefilledFromAccount,
        selectPreferredTradingAccount,
        (_state: TradingFormAccountRootState, tradingType: TradingType) => tradingType,
    ],
    (
        visibleDeviceAccounts,
        tokenDefinitions,
        prefilled,
        preferredAccount,
        tradingType,
    ): Account | undefined => {
        const eligibilityCryptoId = prefilled.key ? prefilled.cryptoId : undefined;

        const isEligible = (account: Account, cryptoId?: CryptoId) =>
            isAccountEligibleForTrade(account, tradingType, tokenDefinitions, cryptoId);

        if (preferredAccount && isEligible(preferredAccount, eligibilityCryptoId)) {
            return preferredAccount;
        }

        const sameSymbolAccount = visibleDeviceAccounts.find(
            account =>
                account.symbol === preferredAccount?.symbol &&
                isEligible(account, eligibilityCryptoId),
        );

        if (sameSymbolAccount) {
            return sameSymbolAccount;
        }

        return visibleDeviceAccounts.find(account => isEligible(account, eligibilityCryptoId));
    },
);

export const selectTradingFormCryptoId = createMemoizedFormAccountSelector(
    [selectTradingFormAccount, selectPreferredTradingAccount, selectTradingPrefilledFromAccount],
    (account, preferredAccount, prefilled): CryptoId | undefined => {
        if (!account) {
            return undefined;
        }

        if (prefilled.cryptoId && account.key === preferredAccount?.key) {
            return prefilled.cryptoId;
        }

        return (getNetwork(account.symbol).tradeCryptoId ?? 'bitcoin') as CryptoId;
    },
);

const selectTradingActiveTradeSendAccount = (
    state: TradingFormAccountRootState,
    tradingType: TradingType,
) => {
    switch (tradingType) {
        case 'sell':
            return selectAccountByKey(state, selectTradingSellActiveTrade(state)?.sendAccountKey);
        case 'exchange':
            return selectAccountByKey(
                state,
                selectTradingExchangeActiveTrade(state)?.sendAccountKey,
            );
        case 'buy':
            return undefined;
        default:
            return exhaustive(tradingType);
    }
};

export const selectTradingSendAccount = createMemoizedFormAccountSelector(
    [selectTradingActiveTradeSendAccount, selectTradingFormAccount],
    (tradeSendAccount, formAccount) => tradeSendAccount ?? formAccount,
);

export const selectSelectedTradingAsset = createMemoizedFormAccountSelector(
    [selectTradingSendAccount, selectTradingFormCryptoId],
    (account, cryptoId): SelectedTradingAsset | undefined => {
        if (!account || !cryptoId) {
            return undefined;
        }

        return {
            symbol: account.symbol,
            decimals: getNetwork(account.symbol).decimals,
            balance: account.balance,
            formattedBalance: account.formattedBalance,
            tokens: account.tokens,
            cryptoId,
            isToken: !!cryptoIdToNetworkSymbolAndContractAddress(cryptoId).contractAddress,
        };
    },
);

export const selectTradingBuyTransactionId = (state: TradingRootState) =>
    state.wallet.trading.buy.transactionId;

export const selectTradingVerifiedAddress = (state: TradingRootState) =>
    state.wallet.trading.verifiedAddress;

export const selectTradingIsSlip24Allowed = createMemoizedSelectorWithDeviceAndAccounts(
    [
        state => selectDeviceUnavailableCapabilities(state),
        state => selectDeviceFirmwareVersion(state),
        (_: TradingRootState, account: Account | undefined | null) => account,
        (_: TradingRootState, __: Account | undefined | null, isSlip24Active: boolean) =>
            isSlip24Active,
    ],
    (unavailableCapabilities, firmwareVersion, account, isSlip24Active) => {
        if (!account) {
            return false;
        }

        const isFirmwareVersionSlip24Compatible =
            !unavailableCapabilities?.['slip24'] &&
            !!firmwareVersion &&
            versionUtils.isNewerOrEqual(firmwareVersion, TRADING_SLIP24_MIN_FIRMWARE_VERSION);
        const isNetworkSupported = TRADING_SLIP24_SUPPORTED_NETWORK_TYPES.includes(
            account.networkType,
        );

        return isSlip24Active && isFirmwareVersionSlip24Compatible && isNetworkSupported;
    },
);

export const selectTradingDetailData = createMemoizedSelector(
    [
        selectTradingBuyInfo,
        selectTradingSellInfo,
        selectTradingExchangeInfo,
        selectTradingBuyTransactionId,
        selectTradingSellTransactionId,
        selectTradingExchangeTransactionId,
        selectTradingTrades,
        (_: TradingRootState, tradeType: TradingType) => tradeType,
    ],
    (
        buyInfo,
        sellInfo,
        exchangeInfo,
        buyTransactionId,
        sellTransactionId,
        exchangeTransactionId,
        trades,
        tradeType,
    ) => {
        const infos = {
            buy: buyInfo,
            sell: sellInfo,
            exchange: exchangeInfo,
        };
        const transactionIds = {
            buy: buyTransactionId,
            sell: sellTransactionId,
            exchange: exchangeTransactionId,
        };
        const info = infos[tradeType];
        const transactionId = transactionIds[tradeType];

        const trade = trades.find(
            t =>
                t.tradeType === tradeType &&
                (t.key == transactionId ||
                    (tradeType === 'buy' &&
                        isBuyTrade(t.data) &&
                        t.data?.originalPaymentId === transactionId)),
        );

        return {
            transactionId,
            info,
            trade,
        };
    },
);

export const selectTradingBuyLastErrorMessage = (state: TradingRootState) =>
    selectTradingBuy(state).lastErrorMessage;

export const selectTradingExchangeLastErrorMessage = (state: TradingRootState) =>
    selectTradingExchange(state).lastErrorMessage;

export const selectTradingSellLastErrorMessage = (state: TradingRootState) =>
    selectTradingSell(state).lastErrorMessage;

export const selectTradingLastErrorMessageByTradeType = (
    state: TradingRootState,
    tradingType: TradingType,
) => {
    switch (tradingType) {
        case 'buy':
            return selectTradingBuyLastErrorMessage(state);

        case 'exchange':
            return selectTradingExchangeLastErrorMessage(state);

        case 'sell':
            return selectTradingSellLastErrorMessage(state);

        default:
            exhaustive(tradingType, 'Unexpected trade type');
    }
};

export const selectTradingProviderMetadata = (state: TradingRootState) =>
    state.wallet.trading.currentProviderMetadata;

export const selectTradingQuoteRefetchingState = (state: TradingRootState) =>
    state.wallet.trading.quoteRefetchingState;
