import { Coins, CryptoId, FiatCurrencyCode } from 'invity-api';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';
import addressValidator from '@trezor/address-validator';

import { BuyInfo, TradingBuyState } from '../reducers/buyReducer';
import { ExchangeInfo, TradingExchangeState } from '../reducers/exchangeReducer';
import type { TradingInfo, TradingState } from '../reducers/tradingReducer';
import {
    InvityServerEnvironment,
    TradingFiatCurrenciesProps,
    TradingPaymentMethodProps,
    TradingTransaction,
    TradingType,
} from '../types';
import {
    cryptoIdToNetwork,
    getBestRatedQuote,
    getTradingQuotesByPaymentMethod,
    testnetToProdCryptoId,
} from '../utils';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';

// partial copy of Suite state
export type TradingRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
        accounts: Account[];
        tradingNew: TradingState; // TODO: trading - tradingNew is temporary
    };
    suite: {
        settings: {
            addressDisplayType: AddressDisplayOptions;
            debug: {
                invityServerEnvironment?: InvityServerEnvironment;
            };
        };
    };
};

export type TradingBuyInfoSelector = Omit<
    BuyInfo,
    'supportedCryptoCurrencies' | 'supportedFiatCurrencies' | 'buyInfo'
> & {
    buyInfo: Omit<BuyInfo['buyInfo'], 'defaultAmountsOfFiatCurrencies'> & {
        defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps;
    };
    supportedCryptoCurrencies: Set<CryptoId>;
    supportedFiatCurrencies: Set<string>;
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

export type TradingStateSelector = Omit<TradingState, 'buy' | 'exchange'> & {
    buy: TradingBuyStateSelector;
    exchange: TradingExchangeStateSelector;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();

export const selectTradingLoadingAndTimestamp = createMemoizedSelector(
    [
        (state: TradingRootState) => state.wallet.tradingNew.isLoading,
        (state: TradingRootState) => state.wallet.tradingNew.lastLoadedTimestamp,
    ],
    (isLoading, lastLoadedTimestamp) => ({
        isLoading,
        lastLoadedTimestamp,
    }),
);

export const selectTradingInfo = (state: TradingRootState) => state.wallet?.tradingNew?.info;
export const selectTradingInfoLegacy = (state: any) =>
    state.wallet?.trading?.info as TradingInfo | undefined; // TODO: trading - delete after migration

export const selectTradingBuyInfo = createMemoizedSelector(
    [state => state.wallet.tradingNew.buy],
    (buy): TradingBuyInfoSelector | undefined => {
        const { buyInfo } = buy;

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
    [state => state.wallet.tradingNew.exchange],
    (exchange): TradingExchangeInfoSelector | undefined => {
        const { exchangeInfo } = exchange;

        if (!exchangeInfo) return;

        return {
            ...exchangeInfo,
            buyCryptoIds: new Set(exchangeInfo.buyCryptoIds),
            sellCryptoIds: new Set(exchangeInfo.sellCryptoIds),
        };
    },
);

export const selectTradingBuy = createMemoizedSelector(
    [state => state.wallet.tradingNew.buy, selectTradingBuyInfo],
    (buy, buyInfo) => ({
        ...buy,
        buyInfo,
    }),
);

export const selectTradingExchange = createMemoizedSelector(
    [state => state.wallet.tradingNew.exchange, selectTradingExchangeInfo],
    (exchange, exchangeInfo) => ({
        ...exchange,
        exchangeInfo,
    }),
);

export const selectTrading = createMemoizedSelector(
    [state => state.wallet.tradingNew, selectTradingBuy, selectTradingExchange],
    (tradingNew, buy, exchange): TradingStateSelector => ({
        ...tradingNew,
        buy,
        exchange,
    }),
);

export const selectTradingBuyProviders = createMemoizedSelector(
    [selectTradingBuyInfo],
    buyInfo => buyInfo?.providerInfos,
);

export const selectTradingExchangeProviders = createMemoizedSelector(
    [selectTradingExchangeInfo],
    exchangeInfo => exchangeInfo?.providerInfos,
);

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
            // TODO: Not implemented until SELL is migrated to suite-common
            return undefined;
    }
};

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.quotesRequest;

export const selectTradingExchangeQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.quotesRequest;

export const selectTradingBuySelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.selectedQuote;

export const selectTradingExchangeSelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.selectedQuote;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.tradingNew.info.paymentMethods;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.tradingNew.trades);

export const selectTradingTradesByTradeType: (
    state: TradingRootState,
    tradeType: TradingType,
) => TradingTransaction[] = createMemoizedSelector(
    [({ wallet }) => wallet.tradingNew.trades, (_, tradeType: TradingType) => tradeType],
    (trades, tradeType) => returnStableArrayIfEmpty(trades.filter(t => t.tradeType === tradeType)),
);

export const selectHasTradingTradesOfTradeType = (
    state: TradingRootState,
    tradeType: TradingType,
) => selectTradingTradesByTradeType(state, tradeType).length > 0;

export const selectTradingTradeByOrderId = (state: TradingRootState, orderId: string) =>
    selectTradingTrades(state).find(t => t.data.orderId === orderId);

export const selectTradingCoinInfoByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId | undefined,
) => {
    if (!cryptoId) {
        return undefined;
    }
    const { coins = {} } = state.wallet.tradingNew.info;

    return getTradingCoinInfoByCryptoId(coins, cryptoId);
};

export const selectTradingCoinSymbolByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId | undefined,
) => {
    if (cryptoId === undefined) {
        return undefined;
    }
    const { coins = {} } = state.wallet.tradingNew.info;

    return getTradingCoinSymbolByCryptoId(coins, cryptoId);
};

export const selectTradingPlatformByCryptoId = (state: TradingRootState, cryptoId: CryptoId) => {
    const { platforms = {} } = state.wallet.tradingNew.info;

    return getTradingPlatformsInfoByCryptoId(platforms, cryptoId);
};

export const selectTradingNativeCoinSymbolByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId,
) => {
    const { coins = {}, platforms = {} } = state.wallet.tradingNew.info;

    return getTradingNativeCoinSymbolByCryptoId(platforms, coins, cryptoId);
};

export const selectTradingSymbolAndContractAddressByCryptoId: (
    state: TradingRootState,
    cryptoId: CryptoId,
) => {
    coinSymbol: NetworkSymbolExtended | undefined;
    contractAddress: string | undefined;
} = createMemoizedSelector(
    [
        ({ wallet }: TradingRootState, _: CryptoId): Coins | undefined =>
            wallet.tradingNew.info.coins,
        (_: TradingRootState, cryptoId: CryptoId): CryptoId => cryptoId,
    ],
    getTradingSymbolAndContractAddressByCryptoId,
);

export const selectTradingBuySupportedCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.tradingNew.info.coins,
        ({ wallet }) => wallet.tradingNew.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.tradingNew.buy.buyInfo?.supportedCryptoCurrencies,
            ),
    ],
    (coins, platforms, supportedCryptoIds) => {
        if (!coins || !platforms) {
            return [];
        }

        const supportedAddressValidatorSymbols = new Set(
            addressValidator.getCurrencies().map(c => c.symbol),
        );

        const uniqueSupportedCryptoIds = [...new Set(supportedCryptoIds).values()];

        return uniqueSupportedCryptoIds
            .filter(cryptoId => !!coins[cryptoId])
            .filter(cryptoId => cryptoIdToNetwork(cryptoId))
            .filter(cryptoId => {
                const prodCryptoId = testnetToProdCryptoId(cryptoId);
                const nativeCoinSymbol =
                    cryptoIdToNetwork(prodCryptoId)?.symbol ??
                    getTradingNativeCoinSymbolByCryptoId(platforms, coins, prodCryptoId);

                return nativeCoinSymbol && supportedAddressValidatorSymbols.has(nativeCoinSymbol);
            });
    },
);

export const selectTradingBuyIsLoading = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.isLoading;

export const selectTradingBuyQuotes = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.quotes;

export const selectTradingBuyQuoteByOrderId = (
    state: TradingRootState,
    orderId: string | undefined,
) => (orderId ? state.wallet.tradingNew.buy.quotes.find(q => q.orderId === orderId) : undefined);

export const selectBuyQuotesByPaymentMethod = createMemoizedSelector(
    [
        selectTradingBuyQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) =>
        paymentMethod
            ? getTradingQuotesByPaymentMethod<'buy'>(quotes, paymentMethod)?.sort(
                  (a, b) => (a.rate ?? 0) - (b.rate ?? 0),
              )
            : undefined,
);

export const selectBestBuyQuoteByPaymentMethod = createMemoizedSelector(
    [selectBuyQuotesByPaymentMethod],
    quotes => getBestRatedQuote(quotes, 'buy'),
);

export const selectTradingExchangeFormStep = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.formStep;

export const selectTradingComposedTransactionInfo = (state: TradingRootState) =>
    state.wallet.tradingNew.composedTransactionInfo;

export const selectTradingAccountAccordingActiveSection = createMemoizedSelector(
    [
        selectTradingExchange,
        ({ wallet }) => wallet.accounts,
        (
            _: TradingRootState,
            activeSection: TradingType,
            selectedAccount: SelectedAccountStatus,
        ) => ({
            selectedAccount,
            activeSection,
        }),
    ],
    (tradingExchange, accounts, params) => {
        if (params.activeSection === 'exchange') {
            return accounts.find(account => account.key === tradingExchange.tradingAccountKey);
        }

        if (params.activeSection === 'sell') return; // TODO: trading - sell

        return params.selectedAccount.account;
    },
);

export const selectValidTradingBuyQuotes = createMemoizedSelector(
    [selectTradingBuyQuotes],
    quotes => {
        if (!quotes) return [];

        return quotes.filter(item => item.rate && item.rate !== 0);
    },
);

export const selectTradingExchangeAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.tradingAccountKey;

export const selectTradingExchangeReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.receiveAccountKey;
