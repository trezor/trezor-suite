import { CryptoId, FiatCurrencyCode } from 'invity-api';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import { AddressDisplayOptions } from '@suite-common/wallet-types/src/settings';

import type { TradingState } from '../reducers/tradingReducer';
import { InvityServerEnvironment, TradingFiatCurrenciesProps } from '../types';

// partial copy of Suite state
export type TradingRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
        accounts: Account[];
        trading: TradingState;
    };
    suite: {
        settings: {
            addressDisplayType: AddressDisplayOptions;
            debug: {
                invityServerEnvironment: InvityServerEnvironment;
            };
        };
    };
};

const createMemoizedSelector = createWeakMapSelector.withTypes<TradingRootState>();

export const selectTradingLoadingAndTimestamp = (state: TradingRootState) => ({
    isLoading: state.wallet.trading.isLoading,
    lastLoadedTimestamp: state.wallet.trading.lastLoadedTimestamp,
});

export const selectTradingInfo = (state: TradingRootState) => state.wallet.trading.info;

export const selectTradingBuyInfo = createMemoizedSelector(
    [state => state.wallet.trading.buy],
    buy => {
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
    [state => state.wallet.trading.buy, selectTradingBuyInfo],
    (buy, buyInfo) => ({
        ...buy,
        ...(buyInfo ?? {}),
    }),
);

export const selectTradingBuyQuotesRequest = (state: TradingRootState) =>
    state.wallet.trading.buy.quotesRequest;

export const selectTradingSelectedAccount = (state: TradingRootState) =>
    state.wallet.selectedAccount;

export const selectTradingSettingEnvironment = (state: TradingRootState) =>
    state.suite.settings.debug.invityServerEnvironment;

export const selectTradingSettingAddressDisplayType = (state: TradingRootState) =>
    state.suite.settings.addressDisplayType;

export const selectTradingPaymentMethods = (state: TradingRootState) =>
    state.wallet.trading.info.paymentMethods;

export const cryptoIdToCoinSymbol = (state: TradingRootState, cryptoId: CryptoId) => {
    const { coins = {} } = state.wallet.trading.info;

    return coins[cryptoId]?.symbol?.toUpperCase();
};
