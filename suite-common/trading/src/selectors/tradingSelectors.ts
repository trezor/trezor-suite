import { Coins, CryptoId, FiatCurrencyCode, Platforms } from 'invity-api';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { UnreachableCaseError } from '@suite-common/suite-utils';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DeviceRootState,
    selectAccounts,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';
import addressValidator from '@trezor/address-validator';

import { BuyInfo, TradingBuyState } from '../reducers/buyReducer';
import { ExchangeInfo, TradingExchangeState } from '../reducers/exchangeReducer';
import { SellInfo, TradingSellState } from '../reducers/sellReducer';
import type { TradingState } from '../reducers/tradingReducer';
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

export type TradingSellInfoSelector = Omit<
    SellInfo,
    'supportedCryptoCurrencies' | 'supportedFiatCurrencies'
> & {
    supportedCryptoCurrencies: Set<CryptoId>;
    supportedFiatCurrencies: Set<string>; // TODO: trading - check if can be used FiatCurrencyCode
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
const createMemoizedSelectorWithDeviceAndAccounts = createWeakMapSelector.withTypes<
    TradingRootState & DeviceRootState & AccountsRootState
>();

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

export const selectTradingBuyLoadingTimestampAndStatus = createMemoizedSelector(
    [
        selectTradingLoadingAndTimestamp,
        (state: TradingRootState) => state.wallet.tradingNew.info,
        (state: TradingRootState) => state.wallet.tradingNew.buy.buyInfo,
    ],
    (loadingAndTimestamp, info, buyInfo) => ({
        isLoading: loadingAndTimestamp.isLoading,
        lastLoadedTimestamp: loadingAndTimestamp.lastLoadedTimestamp,
        isFullyLoaded:
            !!(info?.coins && info?.platforms && buyInfo) && buyInfo.buyInfo?.providers.length > 0,
    }),
);

export const selectTradingInfo = (state: TradingRootState) => state.wallet?.tradingNew?.info;

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

export const selectTradingSellInfo = createMemoizedSelector(
    [state => state.wallet.tradingNew.sell],
    (sell): TradingSellInfoSelector | undefined => {
        const { sellInfo } = sell;

        if (!sellInfo) return;

        return {
            ...sellInfo,
            supportedFiatCurrencies: new Set(sellInfo.supportedFiatCurrencies),
            supportedCryptoCurrencies: new Set(sellInfo.supportedCryptoCurrencies),
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

export const selectTradingSell = createMemoizedSelector(
    [state => state.wallet.tradingNew.sell, selectTradingSellInfo],
    (sell, sellInfo) => ({
        ...sell,
        sellInfo,
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

export const selectTradingSellProviders = createMemoizedSelector(
    [selectTradingSellInfo],
    sellInfo => sellInfo?.providerInfos,
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
            return selectTradingSellProviders(state)?.[name];

        default:
            throw new UnreachableCaseError(type, 'Unexpected trade type');
    }
};

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.quotesRequest;

export const selectTradingExchangeQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.quotesRequest;

export const selectTradingSellQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.quotesRequest;

export const selectTradingBuySelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.selectedQuote;

export const selectTradingExchangeSelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.selectedQuote;

export const selectTradingSellSelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.selectedQuote;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.tradingNew.info.paymentMethods;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.tradingNew.trades);

export const selectTradingTradesForSelectedDevice = createMemoizedSelector(
    [selectAccounts, state => state.wallet.selectedAccount, selectTradingTrades],
    (accounts, selectedAccount, trades): TradingTransaction[] =>
        trades.filter(tx => {
            const txDeviceId = accounts.find(
                account => tx.account.descriptor === account.descriptor,
            )?.deviceState;

            return txDeviceId === selectedAccount.account?.deviceState;
        }),
);

export const selectDeviceTradingTrades: (
    state: TradingRootState & AccountsRootState & DeviceRootState,
    tradeType: TradingType,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [
        state => selectDeviceAccounts(state),
        selectTradingTrades,
        (_, tradeType: TradingType) => tradeType,
    ],
    (accounts, trades, tradeType) => {
        const accountDescriptors = new Set(accounts.map(({ descriptor }) => descriptor));

        return returnStableArrayIfEmpty(
            trades.filter(
                trade =>
                    accountDescriptors.has(trade.account?.descriptor) &&
                    trade.tradeType === tradeType,
            ),
        );
    },
);

export const selectDeviceTradingTradesByTradeType: (
    state: TradingRootState & AccountsRootState & DeviceRootState,
    tradeType: TradingType,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [selectDeviceTradingTrades, (_, tradeType: TradingType) => tradeType],
    (trades, tradeType) => returnStableArrayIfEmpty(trades.filter(t => t.tradeType === tradeType)),
);

export const selectDeviceTradingTradesByTradeTypeOrderedByDate: (
    state: TradingRootState & AccountsRootState & DeviceRootState,
    tradeType: TradingType,
) => TradingTransaction[] = createMemoizedSelectorWithDeviceAndAccounts(
    [selectDeviceTradingTradesByTradeType],
    trades => trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);

export const selectDeviceHasTradingTradesOfTradeType = (
    state: TradingRootState & AccountsRootState & DeviceRootState,
    tradeType: TradingType,
) => selectDeviceTradingTradesByTradeType(state, tradeType).length > 0;

export const selectTradingTradeByOrderId = (state: TradingRootState, orderId: string | undefined) =>
    selectTradingTrades(state).find(t => orderId && t.data.orderId === orderId);

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

const getFilteredCryptoIds = (
    supportedCryptoIds: CryptoId[],
    coins: Coins | undefined,
    platforms: Platforms | undefined,
) => {
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
};

export const selectTradingBuySupportedCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.tradingNew.info.coins,
        ({ wallet }) => wallet.tradingNew.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.tradingNew.buy.buyInfo?.supportedCryptoCurrencies,
            ),
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms),
);

export const selectTradingSellSupportedCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.tradingNew.info.coins,
        ({ wallet }) => wallet.tradingNew.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.tradingNew.sell.sellInfo?.supportedCryptoCurrencies,
            ),
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms),
);

export const selectTradingExchangeSellCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.tradingNew.info.coins,
        ({ wallet }) => wallet.tradingNew.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.tradingNew.exchange.exchangeInfo?.sellCryptoIds,
            ),
    ],
    (coins, platforms, sellCryptoIds) => getFilteredCryptoIds(sellCryptoIds, coins, platforms),
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

export const selectTradingSellFormStep = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.formStep;

export const selectTradingComposedTransactionInfo = (state: TradingRootState) =>
    state.wallet.tradingNew.composedTransactionInfo;

export const selectTradingAccountAccordingActiveSection = createMemoizedSelector(
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

export const selectTradingExchangeAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.tradingAccountKey;

export const selectTradingExchangeReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.receiveAccountKey;

export const selectTradingModalAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.modalAccountKey;

export const selectTradingPrefilledFromAccount = (state: TradingRootState) =>
    state.wallet.tradingNew.prefilledFromAccount;

export const selectTradingActiveSection = (state: TradingRootState) =>
    state.wallet.tradingNew.activeSection ?? 'buy';

export const selectTradingSupportedSymbols = createMemoizedSelector(
    [
        (_: TradingRootState, type: TradingType) => type,
        selectTradingBuySupportedCryptoIds,
        selectTradingExchangeSellCryptoIds,
        selectTradingSellSupportedCryptoIds,
    ],
    (type, buyCryptoIds, exchangeCryptoIds, sellCryptoIds) => {
        switch (type) {
            case 'buy':
                return new Set(buyCryptoIds);
            case 'exchange':
                return new Set(exchangeCryptoIds);
            case 'sell':
                return new Set(sellCryptoIds);
        }
    },
);
