import { Coins, CryptoId, FiatCurrencyCode } from 'invity-api';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbolExtended } from '@suite-common/wallet-config';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';
import addressValidator from '@trezor/address-validator';

import { BuyInfo, TradingBuyState } from '../reducers/buyReducer';
import type { TradingInfo, TradingState } from '../reducers/tradingReducer';
import {
    InvityServerEnvironment,
    TradingFiatCurrenciesProps,
    TradingPaymentMethodProps,
} from '../types';
import {
    cryptoIdToNetwork,
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
import { getBestRatedQuote } from '../utils/tradingUtils';

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

export type TradingStateSelector = Omit<TradingState, 'buy'> & { buy: TradingBuyStateSelector };

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

export const selectTradingBuy = createMemoizedSelector(
    [state => state.wallet.tradingNew.buy, selectTradingBuyInfo],
    (buy, buyInfo) => ({
        ...buy,
        buyInfo,
    }),
);

export const selectTrading = createMemoizedSelector(
    [state => state.wallet.tradingNew, selectTradingBuy],
    (tradingNew, buy): Omit<TradingState, 'buy'> & { buy: TradingBuyStateSelector } => ({
        ...tradingNew,
        buy,
    }),
);

export const selectTradingBuyProviders = createMemoizedSelector(
    [selectTradingBuyInfo],
    buyInfo => buyInfo?.providerInfos,
);

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.quotesRequest;

export const selectTradingBuySelectedQuote = (state: TradingRootState) =>
    state.wallet.tradingNew.buy.selectedQuote;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.tradingNew.info.paymentMethods;

export const selectTradingTrades = (state: TradingRootState) =>
    returnStableArrayIfEmpty(state.wallet.tradingNew.trades);

export const selectTradingCoinInfoByCryptoId = (state: TradingRootState, cryptoId: CryptoId) => {
    const { coins = {} } = state.wallet.tradingNew.info;

    return getTradingCoinInfoByCryptoId(coins, cryptoId);
};

export const selectTradingCoinSymbolByCryptoId = (state: TradingRootState, cryptoId: CryptoId) => {
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

export const selectBestBuyQuoteByPaymentMethod = createMemoizedSelector(
    [
        selectTradingBuyQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) => {
        if (!paymentMethod) {
            return undefined;
        }

        const quotesByPaymentMethod = getTradingQuotesByPaymentMethod<'buy'>(quotes, paymentMethod);

        return getBestRatedQuote(quotesByPaymentMethod, 'buy');
    },
);
