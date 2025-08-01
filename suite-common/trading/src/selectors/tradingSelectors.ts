import { Coins, CryptoId, FiatCurrencyCode, Platforms } from 'invity-api';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbolExtended, NetworkType } from '@suite-common/wallet-config';
import {
    selectAccounts,
    selectDeviceAccounts,
    selectDeviceUnavailableCapabilities,
} from '@suite-common/wallet-core';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import addressValidator from '@trezor/address-validator';
import { exhaustive } from '@trezor/type-utils';

import { BuyInfo, TradingBuyState } from '../reducers/buyReducer';
import { ExchangeInfo, TradingExchangeState } from '../reducers/exchangeReducer';
import { SellInfo, TradingSellState } from '../reducers/sellReducer';
import type { TradingState } from '../reducers/tradingReducer';
import {
    TradingFiatCurrenciesProps,
    TradingPaymentMethodProps,
    TradingRootState,
    TradingRootStateWithDeviceAndAccounts,
    TradingTransaction,
    TradingType,
} from '../types';
import {
    cryptoIdToNetwork,
    getBestRatedQuote,
    getTradingQuotesByPaymentMethod,
    isExchangeProvider,
    testnetToProdCryptoId,
} from '../utils';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';

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
    [state => state.wallet.tradingNew.buy.buyInfo],
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
            supportedFiatCurrencies: new Set(buyInfo.supportedFiatCurrencies as FiatCurrencyCode[]),
        };
    },
);

export const selectTradingExchangeInfo = createMemoizedSelector(
    [state => state.wallet.tradingNew.exchange.exchangeInfo],
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
    [state => state.wallet.tradingNew.sell.sellInfo],
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

export const selectTradingExchangeLoadingTimestampAndStatus = createMemoizedSelector(
    [
        selectTradingLoadingAndTimestamp,
        (state: TradingRootState) => state.wallet.tradingNew.info,
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
        (state: TradingRootState) => state.wallet.tradingNew.info,
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

export const selectTradingExchangePreselectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.preselectedQuote;

export const selectTradingSellSelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.selectedQuote;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.tradingNew.info.paymentMethods;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.tradingNew.trades);

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

const createExchangeCryptoIdsSelector = (key: 'buyCryptoIds' | 'sellCryptoIds') =>
    createMemoizedSelector(
        [
            ({ wallet }) => wallet.tradingNew.info.coins,
            ({ wallet }) => wallet.tradingNew.info.platforms,
            ({ wallet }) =>
                returnStableArrayIfEmpty<CryptoId>(wallet.tradingNew.exchange.exchangeInfo?.[key]),
        ],
        (coins, platforms, cryptoIds) => getFilteredCryptoIds(cryptoIds, coins, platforms),
    );

export const selectTradingExchangeSellCryptoIds = createExchangeCryptoIdsSelector('sellCryptoIds');
export const selectTradingExchangeBuyCryptoIds = createExchangeCryptoIdsSelector('buyCryptoIds');

export const selectTradingSellSellCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.tradingNew.info.coins,
        ({ wallet }) => wallet.tradingNew.info.platforms,
        ({ wallet }) => wallet.tradingNew.sell.sellInfo?.supportedCryptoCurrencies,
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(
            returnStableArrayIfEmpty<CryptoId>(supportedCryptoIds),
            coins,
            platforms,
        ),
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

export const selectTradingExchangeIsLoading = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.isLoading;

export const selectTradingSellIsLoading = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.isLoading;

export const selectTradingExchangeFormStep = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.formStep;

export const selectTradingSellFormStep = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.formStep;

export const selectTradingComposedTransactionInfo = (state: TradingRootState) =>
    state.wallet.tradingNew.composedTransactionInfo;

export const selectTradingAccountAccordingActiveSection =
    createMemoizedSelectorWithDeviceAndAccounts(
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

export const selectTradingBuyReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.tradingAccountKey;

export const selectTradingExchangeAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.tradingAccountKey;

export const selectTradingExchangeReceiveAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.exchange.receiveAccountKey;

export const selectTradingModalAccountKey = (state: TradingRootState) =>
    state.wallet.tradingNew.modalAccountKey;

export const selectTradingPrefilledFromAccount = (state: TradingRootState) =>
    state.wallet.tradingNew.prefilledFromAccount;

export const selectTradingActiveSection = (state: TradingRootState) =>
    state.wallet.tradingNew.activeSection;

export const selectTradingSupportedSymbols = createMemoizedSelector(
    [
        selectTradingBuySupportedCryptoIds,
        selectTradingExchangeSellCryptoIds,
        selectTradingSellSupportedCryptoIds,
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
    state.wallet.tradingNew.exchange.transactionId;

export const selectTradingSellTransactionId = (state: TradingRootState) =>
    state.wallet.tradingNew.sell.transactionId;

export const selectTradingVerifiedAddress = (state: TradingRootState) =>
    state.wallet.tradingNew.verifiedAddress;

export const selectTradingIsSlip24Allowed = createMemoizedSelectorWithDeviceAndAccounts(
    [
        state => selectDeviceUnavailableCapabilities(state),
        (_: TradingRootState, account: Account) => account,
        (_: TradingRootState, __: Account, isSlip24Active: boolean) => isSlip24Active,
    ],
    (unavailableCapabilities, account, isSlip24Active) => {
        const isFirmwareVersionSlip24Compatible = !unavailableCapabilities?.['slip24'];
        // TODO: slip24 - can be removed when slip24 is enabled for all networks
        const supportedNetworks: NetworkType[] = ['bitcoin', 'ethereum'];
        const isNetworkSupported = supportedNetworks.includes(account.networkType);

        return isSlip24Active && isFirmwareVersionSlip24Compatible && isNetworkSupported;
    },
);
