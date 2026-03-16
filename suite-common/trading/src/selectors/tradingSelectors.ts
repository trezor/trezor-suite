import { type Coins, type CryptoId, type FiatCurrencyCode, type Platforms } from 'invity-api';

import { type DeviceRootState, selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbolExtended, type NetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccounts,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type SelectedAccountStatus } from '@suite-common/wallet-types';
import addressValidator from '@trezor/address-validator';
import { exhaustive } from '@trezor/type-utils';

import { type BuyInfo, type TradingBuyState } from '../reducers/buyReducer';
import { type ExchangeInfo, type TradingExchangeState } from '../reducers/exchangeReducer';
import { type SellInfo, type TradingSellState } from '../reducers/sellReducer';
import type { TradingRootState, TradingState } from '../reducers/tradingCommonReducer';
import {
    type TradingFiatCurrenciesProps,
    type TradingTransaction,
    type TradingType,
} from '../types';
import { cryptoIdToNetwork, isBuyTrade, isExchangeProvider, testnetToProdCryptoId } from '../utils';
import {
    getTradingCoinInfoByCryptoId,
    getTradingCoinSymbolByCryptoId,
    getTradingNativeCoinSymbolByCryptoId,
    getTradingPlatformsInfoByCryptoId,
    getTradingSymbolAndContractAddressByCryptoId,
} from '../utils/infoUtils';

type SelectedAccountRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
    };
};

export type TradingRootStateWithDeviceAndAccounts = TradingRootState &
    DeviceRootState &
    AccountsRootState &
    SelectedAccountRootState;

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
            supportedFiatCurrencies: new Set(buyInfo.supportedFiatCurrencies as FiatCurrencyCode[]),
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

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.buy.quotesRequest;

export const selectTradingExchangeQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.exchange.quotesRequest;

export const selectTradingSellQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.sell.quotesRequest;

export const selectTradingBuySelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.buy.selectedQuote;

export const selectTradingExchangeSelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.exchange.selectedQuote;

export const selectTradingExchangePreselectedQuote = (state: TradingRootState) =>
    state.wallet.trading.exchange.preselectedQuote;

export const selectTradingExchangeActiveQuote = (state: TradingRootState) =>
    selectTradingExchangeSelectedQuote(state) ?? selectTradingExchangePreselectedQuote(state);

export const selectTradingSellSelectedQuote = (state: TradingRootState) =>
    state.wallet.trading.sell.selectedQuote;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.trading.info.paymentMethods;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.trading.trades);

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
    const { coins = {} } = state.wallet.trading.info;

    return getTradingCoinInfoByCryptoId(coins, cryptoId);
};

export const selectTradingCoinSymbolByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId | undefined,
) => {
    if (cryptoId === undefined) {
        return undefined;
    }
    const { coins = {} } = state.wallet.trading.info;

    return getTradingCoinSymbolByCryptoId(coins, cryptoId);
};

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

export const selectTradingNativeCoinSymbolByCryptoId = (
    state: TradingRootState,
    cryptoId: CryptoId,
) => {
    const { coins = {}, platforms = {} } = state.wallet.trading.info;

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
        ({ wallet }: TradingRootState, _: CryptoId): Coins | undefined => wallet.trading.info.coins,
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
        ({ wallet }) => wallet.trading.info.coins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.trading.buy.buyInfo?.supportedCryptoCurrencies,
            ),
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms),
);

export const selectTradingSellSupportedCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.trading.info.coins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) =>
            returnStableArrayIfEmpty<CryptoId>(
                wallet.trading.sell.sellInfo?.supportedCryptoCurrencies,
            ),
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(supportedCryptoIds, coins, platforms),
);

const createExchangeCryptoIdsSelector = (key: 'buyCryptoIds' | 'sellCryptoIds') =>
    createMemoizedSelector(
        [
            ({ wallet }) => wallet.trading.info.coins,
            ({ wallet }) => wallet.trading.info.platforms,
            ({ wallet }) =>
                returnStableArrayIfEmpty<CryptoId>(wallet.trading.exchange.exchangeInfo?.[key]),
        ],
        (coins, platforms, cryptoIds) => getFilteredCryptoIds(cryptoIds, coins, platforms),
    );

export const selectTradingExchangeSellCryptoIds = createExchangeCryptoIdsSelector('sellCryptoIds');
export const selectTradingExchangeBuyCryptoIds = createExchangeCryptoIdsSelector('buyCryptoIds');

export const selectTradingSellSellCryptoIds = createMemoizedSelector(
    [
        ({ wallet }) => wallet.trading.info.coins,
        ({ wallet }) => wallet.trading.info.platforms,
        ({ wallet }) => wallet.trading.sell.sellInfo?.supportedCryptoCurrencies,
    ],
    (coins, platforms, supportedCryptoIds) =>
        getFilteredCryptoIds(
            returnStableArrayIfEmpty<CryptoId>(supportedCryptoIds),
            coins,
            platforms,
        ),
);

export const selectTradingBuyIsLoading = (state: TradingRootState) =>
    state.wallet.trading.buy.isLoading;

export const selectTradingBuyQuotes = (state: TradingRootState) => state.wallet.trading.buy.quotes;

export const selectTradingBuyQuoteByOrderId = (
    state: TradingRootState,
    orderId: string | undefined,
) => (orderId ? state.wallet.trading.buy.quotes.find(q => q.orderId === orderId) : undefined);

export const selectTradingExchangeIsLoading = (state: TradingRootState) =>
    state.wallet.trading.exchange.isLoading;

export const selectTradingSellIsLoading = (state: TradingRootState) =>
    state.wallet.trading.sell.isLoading;

export const selectTradingSellQuotes = (state: TradingRootState) =>
    state.wallet.trading.sell.quotes;

export const selectTradingExchangeFormStep = (state: TradingRootState) =>
    state.wallet.trading.exchange.formStep;

export const selectTradingSellFormStep = (state: TradingRootState) =>
    state.wallet.trading.sell.formStep;

export const selectTradingComposedTransactionInfo = (state: TradingRootState) =>
    state.wallet.trading.composedTransactionInfo;

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

export const selectValidTradingSellQuotes = createMemoizedSelector(
    [selectTradingSellQuotes],
    quotes => {
        if (!quotes) return [];

        return quotes.filter(item => item.rate && item.rate !== 0);
    },
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
    state.wallet.trading.exchange.transactionId;

export const selectTradingSellTransactionId = (state: TradingRootState) =>
    state.wallet.trading.sell.transactionId;

export const selectTradingBuyTransactionId = (state: TradingRootState) =>
    state.wallet.trading.buy.transactionId;

export const selectTradingVerifiedAddress = (state: TradingRootState) =>
    state.wallet.trading.verifiedAddress;

export const selectTradingIsSlip24Allowed = createMemoizedSelectorWithDeviceAndAccounts(
    [
        state => selectDeviceUnavailableCapabilities(state),
        (_: TradingRootState, account: Account | undefined) => account,
        (_: TradingRootState, __: Account | undefined, isSlip24Active: boolean) => isSlip24Active,
    ],
    (unavailableCapabilities, account, isSlip24Active) => {
        if (!account) return false;

        const isFirmwareVersionSlip24Compatible = !unavailableCapabilities?.['slip24'];
        // TODO: slip24 - can be removed when slip24 is enabled for all networks
        const supportedNetworks: NetworkType[] = ['bitcoin', 'ethereum'];
        const isNetworkSupported = supportedNetworks.includes(account.networkType);

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
