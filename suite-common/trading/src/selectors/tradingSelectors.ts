import { CryptoId, FiatCurrencyCode } from 'invity-api';

import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';

import { BuyInfo, TradingBuyState } from '../reducers/buyReducer';
import type { TradingInfo, TradingState } from '../reducers/tradingReducer';
import { InvityServerEnvironment, TradingFiatCurrenciesProps } from '../types';

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

export const selectTradingLoadingAndTimestamp = (state: TradingRootState) => ({
    isLoading: state.wallet.tradingNew.isLoading,
    lastLoadedTimestamp: state.wallet.tradingNew.lastLoadedTimestamp,
});

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

export const cryptoIdToCoinSymbol = (state: TradingRootState, cryptoId: CryptoId) => {
    const { coins = {} } = state.wallet.tradingNew.info;

    return coins[cryptoId]?.symbol?.toUpperCase();
};
